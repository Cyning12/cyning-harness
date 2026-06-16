import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { resolveHarnessRootForTarget, wizardScript } from './paths.js';
import { auditTarget } from './audit.js';

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
