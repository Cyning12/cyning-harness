import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateExperienceCapture,
  evaluateGraphDelta,
  evaluateKpiCloseScore,
  evaluateWikiDelta,
  evaluateWikiPromotionPointer,
} from './close-loop-gates.js';
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
 * close 机械校验（结构化 · 供 task close 与 lifecycle dry-run 共用）。
 * 不应用 --allow-*（豁免由调用方处理）；不 mv。
 *
 * @returns {{
 *   file: string,
 *   slug: string|null,
 *   fileSlug: string,
 *   repoRoot: string|null,
 *   inActive: boolean,
 *   invoke_hats: object|null,
 *   checks: Record<string, { status: 'pass'|'fail'|'warn', detail: string }>,
 * }}
 */
export function evaluateCloseChecks(filePath, options = {}) {
  const { cwd = process.cwd() } = options;
  const abs = path.resolve(cwd, filePath);

  const emptyFail = (detail) => ({
    file: abs,
    slug: null,
    fileSlug: extractTaskSlug(abs),
    repoRoot: null,
    inActive: false,
    invoke_hats: null,
    checks: {
      close_invoke: { status: 'fail', detail },
      close_self_check: { status: 'fail', detail },
      close_acceptance: { status: 'fail', detail },
      close_slug: { status: 'fail', detail },
      close_status: { status: 'fail', detail },
      close_review: { status: 'fail', detail },
      close_graph_delta: { status: 'fail', detail },
      close_kpi: { status: 'fail', detail },
      close_experience: { status: 'fail', detail },
      close_wiki_delta: { status: 'fail', detail },
      close_wiki_promotion: { status: 'fail', detail },
    },
  });

  if (!fs.existsSync(abs)) {
    return emptyFail(`task 文件不存在: ${filePath}`);
  }

  const content = fs.readFileSync(abs, 'utf8');
  const meta = parseHarnessMeta(content);
  const fileSlug = extractTaskSlug(abs);
  const slug = meta.task_slug ?? null;
  const activeDir = path.dirname(abs);
  const inActive = path.basename(activeDir) === 'active';
  const repoRoot = findRepoRoot(activeDir);

  const checks = {};

  // close_slug
  if (!slug) {
    checks.close_slug = { status: 'fail', detail: 'Harness 元信息表缺 task_slug' };
  } else if (normalizeSlug(slug) !== normalizeSlug(fileSlug)) {
    checks.close_slug = {
      status: 'fail',
      detail: `slug 不一致: 文件名 ${fileSlug} ≠ 元信息 task_slug ${slug}`,
    };
  } else {
    checks.close_slug = { status: 'pass', detail: `slug=${slug}` };
  }

  // close_invoke
  let invokeHatsEval = null;
  if (!repoRoot) {
    checks.close_invoke = {
      status: 'fail',
      detail: `无法定位 repo root（${activeDir} 无 docs 祖先）`,
    };
  } else if (!slug) {
    checks.close_invoke = { status: 'fail', detail: '无 task_slug · 无法解析 invoke 目录' };
  } else {
    const invokeDir = path.join(repoRoot, 'docs/harness/invokes/by-task', slug);
    invokeHatsEval = evaluateInvokeHatsRetention(meta, invokeDir);
    const relDir = path.relative(repoRoot, invokeDir).replace(/\\/g, '/');
    if (invokeHatsEval.missingDir || invokeHatsEval.files.length === 0) {
      checks.close_invoke = {
        status: 'fail',
        detail: `missing invoke snapshots: ${relDir} 不存在或无 .md（要求 hats: ${invokeHatsEval.required.join(',')})`,
      };
    } else if (invokeHatsEval.missing.length > 0) {
      checks.close_invoke = {
        status: 'fail',
        detail:
          `missing invoke hats: ${invokeHatsEval.missing.join(',')} ` +
          `（要求 ${invokeHatsEval.required.join(',')} · 已有 ${invokeHatsEval.covered.join(',') || '∅'} · ` +
          `source=${invokeHatsEval.resolution.source}` +
          `${invokeHatsEval.resolution.unknown_profile ? ` · unknown_profile=${invokeHatsEval.resolution.unknown_profile}` : ''}）`,
      };
    } else {
      const note = invokeHatsEval.resolution.unknown_profile
        ? ` · unknown_profile=${invokeHatsEval.resolution.unknown_profile} 已回退 default`
        : '';
      checks.close_invoke = {
        status: 'pass',
        detail: `hats ok · ${invokeHatsEval.required.join(',')}${note}`,
      };
    }
  }

  // close_self_check
  const selfCheck = extractSection(content, '### 自检结论', '\n##');
  if (!selfCheck) {
    checks.close_self_check = { status: 'fail', detail: '缺 ### 自检结论 节' };
  } else {
    const bodyLines = selfCheck
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    const substantive = bodyLines.filter((l) => !PLACEHOLDER_RE.test(l));
    if (substantive.length === 0) {
      checks.close_self_check = {
        status: 'fail',
        detail: '自检结论未回填（空或纯占位符）',
      };
    } else {
      checks.close_self_check = { status: 'pass', detail: '自检结论已回填' };
    }
  }

  // close_acceptance
  const acceptance = extractSection(content, '## 验收标准', '\n##');
  if (!acceptance) {
    checks.close_acceptance = { status: 'fail', detail: '缺 ## 验收标准 节' };
  } else {
    const unchecked = acceptance.split('\n').filter((l) => UNCHECKED_RE.test(l));
    if (unchecked.length > 0) {
      checks.close_acceptance = {
        status: 'fail',
        detail: `验收标准 ${unchecked.length} 项未勾选`,
      };
    } else {
      checks.close_acceptance = { status: 'pass', detail: '验收标准已勾选' };
    }
  }

  // close_status
  const statusLine = content.split('\n').find((l) => STATUS_RE.test(l));
  const status = statusLine ? statusLine.match(STATUS_RE)[1].toLowerCase() : null;
  if (!status) {
    checks.close_status = { status: 'fail', detail: '未找到 > **状态** 行' };
  } else if (!CLOSE_STATUSES.has(status)) {
    checks.close_status = {
      status: 'fail',
      detail: `状态非 done/completed（当前: ${status}）`,
    };
  } else {
    checks.close_status = { status: 'pass', detail: `status=${status}` };
  }

  // close_review
  if (!repoRoot) {
    checks.close_review = {
      status: 'fail',
      detail: '无法定位 repo root · 无法查 reviews',
    };
  } else {
    const review = findReview(repoRoot, abs);
    if (review.found) {
      checks.close_review = { status: 'pass', detail: review.latest };
    } else {
      checks.close_review = { status: 'fail', detail: 'missing R<n> review' };
    }
  }

  // close_graph_delta（G1 · v2.17+）
  const gd = evaluateGraphDelta(meta, { repoRoot });
  checks.close_graph_delta = { status: gd.status, detail: gd.detail };

  // close_kpi（G3 · v2.17+）
  const kpi = evaluateKpiCloseScore(content, meta);
  checks.close_kpi = { status: kpi.status, detail: kpi.detail };

  // close_experience（G4 · v2.17+）
  const exp = evaluateExperienceCapture(content, meta);
  checks.close_experience = { status: exp.status, detail: exp.detail };

  // close_wiki_delta（P0 · v2.18+）
  const wd = evaluateWikiDelta(meta, { repoRoot });
  checks.close_wiki_delta = { status: wd.status, detail: wd.detail };

  // close_wiki_promotion（P1 · v2.18+）
  const wp = evaluateWikiPromotionPointer(content, meta);
  checks.close_wiki_promotion = { status: wp.status, detail: wp.detail };

  return {
    file: abs,
    slug: slug ?? fileSlug,
    fileSlug,
    repoRoot,
    inActive,
    invoke_hats: invokeHatsEval
      ? {
          required: invokeHatsEval.required,
          covered: invokeHatsEval.covered,
          missing: invokeHatsEval.missing,
          source: invokeHatsEval.resolution.source,
        }
      : null,
    checks,
  };
}

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
    allowKpiGap = false,
    allowExperienceGap = false,
    allowWikiGap = false,
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

  const evaluated = evaluateCloseChecks(filePath, { cwd });
  const { checks, inActive, slug, fileSlug, invoke_hats: invokeHats } = evaluated;

  const pushCheck = (id, allow, allowLabel) => {
    const c = checks[id];
    if (!c) return;
    if (c.status === 'pass') {
      if (id === 'close_invoke' && /unknown_profile=/.test(c.detail)) {
        warnings.push(
          `warn: unknown invoke_retention_profile（已回退 default）· ${c.detail}`,
        );
      }
      return;
    }
    if (c.status === 'warn') {
      warnings.push(`warn: ${c.detail}`);
      return;
    }
    if (allow) {
      warnings.push(`warn: ${c.detail}（${allowLabel} 豁免 · 留痕）`);
    } else {
      blockers.push(
        id === 'close_acceptance'
          ? `${c.detail}（或 --allow-unchecked 显式豁免）`
          : id === 'close_review'
            ? 'missing R<n> review（docs/harness/reviews/ 无该 task 的 _audit_R 文件 · 或 --allow-no-review）'
            : c.detail,
      );
    }
  };

  pushCheck('close_slug', false);
  pushCheck('close_invoke', allowInvokeGap, '--allow-invoke-gap');
  pushCheck('close_self_check', false);
  pushCheck('close_acceptance', allowUnchecked, '--allow-unchecked');
  pushCheck('close_status', false);
  pushCheck('close_review', allowNoReview, '--allow-no-review');
  pushCheck('close_graph_delta', false);
  pushCheck('close_kpi', allowKpiGap, '--allow-kpi-gap');
  pushCheck('close_experience', allowExperienceGap, '--allow-experience-gap');
  pushCheck('close_wiki_delta', allowWikiGap, '--allow-wiki-gap');
  pushCheck('close_wiki_promotion', allowWikiGap, '--allow-wiki-gap');

  // 归档目标（布局约束 · 非 yaml 守卫）
  const activeDir = path.dirname(abs);
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
    invoke_hats: invokeHats,
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
