import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveHarnessRootForTarget, wizardScript } from './paths.js';
import { auditTarget } from './audit.js';
import { buildTaskHandoff, listActiveTasks } from './task-meta.js';

/**
 * 30 前聚合验证：gate-check + audit D5（仅 --task）+ S5 git-clean warn + 可选 --graph
 */
export function verifyTarget(target, options = {}) {
  const { taskFile, graph } = options;
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
  }

  // 3. S5 git-clean：warn 不挡
  const gitResult = runGitCleanCheck(target);
  if (gitResult.dirty) {
    // 把 warn 拼到 stdout 里让 CLI 透传
    const warn = `WARN: 工作区未 clean（S5）：建议 commit 后再执行 apply\n`;
    gateResult.stdout += warn;
  }

  return {
    ok: true,
    exitCode: 0,
    stdout: gateResult.stdout,
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
  const { taskFile, workspaceRoot } = options;
  const handoffOpts = { workspaceRoot };

  if (taskFile) {
    const handoff = buildTaskHandoff(target, taskFile, handoffOpts);
    return {
      schema_version: '1',
      verify_ok: handoff.may_start_30,
      ...handoff,
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
    for (const w of item.warnings ?? []) {
      lines.push(`  warn: ${w}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
