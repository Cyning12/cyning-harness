import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listActiveTasks } from '../lib/task-meta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');
const gateCheck = path.join(repoRoot, 'wizard', 'gate-check.sh');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, CYNING_HARNESS: repoRoot },
    encoding: 'utf8',
  });
}

function runGateCheck(target) {
  return spawnSync('bash', [gateCheck, '--target', target], {
    encoding: 'utf8',
    env: { ...process.env, CYNING_HARNESS: repoRoot },
  });
}

function writeApprovedTask(absPath, taskName = 'task_demo.md') {
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(
    absPath,
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | gate |
`,
  );
  const base = taskName.replace(/\.md$/, '');
  fs.writeFileSync(
    path.join(path.dirname(absPath), `${base}.harness.json`),
    JSON.stringify({ schema_version: '1', task_slug: 'demo', test_strategy: 'required' }),
  );
}

function makeFullTarget({
  starterTasks = ['task_a.md'],
  harnessTasks = [],
  reviewFiles = [],
} = {}) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-fullrev-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"2.8.0","preset":"harness-only"}\n',
  );
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');

  for (const name of starterTasks) {
    writeApprovedTask(path.join(target, 'docs/tasks/active', name), name);
  }
  for (const name of harnessTasks) {
    writeApprovedTask(path.join(target, 'docs/harness/tasks/active', name), name);
  }
  for (const rf of reviewFiles) {
    const full = path.join(target, 'docs/harness/reviews', rf);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '# review\n');
  }
  return target;
}

test('listActiveTasks · 双路径 ∪ · 同 basename 优先 Starter', () => {
  const target = makeFullTarget({
    starterTasks: ['task_shared.md'],
    harnessTasks: ['task_shared.md', 'task_only_harness.md'],
  });
  const list = listActiveTasks(target);
  assert.equal(list.length, 2);
  assert.ok(list.includes('docs/tasks/active/task_shared.md'));
  assert.ok(list.includes('docs/harness/tasks/active/task_only_harness.md'));
  assert.ok(!list.includes('docs/harness/tasks/active/task_shared.md'));
  assert.deepEqual(list, [...list].sort());
});

test('listActiveTasks · 仅 harness 路径也能发现', () => {
  const target = makeFullTarget({ starterTasks: [], harnessTasks: ['task_h.md'] });
  const list = listActiveTasks(target);
  assert.deepEqual(list, ['docs/harness/tasks/active/task_h.md']);
});

test('gate-check · 仅 docs/harness/tasks/active → 可扫到且 PASS', () => {
  const target = makeFullTarget({ starterTasks: [], harnessTasks: ['task_h.md'] });
  const result = runGateCheck(target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /task_h\.md/);
});

test('verify 全量 · 均有审查文 → PASS', () => {
  const target = makeFullTarget({
    starterTasks: ['task_a.md'],
    harnessTasks: ['task_b.md'],
    reviewFiles: ['task_a_audit_R1_20260725.md', 'task_b_audit_R1_20260725.md'],
  });
  const result = runNode(['verify', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify 全量 · 缺一文 → BLOCKED · reason 含 basename', () => {
  const target = makeFullTarget({
    starterTasks: ['task_ok.md', 'task_missing.md'],
    reviewFiles: ['task_ok_audit_R1_20260725.md'],
  });
  const result = runNode(['verify', '--target', target]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: BLOCKED/);
  assert.match(result.stdout, /missing R<n> review/);
  assert.match(result.stdout, /task_missing\.md/);
});

test('verify 全量 · --allow-no-review → WARN + PASS', () => {
  const target = makeFullTarget({
    starterTasks: ['task_missing.md'],
  });
  const result = runNode(['verify', '--target', target, '--allow-no-review']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /warn/i);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify 全量 · --json：may_start_30 / verify_ok 含 review_found', () => {
  const target = makeFullTarget({
    starterTasks: ['task_ok.md', 'task_missing.md'],
    reviewFiles: ['task_ok_audit_R1_20260725.md'],
  });
  const result = runNode(['verify', '--target', target, '--json']);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.verify_ok, false);
  assert.equal(payload.tasks.length, 2);
  const ok = payload.tasks.find((t) => t.task === 'task_ok.md');
  const miss = payload.tasks.find((t) => t.task === 'task_missing.md');
  assert.equal(ok.review_found, true);
  assert.equal(ok.may_start_30, true);
  assert.equal(ok.verify_ok, true);
  assert.equal(miss.review_found, false);
  assert.equal(miss.may_start_30, false);
  assert.equal(miss.verify_ok, false);
  assert.match(miss.blocked_reason, /missing R<n> review/);
});

test('verify --task · 行为回归（单 task 仍查 reviews）', () => {
  const target = makeFullTarget({
    starterTasks: ['task_demo.md'],
    reviewFiles: ['task_demo_audit_R1_20260725.md'],
  });
  const result = runNode([
    'verify',
    '--target',
    target,
    '--task',
    'docs/tasks/active/task_demo.md',
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});
