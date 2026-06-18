import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildTaskHandoff,
  evaluateMayStart30,
  parseHarnessMeta,
  parseHumanGates,
  resolveInvokePath,
} from '../lib/task-meta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(
  repoRoot,
  'test/fixtures/task_meta_graph_issue_sync_gate_snippet.md',
);

test('parseHarnessMeta · entry_invoke_30 与 task_slug', () => {
  const content = fs.readFileSync(fixturePath, 'utf8');
  const meta = parseHarnessMeta(content);
  assert.equal(meta.task_slug, 'meta-graph-issue-sync-gate');
  assert.match(meta.entry_invoke_30, /PROMPT_START_30_v1\.md/);
  assert.match(meta.entry_invoke_20, /PROMPT_START_20/);
});

test('evaluateMayStart30 · approved → true · pending → false', () => {
  const approved = evaluateMayStart30([
    { id: 'HG-TASK-DRAFT', status: 'approved', blocks_hats: '20, 30' },
    { id: 'HG-AUDIT-R1', status: 'approved', blocks_hats: '30' },
  ]);
  assert.equal(approved.may_start_30, true);

  const pending = evaluateMayStart30([
    { id: 'HG-TASK-DRAFT', status: 'approved', blocks_hats: '20, 30' },
    { id: 'HG-AUDIT-R1', status: 'pending', blocks_hats: '30' },
  ]);
  assert.equal(pending.may_start_30, false);
  assert.match(pending.blocked_reason, /HG-AUDIT-R1/);
});

test('resolveInvokePath · Projects/ 无 workspace-root → warn', () => {
  const { resolved, warnings } = resolveInvokePath(
    'Projects/docs/harness/invokes/by-task/foo/PROMPT_START_30_v1.md',
    { target: '/tmp/target' },
  );
  assert.equal(resolved, null);
  assert.ok(warnings.length > 0);
});

test('buildTaskHandoff · review_path glob', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-'));
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reviewsDir, 'task_demo_audit_R1_20260101.md'),
    '# review',
  );
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(
    path.join(activeDir, 'task_demo.md'),
    `# Task

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo-slug\` |
| **entry_invoke_30** | \`docs/harness/prompts/30.md\` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 20, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | ok |
`,
  );

  const handoff = buildTaskHandoff(target, 'docs/tasks/active/task_demo.md');
  assert.equal(handoff.may_start_30, true);
  assert.equal(handoff.next_hat, '30');
  assert.equal(handoff.review_path, 'docs/harness/reviews/task_demo_audit_R1_20260101.md');
  assert.equal(handoff.entry_invoke_30, 'docs/harness/prompts/30.md');
});
