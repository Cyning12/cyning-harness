import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveHarnessRootForTarget, wizardScript } from './paths.js';
import { auditTarget } from './audit.js';
import { evaluateGraphDelta, evaluateWikiDelta } from './close-loop-gates.js';
import {
  buildTaskHandoff,
  evaluateInvokeHatsRetention,
  evaluatePre30InvokeHats,
  extractSpecSlug,
  findReview,
  findSpecReview,
  listActiveTasks,
  parseHarnessMeta,
  shouldSkipSpecAudit,
} from './task-meta.js';
import { lintTaskFile } from './task-lint.js';

/**
 * 30 前聚合验证：gate-check + audit D5（仅 --task）+ reviews 留档闸
 *（--task 与全量 · N4/v2.9+）+ task lint WARN（仅 --task · v2.7+）
 * + invoke hats：pre-30 硬闸（仅 --task · 目标 v2.17+）· post-30（如 40）仍 WARN
 * + graph_delta WARN（v2.17+ · 可选 --strict-graph-delta BLOCK）
 * + wiki_delta WARN（v2.18+ · 可选 --strict-wiki-delta BLOCK；close 缺字段为 BLOCK）
 * + S5 git-clean warn + 可选 --graph
 */
export function verifyTarget(target, options = {}) {
  const {
    taskFile,
    graph,
    allowNoReview = false,
    allowLintFail = false,
    allowInvokeGap = false,
    strictGraphDelta = false,
    strictWikiDelta = false,
  } = options;
  const harnessRoot = resolveHarnessRootForTarget(target);

  // 1. gate-check（含 --graph）
  const gateResult = runGateCheck(target, taskFile, graph, harnessRoot);
  if (!gateResult.ok) {
    return {
      ok: false,
      exitCode: 2,
      reason: gateResult.reason,
      stdout: gateResult.stdout,
    };
  }

  // 2. audit D5（仅当指定 task）
  if (taskFile) {
    const audit = auditTarget(target, { taskFile });
    if (!audit.ok) {
      return {
        ok: false,
        exitCode: 2,
        reason: audit.test.ok ? 'gate-check 或 audit 未通过' : audit.test.reason,
        stdout: gateResult.stdout,
      };
    }

    // 3. reviews 留档闸（G2 · v2.5+）：R<n> 审查文存在性（存在性=机器 · 结论=人签）
    const review = findReview(target, taskFile);
    if (!review.found) {
      if (allowNoReview) {
        gateResult.stdout += `WARN: missing R<n> review（--allow-no-review 豁免 · 留痕）\n`;
      } else {
        return {
          ok: false,
          exitCode: 2,
          reason: 'missing R<n> review（docs/harness/reviews/ 无该 task 的 _audit_R 文件 · 20 补审或 --allow-no-review）',
          stdout: gateResult.stdout,
        };
      }
    }

    // 3b. task lint（N2 · v2.7+）：severity=warn · 不改 exit / may_start_30
    const lint = runTaskLintForVerify(target, taskFile);
    if (!lint.ok) {
      if (allowLintFail) {
        gateResult.stdout += `WARN: task lint FAIL suppressed（--allow-lint-fail · 留痕）\n`;
      } else {
        const rules = lint.errors.map((e) => e.rule).join(',');
        gateResult.stdout += `WARN: task lint FAIL · ${rules || 'errors'}（不挡 may_start_30 · 修结构或 --allow-lint-fail）\n`;
      }
    }

    // 3d. invoke hats（目标 v2.17+）：pre-30（required∩{10,20,00}）硬闸 · post（如 40）WARN
    const absTask = path.isAbsolute(taskFile)
      ? taskFile
      : path.join(target, taskFile);
    if (fs.existsSync(absTask)) {
      const content = fs.readFileSync(absTask, 'utf8');
      const meta = parseHarnessMeta(content);
      const slug = meta.task_slug;
      if (slug) {
        const invokeDir = path.join(
          target,
          'docs/harness/invokes/by-task',
          slug,
        );
        const hatsEval = evaluateInvokeHatsRetention(meta, invokeDir);
        const pre30 = evaluatePre30InvokeHats(meta, invokeDir);

        if (!pre30.ok) {
          const detail =
            pre30.missingDir || pre30.files.length === 0
              ? `目录缺失/空 · pre-30 要求 ${pre30.preRequired.join(',')}`
              : `缺 ${pre30.preMissing.join(',')}（pre-30 要求 ${pre30.preRequired.join(',')} · 已有 ${pre30.covered.join(',') || '∅'}）`;
          if (allowInvokeGap) {
            gateResult.stdout += `WARN: missing pre-30 invoke hats suppressed（--allow-invoke-gap · 留痕）· ${detail}\n`;
          } else {
            return {
              ok: false,
              exitCode: 2,
              reason: `missing pre-30 invoke hats · ${detail}`,
              stdout: gateResult.stdout,
            };
          }
        }

        // post-30（40/30/CLOSE 等）缺口：仍 WARN，不挡 may_start_30
        if (pre30.postMissing.length > 0) {
          const detail = `缺 ${pre30.postMissing.join(',')}（要求 ${hatsEval.required.join(',')} · 已有 ${hatsEval.covered.join(',') || '∅'}）`;
          gateResult.stdout += `WARN: invoke hats gap · ${detail}（不挡 may_start_30 · close 前须补齐或 --allow-invoke-gap）\n`;
        }
      }

      // 3e. graph_delta（v2.17+）：默认 WARN 不挡 30；--strict-graph-delta 对 fail 级 BLOCK
      const gd = evaluateGraphDelta(meta, { repoRoot: target });
      if (gd.status === 'warn') {
        gateResult.stdout += `WARN: graph_delta · ${gd.detail}\n`;
      } else if (gd.status === 'fail') {
        if (strictGraphDelta) {
          return {
            ok: false,
            exitCode: 2,
            reason: `graph_delta · ${gd.detail}`,
            stdout: gateResult.stdout,
          };
        }
        gateResult.stdout += `WARN: graph_delta · ${gd.detail}（不挡 may_start_30 · close 将 BLOCK · 或 --strict-graph-delta）\n`;
      }

      // 3f. wiki_delta（v2.18+）：默认 WARN 不挡 30；--strict-wiki-delta 对 fail 级 BLOCK
      const wd = evaluateWikiDelta(meta, { repoRoot: target });
      if (wd.status === 'warn') {
        gateResult.stdout += `WARN: wiki_delta · ${wd.detail}\n`;
      } else if (wd.status === 'fail') {
        if (strictWikiDelta) {
          return {
            ok: false,
            exitCode: 2,
            reason: `wiki_delta · ${wd.detail}`,
            stdout: gateResult.stdout,
          };
        }
        gateResult.stdout += `WARN: wiki_delta · ${wd.detail}（不挡 may_start_30 · close 将 BLOCK · 或 --strict-wiki-delta）\n`;
      }
    }
  } else {
    // 3c. 全量 reviews 闸（N4 · v2.9+）：不跑 lint / D5
    const taskFiles = listActiveTasks(target);
    const missing = [];
    for (const tf of taskFiles) {
      if (!findReview(target, tf).found) missing.push(path.basename(tf));
    }
    if (missing.length > 0) {
      const detail = `${missing.length}/${taskFiles.length} tasks · ${missing.join(', ')}`;
      if (allowNoReview) {
        gateResult.stdout += `WARN: missing R<n> review（--allow-no-review 豁免 · 留痕）· ${detail}\n`;
      } else {
        return {
          ok: false,
          exitCode: 2,
          reason: `missing R<n> review（${detail}）`,
          stdout: gateResult.stdout,
        };
      }
    }
  }

  // 4. S5 git-clean：warn 不挡
  const gitResult = runGitCleanCheck(target);
  if (gitResult.dirty) {
    const warn = `WARN: 工作区未 clean（S5）：建议 commit 后再执行 apply\n`;
    gateResult.stdout += warn;
  }

  return {
    ok: true,
    exitCode: 0,
    stdout: gateResult.stdout,
  };
}

function runTaskLintForVerify(target, taskFile) {
  try {
    return lintTaskFile(taskFile, { cwd: target });
  } catch (err) {
    return {
      ok: false,
      errors: [{ rule: 'E_IO', message: err.message }],
      warnings: [],
    };
  }
}

/**
 * SPEC→00 前验证（N3 · v2.8+）：仅查 SPEC 审查文存在性。
 * 不跑 gate-check / audit D5 / task lint（与 --task 模式分离）。
 */
export function verifySpecTarget(target, options = {}) {
  const { specFile, workspaceRoot, allowNoSpecReview = false } = options;
  let stdout = '';

  if (!specFile) {
    return {
      ok: false,
      exitCode: 1,
      reason: 'verify --spec 须指定 SPEC 文件路径',
      stdout,
    };
  }

  const absSpec = path.isAbsolute(specFile)
    ? specFile
    : path.resolve(target, specFile);
  if (!fs.existsSync(absSpec)) {
    return {
      ok: false,
      exitCode: 1,
      reason: `SPEC 文件不存在: ${specFile}`,
      stdout,
    };
  }

  const content = fs.readFileSync(absSpec, 'utf8');
  if (shouldSkipSpecAudit(content)) {
    stdout += `INFO: skip SPEC review gate（bugfix / skip_spec_audit）\n`;
    return { ok: true, exitCode: 0, stdout, skipped: true };
  }

  const review = findSpecReview(absSpec, { target, workspaceRoot });
  if (!review.found) {
    if (allowNoSpecReview) {
      stdout += `WARN: missing SPEC R<n> review（--allow-no-spec-review 豁免 · 留痕）\n`;
      return { ok: true, exitCode: 0, stdout, skipped: false };
    }
    return {
      ok: false,
      exitCode: 2,
      reason:
        'missing SPEC R<n> review（docs/harness/reviews/ 无 spec_*_audit_R / *_ACCEPT_R · 20-spec-audit 或 --allow-no-spec-review）',
      stdout,
    };
  }

  return { ok: true, exitCode: 0, stdout, skipped: false };
}

/** SPEC 模式 handoff（verify --spec --json） */
export function buildSpecVerifyHandoff(target, options = {}) {
  const { specFile, workspaceRoot, allowNoSpecReview = false } = options;
  const absSpec = path.isAbsolute(specFile)
    ? specFile
    : path.resolve(target, specFile);
  const content = fs.existsSync(absSpec) ? fs.readFileSync(absSpec, 'utf8') : '';
  const skipped = shouldSkipSpecAudit(content);
  const review = skipped
    ? { found: false, latest: null, rounds: [], matched_pattern: null }
    : findSpecReview(absSpec, { target, workspaceRoot });

  const reviewOk = skipped || review.found || allowNoSpecReview;
  let blocked_reason = null;
  if (!reviewOk) {
    blocked_reason = 'missing SPEC R<n> review';
  }

  return {
    schema_version: '1',
    mode: 'spec',
    verify_ok: reviewOk,
    may_start_00: reviewOk,
    spec: path.basename(specFile),
    spec_path: specFile.replace(/\\/g, '/'),
    spec_slug: content ? extractSpecSlug(absSpec, content) : null,
    spec_review_found: Boolean(review.found),
    spec_review_latest: review.latest,
    spec_review_rounds: review.rounds ?? [],
    spec_review_skipped: skipped,
    spec_review_suppressed: Boolean(allowNoSpecReview && !review.found && !skipped),
    matched_pattern: review.matched_pattern ?? null,
    blocked_reason,
    next_hat: reviewOk ? '00' : null,
  };
}

/** 规范化 lint 结果供 handoff */
export function lintSnapshotForHandoff(target, taskFile, { allowLintFail = false } = {}) {
  if (!taskFile) return null;
  let result;
  try {
    result = lintTaskFile(taskFile, { cwd: target });
  } catch (err) {
    result = {
      ok: false,
      errors: [{ rule: 'E_IO', message: err.message }],
      warnings: [],
    };
  }
  return {
    ok: result.ok,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
    suppressed: Boolean(allowLintFail && !result.ok),
  };
}

function runGateCheck(target, taskFile, graph, harnessRoot) {
  const script = wizardScript(harnessRoot, 'gate-check.sh');
  const args = [script, '--target', target];
  if (taskFile) args.push('--task', taskFile);
  if (graph) args.push('--graph');

  const result = spawnSync('bash', args, {
    encoding: 'utf8',
    env: { ...process.env, CYNING_HARNESS: harnessRoot },
  });

  if (result.status !== 0) {
    return {
      ok: false,
      status: result.status,
      stdout: result.stdout,
      reason: extractBlockReason(result.stdout, taskFile),
    };
  }

  return {
    ok: true,
    status: 0,
    stdout: result.stdout,
  };
}

function extractBlockReason(stdout, taskFile) {
  const taskBasename = taskFile ? path.basename(taskFile) : undefined;
  const sections = splitGateCheckTaskSections(stdout);

  if (taskBasename) {
    const section = sections.get(taskBasename) ?? stdout;
    const arrows = extractArrowBlockLines(section);
    if (arrows.length > 0) return arrows[0];
    return 'gate-check blocked';
  }

  const blocked = [];
  for (const [name, section] of sections) {
    const arrows = extractArrowBlockLines(section);
    if (arrows.length > 0) {
      blocked.push({ name, reason: arrows[0] });
    }
  }

  if (blocked.length === 0) return 'gate-check blocked';

  const total = sections.size;
  if (blocked.length === 1) {
    const { name, reason } = blocked[0];
    return total === 1 ? reason : `${name} · ${reason}`;
  }

  const names = blocked.map((b) => b.name).join(', ');
  return `${blocked.length}/${total} tasks blocked · ${names}`;
}

/** 按 gate-check 输出的 `task: xxx.md` 切段 */
function splitGateCheckTaskSections(stdout) {
  const map = new Map();
  let current = null;
  const lines = [];

  const flush = () => {
    if (current) map.set(current, lines.join('\n'));
  };

  for (const line of stdout.split('\n')) {
    const match = line.match(/^task: (.+\.md)\s*$/);
    if (match) {
      flush();
      current = match[1];
      lines.length = 0;
      lines.push(line);
    } else if (current) {
      lines.push(line);
    }
  }
  flush();
  return map;
}

/** 只认 gate-check 的 `→ 30 不可开工` 行，避免误匹配表格里的 `❌ 拒 30` */
function extractArrowBlockLines(section) {
  return section
    .split('\n')
    .filter((line) => line.trimStart().startsWith('→ 30 不可开工'))
    .map((line) => line.trim().replace(/^→\s*/, ''));
}

function runGitCleanCheck(target) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
    cwd: target,
  });

  const dirty = result.status === 0 && result.stdout.trim().length > 0;
  return { dirty };
}

/**
 * 构建 verify --json / --agent-hint 的 Agent handoff 载荷。
 */
export function buildVerifyHandoff(target, options = {}) {
  const {
    taskFile,
    workspaceRoot,
    allowNoReview = false,
    allowLintFail = false,
    allowInvokeGap = false,
  } = options;
  const handoffOpts = { workspaceRoot };

  if (taskFile) {
    const handoff = buildTaskHandoff(target, taskFile, handoffOpts);
    const reviewOk = handoff.review_found || allowNoReview;
    const pre30Snap = invokePre30Snapshot(target, taskFile, allowInvokeGap);
    const invokePre30Ok = pre30Snap.invoke_pre30_ok;
    const verifyOk = handoff.may_start_30 && reviewOk && invokePre30Ok;
    const lint = lintSnapshotForHandoff(target, taskFile, { allowLintFail });
    let blocked_reason = handoff.blocked_reason;
    if (!blocked_reason && !reviewOk) blocked_reason = 'missing R<n> review';
    if (!blocked_reason && !invokePre30Ok) {
      blocked_reason = 'missing pre-30 invoke hats';
    }
    return {
      schema_version: '1',
      verify_ok: verifyOk,
      ...handoff,
      may_start_30: verifyOk,
      blocked_reason,
      next_hat: verifyOk ? '30' : null,
      lint,
      ...pre30Snap,
    };
  }

  const taskFiles = listActiveTasks(target);
  const tasks = taskFiles.map((tf) => {
    const handoff = buildTaskHandoff(target, tf, handoffOpts);
    const reviewOk = handoff.review_found || allowNoReview;
    const verifyOk = handoff.may_start_30 && reviewOk;
    return {
      schema_version: '1',
      verify_ok: verifyOk,
      ...handoff,
      may_start_30: verifyOk,
      blocked_reason: handoff.blocked_reason ?? (reviewOk ? null : 'missing R<n> review'),
      next_hat: verifyOk ? '30' : null,
    };
  });

  const verifyOk = tasks.length > 0 && tasks.every((t) => t.verify_ok);
  return {
    schema_version: '1',
    verify_ok: verifyOk,
    tasks,
  };
}

/** --json handoff：pre-30 invoke 快照（仅 --task） */
function invokePre30Snapshot(target, taskFile, allowInvokeGap) {
  const absTask = path.isAbsolute(taskFile)
    ? taskFile
    : path.join(target, taskFile);
  if (!fs.existsSync(absTask)) {
    return {
      invoke_pre30_ok: true,
      invoke_pre30_skipped: true,
      invoke_pre30_missing: [],
      invoke_pre30_suppressed: false,
    };
  }
  const content = fs.readFileSync(absTask, 'utf8');
  const meta = parseHarnessMeta(content);
  const slug = meta.task_slug;
  if (!slug) {
    return {
      invoke_pre30_ok: true,
      invoke_pre30_skipped: true,
      invoke_pre30_missing: [],
      invoke_pre30_suppressed: false,
    };
  }
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task', slug);
  const pre30 = evaluatePre30InvokeHats(meta, invokeDir);
  const suppressed = Boolean(allowInvokeGap && !pre30.ok);
  return {
    invoke_pre30_ok: pre30.ok || suppressed,
    invoke_pre30_skipped: Boolean(pre30.skipped),
    invoke_pre30_missing: pre30.preMissing,
    invoke_pre30_required: pre30.preRequired,
    invoke_pre30_suppressed: suppressed,
  };
}

/**
 * 人类可读的 --agent-hint（5–10 行）。
 */
export function formatAgentHint(payload) {
  const lines = ['=== Harness verify · agent-hint ==='];

  if (payload.mode === 'spec') {
    lines.push(`spec: ${payload.spec}`);
    lines.push(`  may_start_00: ${payload.may_start_00}`);
    if (payload.blocked_reason) lines.push(`  blocked: ${payload.blocked_reason}`);
    if (payload.spec_review_latest) lines.push(`  review: ${payload.spec_review_latest}`);
    if (payload.spec_review_skipped) lines.push(`  review: skipped`);
    if (payload.next_hat) lines.push(`  next_hat: ${payload.next_hat}`);
    return lines.join('\n').trimEnd();
  }

  const items = payload.tasks ?? [payload];
  for (const item of items) {
    lines.push(`task: ${item.task}`);
    lines.push(`  may_start_30: ${item.may_start_30}`);
    if (item.blocked_reason) {
      lines.push(`  blocked: ${item.blocked_reason}`);
    }
    if (item.review_path) {
      lines.push(`  review: ${item.review_path}`);
    }
    if (item.entry_invoke_30) {
      lines.push(`  entry_invoke_30: ${item.entry_invoke_30}`);
      if (item.entry_invoke_30_resolved) {
        lines.push(`  resolved: ${item.entry_invoke_30_resolved}`);
      }
    }
    if (item.next_hat) {
      lines.push(`  next_hat: ${item.next_hat}`);
    }
    if (item.lint) {
      const n = item.lint.errors?.length ?? 0;
      const tag = item.lint.suppressed ? 'suppressed' : item.lint.ok ? 'ok' : `FAIL(${n})`;
      lines.push(`  lint: ${tag}`);
    }
    for (const w of item.warnings ?? []) {
      lines.push(`  warn: ${w}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
