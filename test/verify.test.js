import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot, env = {}) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function writeTaskWithGate(target, gateStatus) {
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(
    path.join(activeDir, 'task_demo.md'),
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | ${gateStatus} | 30 | gate |
`,
  );
}

function writeSidecar(target, strategy) {
  const payload = {
    schema_version: '1',
    task_slug: 'demo',
    test_strategy: strategy,
  };
  if (strategy === 'not_applicable') {
    payload.test_strategy_note = 'docs-only task';
  }
  fs.writeFileSync(
    path.join(target, 'docs/tasks/active/task_demo.harness.json'),
    JSON.stringify(payload),
  );
}

test('verify PASS：gate approved + required + 测试存在', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'approved');
  writeSidecar(target, 'required');
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');

  const result = runNode(['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify BLOCKED：HG-AUDIT-R1 pending', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'pending');

  const result = runNode(['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /VERIFY: BLOCKED/);
});

test('verify 无 --task 时扫描 active tasks', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'approved');

  const result = runNode(['verify', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify 无 --task · 多 task 有一阻塞：列出全部 · 摘要不含表格行', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );

  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });

  fs.writeFileSync(
    path.join(activeDir, 'task_ok.md'),
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | gate |
`,
  );

  fs.writeFileSync(
    path.join(activeDir, 'task_blocked.md'),
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | pending | 30 | draft |
| HG-AUDIT-R1 | pending | 30 | gate |
`,
  );

  const result = runNode(['verify', '--target', target]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /task: task_ok\.md/);
  assert.match(result.stdout, /task: task_blocked\.md/);
  assert.match(result.stdout, /VERIFY: BLOCKED/);
  assert.match(result.stdout, /task_blocked\.md/);
  assert.doesNotMatch(result.stdout, /VERIFY: BLOCKED · \| HG-TASK-DRAFT/);
  assert.equal(result.stderr.trim(), '', 'BLOCKED 时不应打印 stack');
});

test('gate-check CLI 透传退出码', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'pending');

  const result = runNode(['gate-check', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /HG-AUDIT-R1/);
});

test('sync index CLI 生成 invoke_index.json', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-verify-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );

  const result = runNode(['sync', 'index', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(fs.existsSync(path.join(target, '.cyning-harness', 'invoke_index.json')));
});

test('CLI --version 输出 package.json 版本', () => {
  const result = runNode(['--version']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /^\d+\.\d+\.\d+/);
});

test('CLI 未知命令 exit 1', () => {
  const result = runNode(['unknown-cmd']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /未知命令/);
});
