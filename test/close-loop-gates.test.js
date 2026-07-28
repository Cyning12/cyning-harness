import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  evaluateExperienceCapture,
  evaluateGraphDelta,
  evaluateKpiCloseScore,
  evaluateWikiDelta,
  evaluateWikiPromotionPointer,
  hasParsableKpiScore,
} from '../lib/close-loop-gates.js';
import { parseHarnessMeta } from '../lib/task-meta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

test('parseHarnessMeta · graph_delta_note 纯文本单元格', () => {
  const meta = parseHarnessMeta(`## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **graph_delta** | \`none\` |
| **graph_delta_note** | 产品 CLI 变更；无业务图谱增量 |
`);
  assert.equal(meta.graph_delta, 'none');
  assert.match(meta.graph_delta_note, /产品 CLI/);
});

test('evaluateGraphDelta · none + note pass；路径存在 pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-'));
  const rel = 'docs/_tech_graph/10_flow_x.md';
  fs.mkdirSync(path.join(dir, 'docs/_tech_graph'), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), '# flow\n');

  assert.equal(
    evaluateGraphDelta({ graph_delta: 'none', graph_delta_note: 'no change' }).status,
    'pass',
  );
  assert.equal(
    evaluateGraphDelta({ graph_delta: rel }, { repoRoot: dir }).status,
    'pass',
  );
  assert.equal(
    evaluateGraphDelta({ graph_delta: 'docs/missing.md' }, { repoRoot: dir }).status,
    'fail',
  );
});

test('hasParsableKpiScore · Task_KPI% / D1–D5 / 四维', () => {
  assert.equal(hasParsableKpiScore('Task_KPI%: 90'), true);
  assert.equal(
    hasParsableKpiScore('| D1 | D2 | D3 | D4 | D5 |\n| 1 | 2 | 3 | 4 | 5 |'),
    true,
  );
  assert.equal(
    hasParsableKpiScore('| 质量 | 4 |\n| 过程 | 5 |\n| 可观测 | 3 |\n| 回馈 | 4 |'),
    true,
  );
  assert.equal(hasParsableKpiScore('### KPI\n\n（待填）'), false);
});

test('evaluateKpiCloseScore · 非 CLOSE 跳过', () => {
  const r = evaluateKpiCloseScore('### KPI\n\n空', { kpi_aggregator: 'NONE' });
  assert.equal(r.status, 'pass');
  assert.equal(r.skipped, true);
});

test('evaluateExperienceCapture · required / recommended / na', () => {
  const long =
    '这是一段足够长的经验总结文字，用来满足八十字符门槛的最小要求。' +
    '继续补充说明：关账前必须沉淀可复用的判断，避免只写空节。再补十字。' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789extra';
  assert.ok(long.replace(/\s+/g, ' ').trim().length >= 80);
  assert.equal(
    evaluateExperienceCapture(`### 经验总结\n\n${long}`, {
      experience_capture: 'required',
    }).status,
    'pass',
  );
  assert.equal(
    evaluateExperienceCapture('### KPI\n\nx', { experience_capture: 'required' })
      .status,
    'fail',
  );
  assert.equal(
    evaluateExperienceCapture('### KPI\n\nx', {
      experience_capture: 'recommended',
    }).status,
    'warn',
  );
  assert.equal(
    evaluateExperienceCapture('', {
      experience_capture: 'not_applicable',
      experience_capture_note: 'docs only',
    }).status,
    'pass',
  );
  assert.equal(
    evaluateExperienceCapture('', { experience_capture: 'not_applicable' }).status,
    'fail',
  );
});

test('verify --task：graph_delta 缺省 WARN；--strict-graph-delta 可 BLOCK', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-gd-'));
  const active = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(active, { recursive: true });
  const taskRel = 'docs/tasks/active/task_demo_v1.md';
  fs.writeFileSync(
    path.join(target, taskRel),
    `# Task
> **状态**：\`in_progress\`

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |
| **test_strategy** | \`not_applicable\` |
| **test_strategy_note** | docs only |
| **graph_delta** | \`none\` |

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
`,
  );
  const reviews = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviews, { recursive: true });
  fs.writeFileSync(path.join(reviews, 'task_demo_audit_R1_20260728.md'), '# r\n');
  const invoke = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invoke, { recursive: true });
  fs.writeFileSync(path.join(invoke, 'invoke_20260728_10_demo.md'), '#\n');
  fs.writeFileSync(path.join(invoke, 'invoke_20260728_30_demo.md'), '#\n');

  const warn = runNode(['verify', '--target', target, '--task', taskRel], target);
  assert.equal(warn.status, 0, warn.stderr || warn.stdout);
  assert.match(warn.stdout, /WARN: graph_delta/);
  assert.match(warn.stdout, /VERIFY: PASS/);

  const blocked = runNode(
    ['verify', '--target', target, '--task', taskRel, '--strict-graph-delta'],
    target,
  );
  assert.equal(blocked.status, 2, blocked.stdout);
  assert.match(blocked.stdout, /graph_delta/);
  assert.match(blocked.stdout, /VERIFY: BLOCKED/);
});

test('evaluateWikiDelta · 缺字段 fail · none 须 note · path 存在性', () => {
  assert.equal(evaluateWikiDelta({}).status, 'fail');
  assert.equal(
    evaluateWikiDelta({ wiki_delta: 'none', wiki_delta_note: 'x' }).status,
    'pass',
  );
  assert.equal(evaluateWikiDelta({ wiki_delta: 'n/a' }).status, 'fail');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-gd-'));
  fs.mkdirSync(path.join(dir, 'docs/coding_wiki'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'docs/coding_wiki/a.md'), '#\n');
  assert.equal(
    evaluateWikiDelta({ wiki_delta: 'docs/coding_wiki/a.md' }, { repoRoot: dir }).status,
    'pass',
  );
  assert.equal(
    evaluateWikiDelta({ wiki_delta: 'docs/coding_wiki/missing.md' }, { repoRoot: dir })
      .status,
    'fail',
  );
});

test('evaluateWikiPromotionPointer · required+path 须指针', () => {
  const meta = {
    experience_capture: 'required',
    wiki_delta: 'docs/coding_wiki/a.md',
  };
  assert.equal(
    evaluateWikiPromotionPointer('### 经验总结\n\n- a\n- b\n- c\n', meta).status,
    'fail',
  );
  assert.equal(
    evaluateWikiPromotionPointer(
      '### 经验总结\n\n- a\n- b\n- Wiki: docs/coding_wiki/a.md\n',
      meta,
    ).status,
    'pass',
  );
  assert.equal(
    evaluateWikiPromotionPointer('### 经验总结\n\n- a\n- b\n- c\n', {
      experience_capture: 'required',
      wiki_delta: 'none',
      wiki_delta_note: 'x',
    }).status,
    'pass',
  );
});
