import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { findSpecReview, shouldSkipSpecAudit } from '../lib/task-meta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

function writeSpec(dir, { slug = 'demo-feature', track, skip, fileName } = {}) {
  const name = fileName ?? `SPEC-${slug}_v1.md`;
  const trackLine = track ? `> **track**：\`${track}\`\n` : '> **track**：`feature`\n';
  const skipRow = skip ? `| **skip_spec_audit** | \`true\` |\n` : '';
  const body = `# SPEC · ${slug}

${trackLine}
## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **spec_slug** | \`${slug}\` |
${skipRow}
`;
  const abs = path.join(dir, name);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  return abs;
}

function writeReview(reviewsDir, name) {
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, name), '# review\n');
}

test('findSpecReview：推荐名 spec_*_audit_R', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-rev-'));
  const spec = writeSpec(root, { slug: 'demo-feature' });
  writeReview(path.join(root, 'docs/harness/reviews'), 'spec_demo_feature_audit_R1_20260725.md');
  const r = findSpecReview(spec, { target: root });
  assert.equal(r.found, true);
  assert.match(r.latest, /spec_demo_feature_audit_R1/);
  assert.equal(r.matched_pattern, 'spec_audit');
});

test('findSpecReview：兼容 ACCEPT 与 task_*_spec_ACCEPT', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-rev-'));
  const spec = writeSpec(root, { slug: 'meta-graph' });
  writeReview(path.join(root, 'docs/harness/reviews'), 'spec_meta_graph_ACCEPT_R2_20260626.md');
  let r = findSpecReview(spec, { target: root });
  assert.equal(r.found, true);
  assert.equal(r.matched_pattern, 'spec_ACCEPT');
  assert.deepEqual(r.rounds, [2]);

  const root2 = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-rev-'));
  const spec2 = writeSpec(root2, { slug: 'ops-session' });
  writeReview(
    path.join(root2, 'docs/harness/reviews'),
    'task_ops_session_spec_ACCEPT_R1_20260702.md',
  );
  r = findSpecReview(spec2, { target: root2 });
  assert.equal(r.found, true);
  assert.equal(r.matched_pattern, 'task_spec_ACCEPT');
});

test('findSpecReview：workspaceRoot 分仓 + 多轮取最新', () => {
  const product = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prod-'));
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-ws-'));
  const spec = writeSpec(path.join(product, 'docs/spec'), {
    slug: 'split-case',
    fileName: 'SPEC-split-case_v1.md',
  });
  writeReview(
    path.join(workspace, 'docs/harness/reviews'),
    'spec_split_case_audit_R1_20260720.md',
  );
  writeReview(
    path.join(workspace, 'docs/harness/reviews'),
    'spec_split_case_audit_R2_20260725.md',
  );
  const r = findSpecReview(spec, { target: product, workspaceRoot: workspace });
  assert.equal(r.found, true);
  assert.match(r.latest, /R2/);
});

test('shouldSkipSpecAudit：bugfix / 表内 skip · 正文提及不误伤', () => {
  assert.equal(shouldSkipSpecAudit('> **track**：`bugfix`\n'), true);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-skip-'));
  const spec = writeSpec(root, { slug: 'x', skip: true });
  assert.equal(shouldSkipSpecAudit(fs.readFileSync(spec, 'utf8')), true);
  // 正文说明文字含 skip_spec_audit: true 不得豁免
  assert.equal(
    shouldSkipSpecAudit('# SPEC\n\n> **track**：`feature`\n\n豁免：`skip_spec_audit: true`\n'),
    false,
  );
});

test('verify --spec · 缺失 → BLOCKED exit 2', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-v-'));
  writeSpec(root, { slug: 'missing-one', fileName: 'SPEC-missing-one_v1.md' });
  const r = runNode(['verify', '--target', root, '--spec', 'SPEC-missing-one_v1.md'], root);
  assert.equal(r.status, 2, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /missing SPEC R<n> review/);
  assert.match(r.stdout + r.stderr, /VERIFY: BLOCKED/);
});

test('verify --spec · 有文 → PASS', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-v-'));
  writeSpec(root, { slug: 'ok-one', fileName: 'SPEC-ok-one_v1.md' });
  writeReview(path.join(root, 'docs/harness/reviews'), 'spec_ok_one_audit_R1_20260725.md');
  const r = runNode(['verify', '--target', root, '--spec', 'SPEC-ok-one_v1.md'], root);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /VERIFY: PASS/);
});

test('verify --spec --allow-no-spec-review：缺失 → warn 放行', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-v-'));
  writeSpec(root, { slug: 'allow-one', fileName: 'SPEC-allow-one_v1.md' });
  const r = runNode(
    ['verify', '--target', root, '--spec', 'SPEC-allow-one_v1.md', '--allow-no-spec-review'],
    root,
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /allow-no-spec-review|WARN/);
  assert.match(r.stdout + r.stderr, /VERIFY: PASS/);
});

test('verify --spec · bugfix 豁免 → PASS 无需审查文', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-v-'));
  writeSpec(root, { slug: 'bug-one', track: 'bugfix', fileName: 'SPEC-bug-one_v1.md' });
  const r = runNode(['verify', '--target', root, '--spec', 'SPEC-bug-one_v1.md'], root);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout + r.stderr, /skip SPEC review|VERIFY: PASS/);
});

test('verify --spec --json：may_start_00 / spec_review_*', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-v-'));
  writeSpec(root, { slug: 'json-one', fileName: 'SPEC-json-one_v1.md' });
  writeReview(path.join(root, 'docs/harness/reviews'), 'spec_json_one_audit_R1_20260725.md');
  const r = runNode(
    ['verify', '--target', root, '--spec', 'SPEC-json-one_v1.md', '--json'],
    root,
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const payload = JSON.parse(r.stdout.trim());
  assert.equal(payload.mode, 'spec');
  assert.equal(payload.may_start_00, true);
  assert.equal(payload.spec_review_found, true);
  assert.match(payload.spec_review_latest, /R1/);
});

test('verify：--task 与 --spec 互斥 → exit 1', () => {
  const r = runNode(['verify', '--task', 'x.md', '--spec', 'y.md']);
  assert.equal(r.status, 1);
  assert.match(r.stderr + r.stdout, /互斥/);
});

test('lifecycle show 含 to_00 / spec_reviews_retention', () => {
  const r = runNode(['lifecycle', 'show']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /to_00/);
  assert.match(r.stdout, /\[block\] spec_reviews_retention/);
});
