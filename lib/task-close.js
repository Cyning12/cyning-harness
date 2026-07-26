import fs from 'node:fs';
import path from 'node:path';
import {
  CLOSE_STATUSES,
  PLACEHOLDER_RE,
  STATUS_RE,
  UNCHECKED_RE,
  evaluateInvokeHatsRetention,
  extractSection,
  extractTaskSlug,
  findReview,
  normalizeSlug,
  parseHarnessMeta,
} from './task-meta.js';

/**
 * task close 机械校验 + 归档执行。
 * 任一校验失败 → ok:false + blockers[]，绝不 mv。
 * 默认 dry-run（只检不 mv）；yes=true 才执行归档。
 */
export function closeTaskFile(filePath, options = {}) {
  const {
    yes = false,
    target: targetArg,
    allowUnchecked = false,
    allowNoReview = false,
    allowInvokeGap = false,
    cwd = process.cwd(),
  } = options;

  const abs = path.resolve(cwd, filePath);
  const blockers = [];
  const warnings = [];

  if (!fs.existsSync(abs)) {
    return {
      ok: false,
      blockers: [`task 文件不存在: ${filePath}`],
      warnings,
      file: abs,
      slug: extractTaskSlug(abs),
      dest: null,
      dryRun: !yes,
      moved: false,
    };
  }

  const content = fs.readFileSync(abs, 'utf8');
  const meta = parseHarnessMeta(content);
  const fileSlug = extractTaskSlug(abs);
  const slug = meta.task_slug ?? null;

  // 检查 4 · task_slug 一致（下划线/连字符惯例等价）
  if (!slug) {
    blockers.push('Harness 元信息表缺 task_slug');
  } else if (normalizeSlug(slug) !== normalizeSlug(fileSlug)) {
    blockers.push(`slug 不一致: 文件名 ${fileSlug} ≠ 元信息 task_slug ${slug}`);
  }

  // 布局推导：active/ 同级 done/ · repo root（docs 祖先）
  const activeDir = path.dirname(abs);
  const inActive = path.basename(activeDir) === 'active';
  const repoRoot = findRepoRoot(activeDir);

  // 检查 1 · invoke 留档（v2.12+：按 required_invoke_hats / profile 集合覆盖）
  let invokeHatsEval = null;
  if (!repoRoot) {
    blockers.push(`无法定位 repo root（${activeDir} 无 docs 祖先）`);
  } else if (slug) {
    const invokeDir = path.join(
      repoRoot,
      'docs/harness/invokes/by-task',
      slug,
    );
    invokeHatsEval = evaluateInvokeHatsRetention(meta, invokeDir);
    const relDir = path.relative(repoRoot, invokeDir).replace(/\\/g, '/');
    if (invokeHatsEval.missingDir || invokeHatsEval.files.length === 0) {
      const msg = `missing invoke snapshots: ${relDir} 不存在或无 .md（要求 hats: ${invokeHatsEval.required.join(',')})`;
      if (allowInvokeGap) {
        warnings.push(`warn: ${msg}（--allow-invoke-gap 豁免 · 留痕）`);
      } else {
        blockers.push(msg);
      }
    } else if (invokeHatsEval.missing.length > 0) {
      const msg =
        `missing invoke hats: ${invokeHatsEval.missing.join(',')} ` +
        `（要求 ${invokeHatsEval.required.join(',')} · 已有 ${invokeHatsEval.covered.join(',') || '∅'} · ` +
        `source=${invokeHatsEval.resolution.source}` +
        `${invokeHatsEval.resolution.unknown_profile ? ` · unknown_profile=${invokeHatsEval.resolution.unknown_profile}` : ''}）`;
      if (allowInvokeGap) {
        warnings.push(`warn: ${msg}（--allow-invoke-gap 豁免 · 留痕）`);
      } else {
        blockers.push(msg);
      }
    } else if (invokeHatsEval.resolution.unknown_profile) {
      warnings.push(
        `warn: unknown invoke_retention_profile '${invokeHatsEval.resolution.unknown_profile}' · 已回退 default`,
      );
    }
  }

  // 检查 2 · 自检结论回填
  const selfCheck = extractSection(content, '### 自检结论', '\n##');
  if (!selfCheck) {
    blockers.push('缺 ### 自检结论 节');
  } else {
    const bodyLines = selfCheck
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    const substantive = bodyLines.filter((l) => !PLACEHOLDER_RE.test(l));
    if (substantive.length === 0) {
      blockers.push('自检结论未回填（空或纯占位符）');
    }
  }

  // 检查 3 · 验收标准勾选
  const acceptance = extractSection(content, '## 验收标准', '\n##');
  if (!acceptance) {
    blockers.push('缺 ## 验收标准 节');
  } else {
    const unchecked = acceptance
      .split('\n')
      .filter((l) => UNCHECKED_RE.test(l));
    if (unchecked.length > 0) {
      if (allowUnchecked) {
        warnings.push(`warn: 验收标准 ${unchecked.length} 项未勾选（--allow-unchecked 豁免）`);
      } else {
        blockers.push(
          `验收标准 ${unchecked.length} 项未勾选（或 --allow-unchecked 显式豁免）`,
        );
      }
    }
  }

  // 检查 5 · 状态字段
  const statusLine = content.split('\n').find((l) => STATUS_RE.test(l));
  const status = statusLine ? statusLine.match(STATUS_RE)[1].toLowerCase() : null;
  if (!status) {
    blockers.push('未找到 > **状态** 行');
  } else if (!CLOSE_STATUSES.has(status)) {
    blockers.push(`状态非 done/completed（当前: ${status}）`);
  }

  // 检查 6 · R<n> 审查文留档（G2 · v2.5+）
  if (repoRoot) {
    const review = findReview(repoRoot, abs);
    if (!review.found) {
      if (allowNoReview) {
        warnings.push('warn: missing R<n> review（--allow-no-review 豁免 · 留痕）');
      } else {
        blockers.push(
          'missing R<n> review（docs/harness/reviews/ 无该 task 的 _audit_R 文件 · 或 --allow-no-review）',
        );
      }
    }
  }

  // 归档目标
  let dest = null;
  if (targetArg) {
    dest = path.resolve(cwd, targetArg);
  } else if (!inActive) {
    blockers.push('源文件不在 */active/ 且未指定 --target（拒绝对 done 文件二次 close）');
  } else {
    dest = path.join(path.dirname(activeDir), 'done', path.basename(abs));
  }
  if (dest && fs.existsSync(dest)) {
    blockers.push(`目标已存在（不覆盖）: ${dest}`);
  }

  const ok = blockers.length === 0;
  let moved = false;
  if (ok && yes && dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(abs, dest);
    moved = true;
  }

  return {
    ok,
    blockers,
    warnings,
    file: abs,
    slug: slug ?? fileSlug,
    dest,
    dryRun: !yes,
    moved,
    invoke_hats: invokeHatsEval
      ? {
          required: invokeHatsEval.required,
          covered: invokeHatsEval.covered,
          missing: invokeHatsEval.missing,
          source: invokeHatsEval.resolution.source,
        }
      : null,
  };
}

/** 从 startDir 上溯找到 basename === 'docs' 的祖先，返回其父（repo root）；找不到返回 null */
function findRepoRoot(startDir) {
  let cur = startDir;
  while (true) {
    if (path.basename(cur) === 'docs') return path.dirname(cur);
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}
