import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { lintWikiDeltaMissing } from '../lib/task-lint-wiki-delta.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-lint-wiki-'));
}

function writeTask(target, relPath, body) {
  const full = path.join(target, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body);
}

const META_WITH = `## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`demo\` |
| **wiki_delta** | \`n/a\` |
| **wiki_delta_note** | harness-only |
`;

const META_WITHOUT = `## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`legacy\` |
| **graph_delta** | \`none\` |
`;

test('lintWikiDeltaMissing · 缺字段列入 missing', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_legacy.md', `# t\n\n${META_WITHOUT}`);
  writeTask(target, 'docs/tasks/done/task_ok.md', `# t\n\n${META_WITH}`);
  const r = lintWikiDeltaMissing(target);
  assert.equal(r.scanned, 2);
  assert.equal(r.ok, false);
  assert.deepEqual(
    r.missing.map((m) => m.path),
    ['docs/tasks/done/task_legacy.md'],
  );
});

test('lintWikiDeltaMissing · 全有字段 → ok', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/active/task_a.md', `# t\n\n${META_WITH}`);
  const r = lintWikiDeltaMissing(target, { scope: 'active' });
  assert.equal(r.ok, true);
  assert.equal(r.missing.length, 0);
});

test('lintWikiDeltaMissing · --scope done 跳过 active', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/active/task_gap.md', `# t\n\n${META_WITHOUT}`);
  writeTask(target, 'docs/tasks/done/task_ok.md', `# t\n\n${META_WITH}`);
  const r = lintWikiDeltaMissing(target, { scope: 'done' });
  assert.equal(r.ok, true);
  assert.equal(r.scanned, 1);
});

test('CLI lint-wiki-delta · FAIL exit 2 · 列路径', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_gap.md', `# t\n\n${META_WITHOUT}`);
  const result = runNode(['task', 'lint-wiki-delta', '--target', target]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-WIKI-DELTA: FAIL/);
  assert.match(result.stdout, /docs\/tasks\/done\/task_gap\.md/);
});

test('CLI lint-wiki-delta · PASS', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_ok.md', `# t\n\n${META_WITH}`);
  const result = runNode(['task', 'lint-wiki-delta', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-WIKI-DELTA: PASS/);
});

test('CLI lint-wiki-delta --json', () => {
  const target = makeTarget();
  writeTask(target, 'docs/harness/tasks/done/task_gap.md', `# t\n\n${META_WITHOUT}`);
  const result = runNode(['task', 'lint-wiki-delta', '--target', target, '--json']);
  assert.equal(result.status, 2);
  const j = JSON.parse(result.stdout);
  assert.equal(j.ok, false);
  assert.equal(j.missing.length, 1);
  assert.equal(j.strict, false);
  assert.equal(j.missing[0].code, 'wiki_delta_missing');
  assert.match(j.missing[0].path, /docs\/harness\/tasks\/done\/task_gap\.md/);
});

const META_NONE_NO_NOTE = `## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`nonote\` |
| **wiki_delta** | \`none\` |
`;

const META_BAD_PATH = `## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | \`badpath\` |
| **wiki_delta** | \`docs/coding_wiki/does-not-exist.md\` |
`;

test('默认模式 · none 无 note / 坏 path 不报（仅缺字段）', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_nonote.md', `# t\n\n${META_NONE_NO_NOTE}`);
  writeTask(target, 'docs/tasks/done/task_badpath.md', `# t\n\n${META_BAD_PATH}`);
  const r = lintWikiDeltaMissing(target);
  assert.equal(r.ok, true);
  assert.equal(r.missing.length, 0);
});

test('--strict · none 无 note → fail', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_nonote.md', `# t\n\n${META_NONE_NO_NOTE}`);
  writeTask(target, 'docs/tasks/done/task_ok.md', `# t\n\n${META_WITH}`);
  const r = lintWikiDeltaMissing(target, { strict: true });
  assert.equal(r.ok, false);
  assert.equal(r.missing.length, 0);
  assert.equal(r.issues.length, 1);
  assert.equal(r.issues[0].code, 'wiki_delta_none_no_note');
});

test('--strict · path 不存在 → fail', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_badpath.md', `# t\n\n${META_BAD_PATH}`);
  const r = lintWikiDeltaMissing(target, { strict: true });
  assert.equal(r.ok, false);
  assert.equal(r.issues[0].code, 'wiki_delta_path_missing');
});

test('CLI --strict · exit 2 · 含 code', () => {
  const target = makeTarget();
  writeTask(target, 'docs/tasks/done/task_nonote.md', `# t\n\n${META_NONE_NO_NOTE}`);
  const result = runNode(['task', 'lint-wiki-delta', '--target', target, '--strict']);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /wiki_delta_none_no_note/);
  assert.match(result.stdout, /LINT-WIKI-DELTA: FAIL/);
});
