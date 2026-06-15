import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  checkTaskFile,
  detectDependsOnCycle,
  validateTaskSidecar,
} from '../lib/task.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');
const goldenSidecar = path.join(
  repoRoot,
  'examples/demo_checkout/task_demo_p0_golden_v1.harness.json',
);

function runNode(args) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd: repoRoot,
    env: { ...process.env, CYNING_HARNESS: repoRoot },
    encoding: 'utf8',
  });
}

test('validateTaskSidecar 金样 sidecar 通过', () => {
  const raw = JSON.parse(fs.readFileSync(goldenSidecar, 'utf8'));
  const result = validateTaskSidecar(raw, 'golden');
  assert.equal(result.ok, true, result.errors.join('; '));
});

test('validateTaskSidecar not_applicable 缺 note 失败', () => {
  const result = validateTaskSidecar(
    { schema_version: '1', task_slug: 'x', test_strategy: 'not_applicable' },
    'bad',
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /test_strategy_note/);
});

test('detectDependsOnCycle 检测环', () => {
  const map = new Map([
    ['a', { data: { depends_on: ['b'] } }],
    ['b', { data: { depends_on: ['c'] } }],
    ['c', { data: { depends_on: ['a'] } }],
  ]);
  const cycle = detectDependsOnCycle(map);
  assert.equal(cycle.ok, false);
  assert.ok(cycle.cycle.includes('a'));
});

test('task check CLI 金样 OK', () => {
  const result = runNode(['task', 'check', '--file', goldenSidecar]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /schema: OK/);
});

test('task check --no-circular 金样无环', () => {
  const result = runNode(['task', 'check', '--file', goldenSidecar, '--no-circular']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /depends_on: acyclic/);
});

test('task check 临时环 sidecar 失败', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-a2-'));
  const a = path.join(dir, 'task_a.harness.json');
  const b = path.join(dir, 'task_b.harness.json');
  fs.writeFileSync(
    a,
    JSON.stringify({
      schema_version: '1',
      task_slug: 'a',
      test_strategy: 'required',
      depends_on: ['b'],
    }),
  );
  fs.writeFileSync(
    b,
    JSON.stringify({
      schema_version: '1',
      task_slug: 'b',
      test_strategy: 'required',
      depends_on: ['a'],
    }),
  );
  const result = runNode(['task', 'check', '--file', a, '--no-circular', '--registry', dir]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /CYCLE|环/);
});

test('gate-check 输出 manifest 版本', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-gate-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.mkdirSync(path.join(target, 'docs/tasks/active'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.3.1","preset":"harness-only","ide":["cursor"]}\n',
  );
  const gate = spawnSync(
    'bash',
    [path.join(repoRoot, 'wizard/gate-check.sh'), '--target', target],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );
  assert.equal(gate.status, 0, gate.stderr || gate.stdout);
  assert.match(gate.stdout, /manifest\.version: 0\.3\.1/);
});

test('harness/prompts 含 40-self-check', () => {
  assert.ok(fs.existsSync(path.join(repoRoot, 'harness/prompts/40-self-check.md')));
});
