import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
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
