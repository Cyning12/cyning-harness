import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { OBS_TIMELINE_SCHEMA } from '../lib/timeline.js';
import { filterEventsForTask } from '../lib/obs-hgm.js';
import { summarizeTaskHgm } from '../lib/obs-hgm.js';

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
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-timeline-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  return target;
}

function writeTask(target) {
  const activeDir = path.join(target, 'docs/harness/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  const rel = 'docs/harness/tasks/active/task_tl_demo_v1.md';
  fs.writeFileSync(
    path.join(target, rel),
    `# Task

> **状态**：\`in_progress\`

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`tl-demo\` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-AUDIT-R1 | approved | 30 | ok |
`,
  );
  return rel;
}

function writeEvents(target, events) {
  const dir = path.join(target, '.cyning-harness/events');
  fs.mkdirSync(dir, { recursive: true });
  const lines = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
  fs.writeFileSync(path.join(dir, '2026-07.jsonl'), lines);
}

test('timeline：缺 --task → exit 1', () => {
  const target = makeTarget();
  const result = runNode(['timeline', '--target', target]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /--task/);
});

test('timeline：缺 task 文件 → exit 1', () => {
  const target = makeTarget();
  const result = runNode([
    'timeline',
    '--target',
    target,
    '--task',
    'docs/harness/tasks/active/missing.md',
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /不存在/);
});

test('timeline：无事件 → exit 0 + WARN', () => {
  const target = makeTarget();
  const rel = writeTask(target);
  const result = runNode(['timeline', '--target', target, '--task', rel]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /无 HGM 数据|graph ingest/);
  assert.match(result.stdout, /no events|events: 0/);
});

test('timeline：有事件时序升序 + --json + --limit', () => {
  const target = makeTarget();
  const rel = writeTask(target);
  writeEvents(target, [
    {
      event_id: 'e2',
      type: 'GateStatusChanged',
      occurred_at: '2026-07-27T12:00:00.000Z',
      subject: 'gate:tl-demo:HG-AUDIT-R1',
      data: {
        task_slug: 'tl-demo',
        human_gate_id: 'HG-AUDIT-R1',
        old_status: 'pending',
        new_status: 'approved',
      },
    },
    {
      event_id: 'e1',
      type: 'TaskCreated',
      occurred_at: '2026-07-27T11:00:00.000Z',
      subject: 'task:tl-demo',
      data: { task_slug: 'tl-demo', title: 'demo', status: 'draft' },
    },
    {
      event_id: 'e3',
      type: 'TaskCreated',
      occurred_at: '2026-07-27T10:00:00.000Z',
      subject: 'task:other',
      data: { task_slug: 'other', title: 'x', status: 'draft' },
    },
  ]);

  const result = runNode([
    'timeline',
    '--target',
    target,
    '--task',
    rel,
    '--json',
    '--limit',
    '1',
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.schema_version, OBS_TIMELINE_SCHEMA);
  assert.equal(payload.event_count, 2);
  assert.equal(payload.returned, 1);
  assert.equal(payload.events[0].type, 'TaskCreated');
  assert.equal(payload.events[0].occurred_at, '2026-07-27T11:00:00.000Z');
  assert.ok(payload.events[0].summary);
});

test('filterEventsForTask 与 summarizeTaskHgm 语义一致', () => {
  const target = makeTarget();
  writeEvents(target, [
    {
      event_id: 'a',
      type: 'TaskCreated',
      occurred_at: '2026-07-27T11:00:00.000Z',
      subject: 'task:tl-demo',
      data: { task_slug: 'tl-demo' },
    },
  ]);
  const hgm = summarizeTaskHgm(target, 'tl-demo');
  assert.equal(hgm.event_count, 1);
  const filtered = filterEventsForTask(
    [
      {
        event_id: 'a',
        type: 'TaskCreated',
        occurred_at: '2026-07-27T11:00:00.000Z',
        subject: 'task:tl-demo',
        data: { task_slug: 'tl-demo' },
      },
    ],
    'tl-demo',
  );
  assert.equal(filtered.length, 1);
});

test('timeline：--task --ingest path 误序仍可用（先剥布尔旗标）', () => {
  const target = makeTarget();
  const rel = writeTask(target);
  const result = runNode([
    'timeline',
    '--target',
    target,
    '--task',
    '--ingest',
    rel,
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('timeline：--ingest 在 --task 之前可用', () => {
  const target = makeTarget();
  const rel = writeTask(target);
  const result = runNode([
    'timeline',
    '--ingest',
    '--target',
    target,
    '--task',
    rel,
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('timeline：位置参数可作为 task 路径', () => {
  const target = makeTarget();
  const rel = writeTask(target);
  const result = runNode(['timeline', '--target', target, '--ingest', rel]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
