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

/** 与 verify.test.js 同型 fixture：闸表 approved + sidecar required + 测试文件 */
function makeVerifyTarget({ taskName = 'task_demo.md', withReview = false, reviewFiles = [] } = {}) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-revgate-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"2.4.0","preset":"harness-only"}\n',
  );
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(
    path.join(activeDir, taskName),
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
    path.join(activeDir, `${base}.harness.json`),
    JSON.stringify({ schema_version: '1', task_slug: 'demo', test_strategy: 'required' }),
  );
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');

  for (const rf of reviewFiles) {
    const full = path.join(target, 'docs/harness/reviews', rf);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '# review\n');
  }
  return { target, taskRel: path.join('docs/tasks/active', taskName) };
}

test('verify PASS：R1 审查文存在 → 行为不变', () => {
  const { target, taskRel } = makeVerifyTarget({ reviewFiles: ['task_demo_audit_R1_20260724.md'] });
  const result = runNode(['verify', '--target', target, '--task', taskRel]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify BLOCKED：审查文缺失（即使闸表全 approved）→ exit 2', () => {
  const { target, taskRel } = makeVerifyTarget();
  const result = runNode(['verify', '--target', target, '--task', taskRel]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /missing R<n> review/);
  assert.match(result.stdout, /VERIFY: BLOCKED/);
});

test('verify --allow-no-review：缺失 → warn 放行 · exit 0', () => {
  const { target, taskRel } = makeVerifyTarget();
  const result = runNode(['verify', '--target', target, '--task', taskRel, '--allow-no-review']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /warn/i);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify 多轮审查文：R1+R2 → handoff 取最新轮 R2', () => {
  const { target, taskRel } = makeVerifyTarget({
    reviewFiles: ['task_demo_audit_R1_20260720.md', 'task_demo_audit_R2_20260724.md'],
  });
  const result = runNode(['verify', '--target', target, '--task', taskRel, '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.review_found, true);
  assert.match(payload.review_latest, /R2/);
});

test('verify 版本后缀变体（R1-B1）：task_x_v1.md ↔ task_x_audit_R1（无 _v1）→ PASS 不误挡', () => {
  const { target, taskRel } = makeVerifyTarget({
    taskName: 'task_demo_v1.md',
    reviewFiles: ['task_demo_audit_R1_20260724.md'],
  });
  const result = runNode(['verify', '--target', target, '--task', taskRel]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /VERIFY: PASS/);
});

test('verify --json：review_found / review_latest 字段（缺失时 false）', () => {
  const { target, taskRel } = makeVerifyTarget();
  const result = runNode(['verify', '--target', target, '--task', taskRel, '--json']);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.review_found, false);
  assert.equal(payload.may_start_30, false);
  assert.match(payload.blocked_reason, /missing R<n> review/);
});
