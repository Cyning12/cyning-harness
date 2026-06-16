import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, CYNING_HARNESS: repoRoot },
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

test('audit CLI 通过：gate approved + required + 测试存在', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-audit-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'approved');
  writeSidecar(target, 'required');
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');

  const result = runNode(['audit', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /audit: PASS/);
  assert.match(result.stdout, /gate-check: PASS/);
  assert.match(result.stdout, /test-check: PASS/);
});

test('audit CLI 失败：HG-AUDIT-R1 pending', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-audit-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'pending');

  const result = runNode(['audit', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /audit: FAIL/);
  assert.match(result.stdout, /gate-check: FAIL/);
});

test('audit CLI 失败：test_strategy=required 但无测试', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-audit-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'approved');
  writeSidecar(target, 'required');

  const result = runNode(['audit', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /audit: FAIL/);
  assert.match(result.stdout, /test-check: FAIL/);
});

test('audit CLI 对 not_applicable 任务跳过 D5', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-audit-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGate(target, 'approved');
  writeSidecar(target, 'not_applicable');

  const result = runNode(['audit', '--target', target, '--task', 'docs/tasks/active/task_demo.md']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /test-check: PASS/);
});
