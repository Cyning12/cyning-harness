import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd, env = {}) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

/** 闸表 approved + review + sidecar required · 可选完整 lint 结构 */
function makeTarget({ lintOk = true } = {}) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-lintwarn-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"2.6.0","preset":"harness-only"}\n',
  );
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });

  const body = lintOk
    ? `# Task · demo

> **状态**：\`draft\`（ok）

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | gate |

## 失败路径

| 触发 | 行为 | 可重试 |
| --- | --- | --- |
| x | y | 是 |

## 验收标准

- [ ] 甲

### 自检结论

（30/40 回填）
`
    : `# Task · demo

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | gate |
`;

  fs.writeFileSync(path.join(activeDir, 'task_demo.md'), body);
  fs.writeFileSync(
    path.join(activeDir, 'task_demo.harness.json'),
    JSON.stringify({ schema_version: '1', task_slug: 'demo', test_strategy: 'required' }),
  );
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'task_demo_audit_R1_20260724.md'), '# review\n');
  return target;
}

test('verify --task · lint PASS：无 task lint WARN · exit 0', () => {
  const target = makeTarget({ lintOk: true });
  const r = runNode(['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md'], target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.doesNotMatch(r.stdout + r.stderr, /WARN: task lint FAIL/);
  assert.match(r.stdout + r.stderr, /VERIFY: PASS/);
});

test('verify --task · lint FAIL：WARN 且 exit 0（其余闸过）', () => {
  const target = makeTarget({ lintOk: false });
  const r = runNode(['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md'], target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /WARN: task lint FAIL/);
  assert.match(r.stdout + r.stderr, /VERIFY: PASS/);
});

test('verify --task --allow-lint-fail：抑制 FAIL WARN', () => {
  const target = makeTarget({ lintOk: false });
  const r = runNode(
    ['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md', '--allow-lint-fail'],
    target,
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /suppressed|--allow-lint-fail/);
  assert.doesNotMatch(r.stdout + r.stderr, /WARN: task lint FAIL ·/);
});

test('verify --json · lint 字段存在 · may_start_30 不因 lint FAIL 为 false', () => {
  const target = makeTarget({ lintOk: false });
  const r = runNode(
    ['verify', '--target', target, '--task', 'docs/tasks/active/task_demo.md', '--json'],
    target,
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const payload = JSON.parse(r.stdout);
  assert.equal(payload.may_start_30, true);
  assert.ok(payload.lint);
  assert.equal(payload.lint.ok, false);
  assert.ok(Array.isArray(payload.lint.errors));
});

test('verify 无 --task：不出现 task lint WARN', () => {
  const target = makeTarget({ lintOk: false });
  const r = runNode(['verify', '--target', target], target);
  // 全量模式可能因结构不全而 gate 行为不同；关键断言：无 lint WARN 协议行
  assert.doesNotMatch(r.stdout + r.stderr, /WARN: task lint/);
});
