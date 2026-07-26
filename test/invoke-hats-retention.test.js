import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  evaluateInvokeHatsRetention,
  extractHatsFromInvokeFilename,
  resolveRequiredInvokeHats,
} from '../lib/task-meta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

function lastLine(stdout) {
  const lines = stdout.trim().split('\n');
  return lines[lines.length - 1];
}

const TASK_BASE = `# Task · demo

> **状态**：\`done\`

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |
__META_EXTRA__

## 验收标准

- [x] 甲

### 自检结论（执行者）

ok。
`;

function writeCloseFixture(target, { metaExtra = '', invokeFiles = [] } = {}) {
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  const content = TASK_BASE.replace('__META_EXTRA__', metaExtra);
  fs.writeFileSync(path.join(activeDir, 'task_demo_v1.md'), content);
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  if (invokeFiles.length) {
    fs.mkdirSync(invokeDir, { recursive: true });
    for (const f of invokeFiles) {
      fs.writeFileSync(path.join(invokeDir, f), `# ${f}\n`);
    }
  }
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'task_demo_audit_R1_20260726.md'), '# r\n');
  return 'docs/tasks/active/task_demo_v1.md';
}

test('resolveRequiredInvokeHats · 缺省 default=10,30,40', () => {
  const r = resolveRequiredInvokeHats({});
  assert.deepEqual(r.hats, ['10', '30', '40']);
  assert.equal(r.source, 'default');
});

test('resolveRequiredInvokeHats · minimal / full / 显式优先', () => {
  assert.deepEqual(resolveRequiredInvokeHats({ invoke_retention_profile: 'minimal' }).hats, [
    '30',
  ]);
  assert.deepEqual(resolveRequiredInvokeHats({ invoke_retention_profile: 'full' }).hats, [
    '00',
    '10',
    '20',
    '30',
    '40',
    'CLOSE',
  ]);
  const explicit = resolveRequiredInvokeHats({
    invoke_retention_profile: 'minimal',
    required_invoke_hats: '10,30',
  });
  assert.deepEqual(explicit.hats, ['10', '30']);
  assert.equal(explicit.source, 'explicit');
});

test('extractHatsFromInvokeFilename · 30_40 合并 + CLOSE', () => {
  const h = extractHatsFromInvokeFilename('invoke_20260726_30_40_demo.md');
  assert.ok(h.has('30'));
  assert.ok(h.has('40'));
  const c = extractHatsFromInvokeFilename('invoke_20260726_CLOSE_demo.md');
  assert.ok(c.has('CLOSE'));
});

test('evaluateInvokeHatsRetention · 仅 30 → 缺 10,40', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hats-'));
  const invokeDir = path.join(dir, 'by-task');
  fs.mkdirSync(invokeDir);
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260726_30_x.md'), '#\n');
  const ev = evaluateInvokeHatsRetention({}, invokeDir);
  assert.equal(ev.ok, false);
  assert.deepEqual(ev.missing.sort(), ['10', '40']);
});

test('close BLOCKED：default 仅有 30 → missing invoke hats', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'close-hats-'));
  const rel = writeCloseFixture(target, {
    invokeFiles: ['invoke_20260726_30_demo.md'],
  });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2, result.stdout);
  assert.match(result.stdout, /missing invoke hats/);
  assert.match(result.stdout, /10/);
  assert.match(result.stdout, /40/);
});

test('close PASS：10 + 30_40 覆盖 default', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'close-hats-'));
  const rel = writeCloseFixture(target, {
    invokeFiles: [
      'invoke_20260726_10_demo.md',
      'invoke_20260726_30_40_demo.md',
    ],
  });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo');
});

test('close PASS：minimal 仅 30', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'close-hats-'));
  const rel = writeCloseFixture(target, {
    metaExtra: '| **invoke_retention_profile** | `minimal` |\n',
    invokeFiles: ['invoke_20260726_30_demo.md'],
  });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo');
});

test('close：--allow-invoke-gap 豁免缺帽并留痕', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'close-hats-'));
  const rel = writeCloseFixture(target, {
    invokeFiles: ['invoke_20260726_30_demo.md'],
  });
  const result = runNode(
    ['task', 'close', '--file', rel, '--yes', '--allow-invoke-gap'],
    target,
  );
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /allow-invoke-gap/);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo');
});

test('verify --task：invoke hats gap WARN 不挡 PASS', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-hats-'));
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  // in_progress + gates approved so verify can run gate-check
  const task = `# Task

> **状态**：\`in_progress\`

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |
| **test_strategy** | \`not_applicable\` |
| **test_strategy_note** | docs only |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22-R1, 30 | x |
| HG-AUDIT-R1 | approved | 30 | x |

## 验收标准

- [x] a

## 失败路径

| 触发 | 行为 |
| --- | --- |
| x | y |

### 自检结论（执行者）

pending。
`;
  fs.writeFileSync(path.join(activeDir, 'task_demo_v1.md'), task);
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'task_demo_audit_R1_20260726.md'), '# r\n');
  // only 30
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invokeDir, { recursive: true });
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260726_30_demo.md'), '#\n');

  const result = runNode(
    ['verify', '--target', target, '--task', 'docs/tasks/active/task_demo_v1.md'],
    target,
  );
  // gate/audit may still pass; we care about WARN line
  assert.match(result.stdout, /WARN: invoke hats gap/);
  assert.match(result.stdout, /缺 10,40|缺 10.*40|10.*40/);
});
