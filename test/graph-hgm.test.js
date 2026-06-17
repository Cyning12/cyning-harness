import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  appendEvent,
  buildSnapshot,
  checkAxioms,
  eventsFileForMonth,
  ingestRepo,
  loadEvents,
  parseTaskMarkdown,
  writeSnapshot,
} from '../lib/graph-hgm.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'bin', 'harness.js');

function setupTarget() {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-hgm-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    JSON.stringify({ version: '1.1.0', preset: 'harness-only' }),
  );
  fs.mkdirSync(path.join(target, 'docs/tasks/active'), { recursive: true });
  return target;
}

function writeTask(target, name, content) {
  fs.writeFileSync(path.join(target, 'docs/tasks/active', name), content);
}

test('parseTaskMarkdown 提取 slug status gates', () => {
  const md = `# Task · demo

> **状态**：\`in_progress\`

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | pending | 30 | wait |
`;
  const parsed = parseTaskMarkdown(md, 'task_demo_v1.md');
  assert.equal(parsed.task_slug, 'demo');
  assert.equal(parsed.status, 'in_progress');
  assert.equal(parsed.title, 'demo');
  assert.equal(parsed.gates.length, 2);
  assert.equal(parsed.gates[0].human_gate_id, 'HG-TASK-DRAFT');
  assert.equal(parsed.gates[0].status, 'approved');
  assert.deepEqual(parsed.gates[0].blocks_hats, ['22', '30']);
});

test('appendEvent 写入 append-only jsonl', () => {
  const target = setupTarget();
  const event = {
    event_id: 'evt:20260617T120000Z:001',
    type: 'TaskCreated',
    occurred_at: '2026-06-17T12:00:00Z',
    actor: 'system',
    subject: 'task:demo',
    data: { task_slug: 'demo', title: 'Demo', status: 'draft' },
  };
  appendEvent(target, event);
  const events = loadEvents(target);
  assert.equal(events.length, 1);
  assert.equal(events[0].subject, 'task:demo');
});

test('ingestRepo 扫描 task 与 gate 事件', () => {
  const target = setupTarget();
  writeTask(
    target,
    'task_demo.md',
    `# Task · demo

> **状态**：\`in_progress\`

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-AUDIT-R1 | pending | 30 | block |
`,
  );

  const result = ingestRepo(target, { dryRun: true });
  assert.ok(result.count >= 3);
  assert.ok(result.events.some((e) => e.type === 'RepositoryAdopted'));
  assert.ok(result.events.some((e) => e.type === 'TaskCreated' && e.subject === 'task:task_demo'));
  assert.ok(
    result.events.some(
      (e) => e.type === 'GateStatusChanged' && e.subject === 'gate:task_demo:HG-AUDIT-R1',
    ),
  );
});

test('buildSnapshot 投影节点与边', () => {
  const events = [
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'RepositoryAdopted',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'repo:demo',
      data: { manifest_version: '1.1.0', preset: 'harness-only' },
    },
    {
      event_id: 'evt:20260617T120000Z:002',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:01:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress', must_read: ['docs/x.md'] },
    },
    {
      event_id: 'evt:20260617T120000Z:003',
      type: 'GateStatusChanged',
      occurred_at: '2026-06-17T12:02:00Z',
      actor: 'system',
      subject: 'gate:demo:HG-AUDIT-R1',
      data: {
        old_status: 'pending',
        new_status: 'pending',
        task_slug: 'demo',
        human_gate_id: 'HG-AUDIT-R1',
        blocks_hats: ['30'],
      },
    },
  ];

  const snapshot = buildSnapshot(events);
  assert.ok(snapshot.nodes['task:demo']);
  assert.ok(snapshot.nodes['gate:demo:HG-AUDIT-R1']);
  assert.ok(snapshot.nodes['inform:docs/x.md']);
  assert.ok(snapshot.edges.some((e) => e.type === 'HAS_GATE'));
  assert.ok(snapshot.edges.some((e) => e.type === 'BLOCKS' && e.hat_id === '30'));
  assert.ok(snapshot.edges.some((e) => e.type === 'MUST_READ'));
});

test('checkAxioms D2 检测 pending gate 阻塞 30', () => {
  const snapshot = buildSnapshot([
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress' },
    },
    {
      event_id: 'evt:20260617T120000Z:002',
      type: 'GateStatusChanged',
      occurred_at: '2026-06-17T12:01:00Z',
      actor: 'system',
      subject: 'gate:demo:HG-AUDIT-R1',
      data: {
        old_status: 'pending',
        new_status: 'pending',
        task_slug: 'demo',
        human_gate_id: 'HG-AUDIT-R1',
        blocks_hats: ['30'],
      },
    },
  ]);

  const result = checkAxioms(snapshot);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.axiom === 'D2'));
});

test('checkAxioms D3 检测 in_progress 缺 GateCheckRun', () => {
  const snapshot = buildSnapshot([
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress' },
    },
  ]);

  const result = checkAxioms(snapshot);
  assert.equal(result.ok, true);
  assert.ok(result.violations.some((v) => v.axiom === 'D3'));
});

test('checkAxioms S2 检测 sync touch S2 路径', () => {
  const snapshot = buildSnapshot([
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'SyncOperationCompleted',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'sync',
      subject: 'repo:demo',
      data: { mode: 'apply', version: '1.1.0', files_touched: ['docs/tasks/active/task_x.md'] },
    },
  ]);

  const result = checkAxioms(snapshot);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.axiom === 'S2'));
});

test('checkAxioms rejected→draft positive：rejected 后有 draft 回退', () => {
  const events = [
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress' },
    },
    {
      event_id: 'evt:20260617T120000Z:002',
      type: 'GateStatusChanged',
      occurred_at: '2026-06-17T12:01:00Z',
      actor: 'maintainer',
      subject: 'gate:demo:HG-AUDIT-R1',
      data: {
        old_status: 'pending',
        new_status: 'rejected',
        task_slug: 'demo',
        human_gate_id: 'HG-AUDIT-R1',
        blocks_hats: ['30'],
      },
    },
    {
      event_id: 'evt:20260617T120000Z:003',
      type: 'HumanGateRejected',
      occurred_at: '2026-06-17T12:01:01Z',
      actor: 'maintainer',
      subject: 'gate:demo:HG-AUDIT-R1',
      data: { task_slug: 'demo', human_gate_id: 'HG-AUDIT-R1', returns_to_status: 'draft' },
    },
    {
      event_id: 'evt:20260617T120000Z:004',
      type: 'TaskStatusChanged',
      occurred_at: '2026-06-17T12:02:00Z',
      actor: 'maintainer',
      subject: 'task:demo',
      data: { task_slug: 'demo', new_status: 'draft' },
    },
  ];
  const snapshot = buildSnapshot(events);
  const result = checkAxioms(snapshot, events);
  assert.equal(result.ok, true);
  assert.equal(result.violations.filter((v) => v.axiom === 'rejected→draft').length, 0);
});

test('checkAxioms rejected→draft negative：缺 draft 回退', () => {
  const events = [
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress' },
    },
    {
      event_id: 'evt:20260617T120000Z:002',
      type: 'HumanGateRejected',
      occurred_at: '2026-06-17T12:01:00Z',
      actor: 'maintainer',
      subject: 'gate:demo:HG-AUDIT-R1',
      data: { task_slug: 'demo', human_gate_id: 'HG-AUDIT-R1', returns_to_status: 'draft' },
    },
  ];
  const snapshot = buildSnapshot(events);
  const result = checkAxioms(snapshot, events);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.axiom === 'rejected→draft' && v.severity === 'error'));
});

test('checkAxioms D4-a 检测 in_progress + HG-GRAPH-MODULES pending', () => {
  const events = [
    {
      event_id: 'evt:20260617T120000Z:001',
      type: 'TaskCreated',
      occurred_at: '2026-06-17T12:00:00Z',
      actor: 'system',
      subject: 'task:demo',
      data: { task_slug: 'demo', title: 'Demo', status: 'in_progress' },
    },
    {
      event_id: 'evt:20260617T120000Z:002',
      type: 'GateStatusChanged',
      occurred_at: '2026-06-17T12:01:00Z',
      actor: 'system',
      subject: 'gate:demo:HG-GRAPH-MODULES',
      data: {
        old_status: 'pending',
        new_status: 'pending',
        task_slug: 'demo',
        human_gate_id: 'HG-GRAPH-MODULES',
        blocks_hats: ['30'],
      },
    },
  ];
  const snapshot = buildSnapshot(events);
  const result = checkAxioms(snapshot, events);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.axiom === 'D4-a' && v.severity === 'error'));
});

test('ingestRepo rejected gate + draft status 产出 TaskStatusChanged(draft)', () => {
  const target = setupTarget();
  writeTask(
    target,
    'task_rejected_draft.md',
    `# Task · rejected draft

> **状态**：\`draft\`

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-AUDIT-R1 | rejected | 30 | veto |
`,
  );

  const result = ingestRepo(target, { dryRun: true });
  assert.ok(result.events.some((e) => e.type === 'HumanGateRejected'));
  assert.ok(
    result.events.some(
      (e) => e.type === 'TaskStatusChanged' && e.data.new_status === 'draft',
    ),
  );
  const snapshot = buildSnapshot(result.events);
  const ax = checkAxioms(snapshot, result.events);
  assert.equal(ax.violations.filter((v) => v.axiom === 'rejected→draft').length, 0);
});

test('CLI graph ingest --dry-run', () => {
  const target = setupTarget();
  writeTask(
    target,
    'task_demo.md',
    `# Task · demo

> **状态**：\`draft\`

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | — | ok |
`,
  );

  const result = spawnSync('node', [cliPath, 'graph', 'ingest', '--target', target, '--dry-run'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /新事件:/);
  assert.match(result.stdout, /dry-run/);
});

test('CLI graph snapshot 生成 snapshot.json', () => {
  const target = setupTarget();
  appendEvent(target, {
    event_id: 'evt:20260617T120000Z:001',
    type: 'RepositoryAdopted',
    occurred_at: '2026-06-17T12:00:00Z',
    actor: 'system',
    subject: 'repo:demo',
    data: { manifest_version: '1.1.0', preset: 'harness-only' },
  });

  const result = spawnSync('node', [cliPath, 'graph', 'snapshot', '--target', target], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /snapshot:/);
  const snapshot = JSON.parse(fs.readFileSync(path.join(target, '.cyning-harness/graph/snapshot.json'), 'utf8'));
  assert.ok(snapshot.nodes['repo:demo']);
});

test('CLI graph axioms check --json', () => {
  const target = setupTarget();
  appendEvent(target, {
    event_id: 'evt:20260617T120000Z:001',
    type: 'TaskCreated',
    occurred_at: '2026-06-17T12:00:00Z',
    actor: 'system',
    subject: 'task:demo',
    data: { task_slug: 'demo', title: 'Demo', status: 'draft' },
  });

  const result = spawnSync('node', [cliPath, 'graph', 'snapshot', '--target', target], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const ax = spawnSync('node', [cliPath, 'graph', 'axioms', 'check', '--target', target, '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  assert.equal(ax.status, 0, ax.stderr || ax.stdout);
  const data = JSON.parse(ax.stdout);
  assert.equal(typeof data.ok, 'boolean');
  assert.ok(Array.isArray(data.violations));
});
