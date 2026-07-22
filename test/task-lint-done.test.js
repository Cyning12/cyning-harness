import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot, env = {}) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-lint-done-'));
}

function writeDoneTask(target, relPath) {
  const full = path.join(target, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, '# done task\n');
}

function writeInvokeDir(target, slug) {
  const dir = path.join(target, 'docs/harness/invokes/by-task', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'invoke.md'), '# invoke\n');
}

test('lint-done PASS：done 与 invokes 集合一致', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/task_demo_v1.md');
  writeInvokeDir(target, 'demo');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-DONE: PASS/);
});

test('lint-done FAIL：done 有而 invokes 无 → exit 2 · 列出缺失 slug（含 done_ 前缀+日期剥离）', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/task_demo_v1.md');
  writeDoneTask(target, 'docs/tasks/done/done_legacy_close_2026-04-29.md');
  writeInvokeDir(target, 'demo');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-DONE: FAIL/);
  assert.match(result.stdout, /legacy-close/);
  assert.doesNotMatch(result.stdout, /demo.*缺失|缺失.*demo/);
});

test('lint-done：invokes 多出仅 warn · exit 0', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/task_demo_v1.md');
  writeInvokeDir(target, 'demo');
  writeInvokeDir(target, 'wip_task');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /warn/i);
  assert.match(result.stdout, /wip-task/);
});

test('lint-done：递归 done 子目录（done/chatbi/）', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/chatbi/task_nested_flow_v1.md');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /nested-flow/);
});

test('lint-done：编排仓布局 docs/harness/tasks/done 同样纳入', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/harness/tasks/done/task_meta_task_v1.md');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /meta-task/);
});

test('lint-done：两布局均无 done 目录 → PASS（空集合）', () => {
  const target = makeTarget();

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-DONE: PASS/);
});

test('lint-done：done/ 下 README.md 与 _views 不计入 slug 集合', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/README.md');
  writeDoneTask(target, 'docs/tasks/done/_views/board.md');
  writeDoneTask(target, 'docs/tasks/done/task_demo_v1.md');
  writeInvokeDir(target, 'demo');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-DONE: PASS/);
});

test('lint-done：done 文件下划线 ↔ invoke 目录连字符视为同一 slug', () => {
  const target = makeTarget();
  writeDoneTask(target, 'docs/tasks/done/task_demo_task_v1.md');
  writeInvokeDir(target, 'demo-task');

  const result = runNode(['task', 'lint-done', '--target', target]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /LINT-DONE: PASS/);
});
