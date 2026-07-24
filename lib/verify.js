import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { resolveHarnessRootForTarget, wizardScript } from './paths.js';
import { auditTarget } from './audit.js';
import { buildTaskHandoff, findReview, listActiveTasks } from './task-meta.js';
import { lintTaskFile } from './task-lint.js';

/**
 * 30 前聚合验证：gate-check + audit D5（仅 --task）+ reviews 留档闸（仅 --task）
 * + task lint WARN（仅 --task · v2.7+）+ S5 git-clean warn + 可选 --graph
 */
export function verifyTarget(target, options = {}) {
  const { taskFile, graph, allowNoReview = false, allowLintFail = false } = options;
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
  const { taskFile, workspaceRoot, allowNoReview = false, allowLintFail = false } = options;
  const handoffOpts = { workspaceRoot };

  if (taskFile) {
    const handoff = buildTaskHandoff(target, taskFile, handoffOpts);
    const reviewOk = handoff.review_found || allowNoReview;
    const verifyOk = handoff.may_start_30 && reviewOk;
    const lint = lintSnapshotForHandoff(target, taskFile, { allowLintFail });
    return {
      schema_version: '1',
      verify_ok: verifyOk,
      ...handoff,
      may_start_30: verifyOk,
      blocked_reason: handoff.blocked_reason ?? (reviewOk ? null : 'missing R<n> review'),
      next_hat: verifyOk ? '30' : null,
      lint,
    };
  }

  const taskFiles = listActiveTasks(target);
  const tasks = taskFiles.map((tf) => {
    const handoff = buildTaskHandoff(target, tf, handoffOpts);
    return {
      schema_version: '1',
      verify_ok: handoff.may_start_30,
      ...handoff,
    };
  });

  const verifyOk = tasks.length > 0 && tasks.every((t) => t.may_start_30);
  return {
    schema_version: '1',
    verify_ok: verifyOk,
    tasks,
  };
}

/**
 * 人类可读的 --agent-hint（5–10 行）。
 */
export function formatAgentHint(payload) {
  const lines = ['=== Harness verify · agent-hint ==='];

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
