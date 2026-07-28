import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildTaskStatus,
  OBS_STATUS_SCHEMA,
} from '../lib/status.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, CYNING_HARNESS: repoRoot },
    encoding: 'utf8',
  });
}

function makeTarget() {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-status-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  return target;
}

function writeTask(target, { gateStatus = 'pending', withInvoke = false, withReview = false } = {}) {
  const activeDir = path.join(target, 'docs/harness/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  const rel = 'docs/harness/tasks/active/task_obs_demo_v1.md';
  fs.writeFileSync(
    path.join(target, rel),
    `# Task · obs demo

> **状态**：\`in_progress\`

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`obs-demo\` |
| **test_strategy** | \`recommended\` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | **approved** | 22-R1,30 | ok |
| HG-AUDIT-R1 | ${gateStatus} | 30 | gate |

## 验收标准

- [ ] demo
`,
  );

  if (withReview) {
    const reviewsDir = path.join(target, 'docs/harness/reviews');
    fs.mkdirSync(reviewsDir, { recursive: true });
    fs.writeFileSync(
      path.join(reviewsDir, 'task_obs_demo_v1_audit_R1_20260727.md'),
      '# review R1\n',
    );
  }

  if (withInvoke) {
    const inv = path.join(target, 'docs/harness/invokes/by-task/obs-demo');
    fs.mkdirSync(inv, { recursive: true });
    fs.writeFileSync(
      path.join(inv, 'invoke_20260727_20_task_audit_R1_obs-demo.md'),
      '# invoke 20\n',
    );
  }

  return rel;
}

test('status --task：pending 闸 → may_start_30=false + JSON 可解析', () => {
  const target = makeTarget();
  const rel = writeTask(target, { gateStatus: 'pending', withInvoke: true });

  const result = runNode(['status', '--target', target, '--task', rel, '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema_version, OBS_STATUS_SCHEMA);
  assert.equal(payload.task_slug, 'obs-demo');
  assert.equal(payload.may_start_30, false);
  assert.ok(payload.blockers.length > 0);
  assert.equal(payload.last_invoke.hat_id, '20');
  assert.match(payload.last_invoke.path, /invoke_20260727_20/);
  assert.equal(payload.reviews.R1, false);
  assert.equal(typeof payload.verify_preview.ok, 'boolean');
  assert.ok(payload.verify_preview.reason);
  assert.ok('event_count' in payload.hgm);
  assert.equal(typeof payload.kpi_section, 'boolean');
  assert.ok(payload.next_hint);
});

test('status --task：缺 task → exit 1', () => {
  const target = makeTarget();
  const result = runNode([
    'status',
    '--target',
    target,
    '--task',
    'docs/harness/tasks/active/missing.md',
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /不存在/);
});

test('status 无 active → 空列表 exit 0', () => {
  const target = makeTarget();
  const result = runNode(['status', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /none/);
});

test('status --task：有 review + approved → R1=yes · 人读含字段', () => {
  const target = makeTarget();
  const rel = writeTask(target, {
    gateStatus: 'approved',
    withReview: true,
    withInvoke: true,
  });
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');

  const result = runNode(['status', '--target', target, '--task', rel]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /task: obs-demo/);
  assert.match(result.stdout, /may_start_30: true/);
  assert.match(result.stdout, /reviews: R1=yes/);
  assert.match(result.stdout, /verify_preview:/);
  assert.match(result.stdout, /不替代|非正式 verify|正式运行 harness verify/);
});

test('buildTaskStatus：库函数直接覆盖 pending', () => {
  const target = makeTarget();
  const rel = writeTask(target, { gateStatus: 'pending' });
  const { payload } = buildTaskStatus(target, rel);
  assert.equal(payload.may_start_30, false);
  assert.equal(payload.schema_version, 'obs_status.v1');
});

test('next_hint：已过 30 不提示「开 30」', async () => {
  const { buildNextHint } = await import('../lib/status.js');
  const hint = buildNextHint({
    mayStart30: true,
    blockers: [],
    reviewFound: true,
    closeFound: false,
    verifyOk: true,
    status: 'in_progress',
    lastHat: '30',
  });
  assert.match(hint, /30 已执行/);
  assert.doesNotMatch(hint, /后开 30/);
});

test('next_hint：done/CLOSE 提示复盘', async () => {
  const { buildNextHint } = await import('../lib/status.js');
  const hint = buildNextHint({
    mayStart30: true,
    blockers: [],
    reviewFound: true,
    closeFound: true,
    verifyOk: true,
    status: 'done',
    lastHat: '40',
  });
  assert.match(hint, /已关账|复盘/);
});

test('status --check：缺 review → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, { gateStatus: 'approved', withReview: false });
  const result = runNode([
    'status',
    '--target',
    target,
    '--task',
    rel,
    '--check',
  ]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /FAIL: status --check/);
  assert.match(result.stderr, /missing R/);
});

test('status --check：闸 pending → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, {
    gateStatus: 'pending',
    withReview: true,
  });
  const result = runNode([
    'status',
    '--target',
    target,
    '--task',
    rel,
    '--check',
  ]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stderr, /may_start_30=false/);
});

test('status --check：闸齐 + R1 → exit 0', () => {
  const target = makeTarget();
  const rel = writeTask(target, {
    gateStatus: 'approved',
    withReview: true,
  });
  fs.mkdirSync(path.join(target, 'test'), { recursive: true });
  fs.writeFileSync(path.join(target, 'test/demo.test.js'), '');
  const result = runNode([
    'status',
    '--target',
    target,
    '--task',
    rel,
    '--check',
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /OK: status --check passed/);
});

test('status --check 无 --task → exit 1', () => {
  const target = makeTarget();
  const result = runNode(['status', '--target', target, '--check']);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /须配合 --task/);
});
