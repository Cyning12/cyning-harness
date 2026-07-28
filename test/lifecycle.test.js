import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  dryRunTransition,
  formatLifecycleShow,
  loadLifecycle,
  validateLifecycle,
} from '../lib/lifecycle.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

test('validateLifecycle：包内 yaml 结构通过', () => {
  const { data, filePath } = loadLifecycle({ harnessRoot: repoRoot });
  assert.ok(filePath.endsWith('lifecycle.yaml'));
  assert.equal(data.version, '1');
  assert.ok(data.transitions.some((t) => t.id === 'to_30'));
  assert.ok(data.transitions.some((t) => t.id === 'close'));
  const lintGuard = data.transitions
    .find((t) => t.id === 'to_30')
    .guards.find((g) => g.id === 'task_lint');
  assert.equal(lintGuard.severity, 'warn');
});

test('validateLifecycle：缺 states / 非法 severity → fail', () => {
  const a = validateLifecycle({ version: '1', transitions: [{ id: 'x', from: ['a'], to: 'b', guards: [] }] });
  assert.equal(a.ok, false);
  assert.ok(a.errors.some((e) => /states/.test(e)));

  const b = validateLifecycle({
    version: '1',
    states: [{ id: 'draft' }],
    transitions: [
      {
        id: 'to_30',
        from: ['draft'],
        to: 'in_progress',
        guards: [{ id: 'g', command_or_check: 'x', severity: 'error' }],
      },
    ],
  });
  assert.equal(b.ok, false);
  assert.ok(b.errors.some((e) => /severity/.test(e)));
});

test('lifecycle show：人读表含 states/transitions · exit 0', () => {
  const r = runNode(['lifecycle', 'show']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /## states/);
  assert.match(r.stdout, /to_30/);
  assert.match(r.stdout, /\[warn\] task_lint/);
});

test('lifecycle show --json：含 version/states/transitions', () => {
  const r = runNode(['lifecycle', 'show', '--json']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const data = JSON.parse(r.stdout);
  assert.equal(data.version, '1');
  assert.ok(Array.isArray(data.states));
  assert.ok(Array.isArray(data.transitions));
});

test('lifecycle：损坏 yaml（缺 states）→ loadLifecycle 抛错', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-bad-'));
  const bad = path.join(dir, 'lifecycle.yaml');
  fs.writeFileSync(bad, 'version: "1"\ntransitions: []\n');
  assert.throws(
    () => loadLifecycle({ filePath: bad }),
    (e) => /校验失败|states/.test(e.message),
  );
});

test('formatLifecycleShow 非空', () => {
  const { data } = loadLifecycle({ harnessRoot: repoRoot });
  const text = formatLifecycleShow(data);
  assert.match(text, /lifecycle v1/);
});

function makeDryRunFixture({ audit = 'approved', withReview = true } = {}) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-dryrun-'));
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  const taskName = 'task_demo.md';
  fs.writeFileSync(
    path.join(activeDir, taskName),
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | ${audit} | 30 | gate |
`,
  );
  if (withReview) {
    const reviews = path.join(target, 'docs/harness/reviews');
    fs.mkdirSync(reviews, { recursive: true });
    fs.writeFileSync(path.join(reviews, 'task_demo_audit_R1_20260725.md'), '# r\n');
  }
  return {
    target,
    taskRel: path.join('docs/tasks/active', taskName),
    taskAbs: path.join(activeDir, taskName),
  };
}

test('dryRunTransition：未知 transition → structure_ok false · exitCode 2', () => {
  const r = dryRunTransition({
    transitionId: 'nope',
    fromState: 'draft',
    harnessRoot: repoRoot,
  });
  assert.equal(r.structure_ok, false);
  assert.equal(r.exitCode, 2);
  assert.equal(r.blocked, true);
});

test('dryRunTransition：from 非法 → structure_ok false · exitCode 2', () => {
  const r = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'archived',
    harnessRoot: repoRoot,
  });
  assert.equal(r.structure_ok, false);
  assert.equal(r.exitCode, 2);
});

test('dryRunTransition：无 --task · 结构 ok · unevaluated_count > 0 · exit 0', () => {
  const r = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    harnessRoot: repoRoot,
  });
  assert.equal(r.structure_ok, true);
  assert.ok(r.unevaluated_count > 0);
  assert.equal(r.blocked, false);
  assert.equal(r.exitCode, 0);
  assert.equal(r.engine, 'lifecycle-dry-run');
});

test('dryRunTransition：to_30 + fixture · to_30 守卫均非 unevaluated', () => {
  const { target, taskAbs } = makeDryRunFixture();
  const r = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(r.structure_ok, true);
  const audit = r.guards.find((g) => g.id === 'HG-AUDIT-R1');
  const draft = r.guards.find((g) => g.id === 'HG-TASK-DRAFT');
  const rev = r.guards.find((g) => g.id === 'reviews_retention');
  const d5 = r.guards.find((g) => g.id === 'audit_D5');
  const lint = r.guards.find((g) => g.id === 'task_lint');
  assert.equal(audit.status, 'pass');
  assert.equal(draft.status, 'pass');
  assert.equal(rev.status, 'pass');
  assert.equal(d5.status, 'pass'); // 无 sidecar → D5 skipped → pass
  assert.notEqual(lint.status, 'unevaluated');
  assert.equal(r.unevaluated_count, 0);
  assert.equal(r.blocked, false);
  assert.equal(r.exitCode, 0);
});

test('dryRunTransition：task_lint fail + --allow-lint-fail → warn（不 block）', () => {
  const { target, taskAbs } = makeDryRunFixture();
  const fail = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(fail.guards.find((g) => g.id === 'task_lint').status, 'fail');
  assert.equal(fail.guards.find((g) => g.id === 'task_lint').severity, 'warn');
  assert.equal(fail.blocked, false); // warn severity 不挡

  const waived = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
    flags: { allowLintFail: true },
  });
  assert.equal(waived.guards.find((g) => g.id === 'task_lint').status, 'warn');
  assert.equal(waived.exitCode, 0);
});

test('dryRunTransition：close + 齐全 fixture · close_* 均非 unevaluated', () => {
  const { target, taskAbs } = makeCloseDryRunFixture();
  const r = dryRunTransition({
    transitionId: 'close',
    fromState: 'done',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(r.structure_ok, true, r.detail);
  assert.equal(r.unevaluated_count, 0, JSON.stringify(r.guards));
  for (const g of r.guards) {
    assert.notEqual(g.status, 'unevaluated', g.id);
    assert.equal(g.status, 'pass', `${g.id}: ${g.detail}`);
  }
  assert.equal(r.blocked, false);
  assert.equal(r.exitCode, 0);
});

test('dryRunTransition：close · 缺 invoke hats → close_invoke fail · blocked', () => {
  const { target, taskAbs } = makeCloseDryRunFixture({ invokeMode: 'minimal30' });
  const r = dryRunTransition({
    transitionId: 'close',
    fromState: 'done',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(r.guards.find((g) => g.id === 'close_invoke').status, 'fail');
  assert.equal(r.blocked, true);
  assert.equal(r.exitCode, 2);

  const waived = dryRunTransition({
    transitionId: 'close',
    fromState: 'done',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
    flags: { allowInvokeGap: true },
  });
  assert.equal(waived.guards.find((g) => g.id === 'close_invoke').status, 'warn');
  assert.equal(waived.blocked, false);
  assert.equal(waived.exitCode, 0);
});

test('dryRunTransition：close · 状态非 done → close_status fail', () => {
  const { target, taskAbs } = makeCloseDryRunFixture({ status: 'in_progress' });
  const r = dryRunTransition({
    transitionId: 'close',
    fromState: 'done',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(r.guards.find((g) => g.id === 'close_status').status, 'fail');
  assert.equal(r.blocked, true);
});

test('dryRunTransition：close 无 --task · close_* unevaluated', () => {
  const r = dryRunTransition({
    transitionId: 'close',
    fromState: 'done',
    harnessRoot: repoRoot,
  });
  assert.equal(r.structure_ok, true);
  assert.ok(r.unevaluated_count > 0);
  assert.ok(r.guards.every((g) => g.status === 'unevaluated'));
});

function makeCloseDryRunFixture({
  status = 'done',
  invokeMode = 'default',
  withReview = true,
} = {}) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-close-dry-'));
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  const taskName = 'task_demo_v1.md';
  fs.writeFileSync(
    path.join(activeDir, taskName),
    `# Task

> **状态**：\`${status}\`

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |
| **graph_delta** | \`none\` |
| **graph_delta_note** | \`lifecycle fixture\` |
| **wiki_delta** | \`n/a\` |
| **wiki_delta_note** | \`lifecycle fixture\` |

## 验收标准

- [x] a

### 自检结论（执行者）

ok。

### KPI（00）

Task_KPI%: 80
`,
  );
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invokeDir, { recursive: true });
  if (invokeMode === 'minimal30') {
    fs.writeFileSync(path.join(invokeDir, 'invoke_20260726_30_demo.md'), '#\n');
  } else {
    fs.writeFileSync(path.join(invokeDir, 'invoke_20260726_10_demo.md'), '#\n');
    fs.writeFileSync(path.join(invokeDir, 'invoke_20260726_30_40_demo.md'), '#\n');
  }
  if (withReview) {
    const reviews = path.join(target, 'docs/harness/reviews');
    fs.mkdirSync(reviews, { recursive: true });
    fs.writeFileSync(path.join(reviews, 'task_demo_audit_R1_20260726.md'), '# r\n');
  }
  return {
    target,
    taskAbs: path.join(activeDir, taskName),
  };
}

test('dryRunTransition：HG-AUDIT-R1 pending → blocked · exitCode 2', () => {
  const { taskAbs, target } = makeDryRunFixture({ audit: 'pending' });
  const r = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(r.blocked, true);
  assert.equal(r.exitCode, 2);
  assert.equal(r.guards.find((g) => g.id === 'HG-AUDIT-R1').status, 'fail');
});

test('dryRunTransition：缺审查文 → reviews fail；--allow-no-review → warn', () => {
  const { taskAbs, target } = makeDryRunFixture({ withReview: false });
  const fail = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
  });
  assert.equal(fail.guards.find((g) => g.id === 'reviews_retention').status, 'fail');
  assert.equal(fail.blocked, true);

  const waived = dryRunTransition({
    transitionId: 'to_30',
    fromState: 'draft',
    taskPath: taskAbs,
    harnessRoot: repoRoot,
    cwd: target,
    flags: { allowNoReview: true },
  });
  assert.equal(waived.guards.find((g) => g.id === 'reviews_retention').status, 'warn');
  assert.equal(waived.blocked, false);
  assert.equal(waived.exitCode, 0);
});

test('lifecycle dry-run CLI --json · 非法 transition · exit 2', () => {
  const r = runNode([
    'lifecycle',
    'dry-run',
    '--transition',
    'nope',
    '--from',
    'draft',
    '--json',
  ]);
  assert.equal(r.status, 2, r.stderr || r.stdout);
  const payload = JSON.parse(r.stdout.trim());
  assert.equal(payload.structure_ok, false);
});

test('lifecycle dry-run CLI：无 task · exit 0 · unevaluated', () => {
  const r = runNode([
    'lifecycle',
    'dry-run',
    '--transition',
    'to_30',
    '--from',
    'draft',
  ]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /unevaluated/);
  assert.match(r.stdout, /WARN/);
});
