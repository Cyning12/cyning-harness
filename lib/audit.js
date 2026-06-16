import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadTaskSidecar, validateTaskSidecar } from './task.js';

/**
 * 在目标仓运行 ICVO audit（D3/D5/S5 子集）。
 */
export function auditTarget(target, options = {}) {
  const taskFile = options.taskFile;

  const gate = runGateCheck(target, taskFile);
  const testCheck = runTestCheck(target, taskFile);
  const gitCheck = runGitCleanCheck(target);

  const ok = gate.ok && testCheck.ok;

  return {
    ok,
    target,
    taskFile,
    gate,
    test: testCheck,
    git: gitCheck,
  };
}

function runGateCheck(target, taskFile) {
  const script = path.join(
    process.env.CYNING_HARNESS || process.cwd(),
    'wizard',
    'gate-check.sh',
  );
  const args = [script, '--target', target];
  if (taskFile) args.push('--task', taskFile);

  const result = spawnSync('bash', args, {
    encoding: 'utf8',
    env: process.env,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function runTestCheck(target, taskFile) {
  // 未指定 task 文件时，D5 跳过（在 active task 上跑 gate-check 已覆盖 D3）
  if (!taskFile) {
    return { ok: true, skipped: true, reason: '未指定 --task，跳过 D5' };
  }

  const absTask = path.isAbsolute(taskFile) ? taskFile : path.join(target, taskFile);
  if (!fs.existsSync(absTask)) {
    return { ok: true, skipped: true, reason: 'task 文件不存在，跳过 D5' };
  }

  const sidecar = resolveTaskSidecar(absTask, target);
  if (!sidecar) {
    return { ok: true, skipped: true, reason: '未找到 task sidecar，跳过 D5' };
  }

  let data;
  try {
    data = loadTaskSidecar(sidecar);
  } catch (err) {
    return { ok: false, reason: `sidecar 解析失败: ${err.message}` };
  }

  const validation = validateTaskSidecar(data, path.basename(sidecar));
  if (!validation.ok) {
    return { ok: false, reason: validation.errors.join('; ') };
  }

  if (data.test_strategy !== 'required') {
    return {
      ok: true,
      skipped: true,
      reason: `test_strategy=${data.test_strategy}，无需 D5 强检查`,
    };
  }

  const hasTest = hasTestArtifacts(target);
  if (!hasTest) {
    return {
      ok: false,
      reason: 'test_strategy=required 但目标仓未声明测试路径或 CI 引用',
    };
  }

  return { ok: true, reason: 'test_strategy=required 且检测到测试/CI 制品' };
}

function resolveTaskSidecar(taskMarkdownPath, target) {
  const dir = path.dirname(taskMarkdownPath);
  const base = path.basename(taskMarkdownPath, '.md');

  // 1. 同目录 <name>.harness.json
  const sameDir = path.join(dir, `${base}.harness.json`);
  if (fs.existsSync(sameDir)) return sameDir;

  // 2. 目标仓根 task.harness.v1.json（legacy / 单 task 仓）
  const rootSidecar = path.join(target, 'task.harness.v1.json');
  if (fs.existsSync(rootSidecar)) return rootSidecar;

  return null;
}

function hasTestArtifacts(target) {
  const probes = [
    'test',
    'tests',
    'spec',
    'specs',
    '__tests__',
    'jest.config.js',
    'jest.config.ts',
    'vitest.config.js',
    'vitest.config.ts',
    'playwright.config.js',
    'playwright.config.ts',
    'cypress.config.js',
    'pytest.ini',
    'pyproject.toml',
    'setup.py',
  ];

  for (const p of probes) {
    const full = path.join(target, p);
    if (fs.existsSync(full)) return true;
  }

  // 任意 *.test.js / *.spec.js / *.test.ts / *.spec.ts
  const jsTests = spawnSync(
    'find',
    [target, '-maxdepth', '3', '-type', 'f', '(', '-name', '*.test.js', '-o', '-name', '*.spec.js', '-o', '-name', '*.test.ts', '-o', '-name', '*.spec.ts', '-o', '-name', '*_test.py', '-o', '-name', 'test_*.py', ')'],
    { encoding: 'utf8' },
  );
  if (jsTests.status === 0 && jsTests.stdout.trim()) return true;

  // CI 工作流引用
  const ciDir = path.join(target, '.github', 'workflows');
  if (fs.existsSync(ciDir)) {
    const files = fs.readdirSync(ciDir);
    if (files.some((f) => f.endsWith('.yml') || f.endsWith('.yaml'))) return true;
  }

  return false;
}

function runGitCleanCheck(target) {
  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
    cwd: target,
  });

  const dirty = result.status === 0 && result.stdout.trim().length > 0;

  return {
    ok: true, // audit 不因此失败，仅 warn
    dirty,
    stdout: result.stdout,
    warning: dirty ? '工作区未 clean（S5）：建议 commit 后再执行 apply' : null,
  };
}
