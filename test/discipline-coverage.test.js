import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  formatDisciplineShow,
  loadDisciplineCoverage,
  validateDisciplineCoverage,
} from '../lib/discipline-coverage.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
}

test('包内 discipline-coverage.yaml 通过校验', () => {
  const { data, filePath } = loadDisciplineCoverage({ harnessRoot: repoRoot });
  assert.ok(filePath.endsWith('discipline-coverage.yaml'));
  assert.equal(data.version, '1');
  assert.equal(data.as_of_package_version, '2.13.0');
  assert.ok(data.statements.length >= 20);
});

test('已关闭缺口 G1/G2/G4 在 gaps 中为 closed', () => {
  const { data } = loadDisciplineCoverage({ harnessRoot: repoRoot });
  for (const id of ['G1', 'G2', 'G4']) {
    const g = data.gaps.find((x) => x.id === id);
    assert.ok(g, `缺 gaps ${id}`);
    assert.equal(g.status, 'closed', id);
    assert.ok(g.closed_in);
  }
});

test('G1 相关语句不再是纯 prompt-only（A9/D1）', () => {
  const { data } = loadDisciplineCoverage({ harnessRoot: repoRoot });
  for (const id of ['A9', 'D1', 'C1']) {
    const s = data.statements.find((x) => x.id === id);
    assert.ok(s, id);
    assert.notEqual(s.status, 'prompt-only', `${id} 应已机械/部分机械`);
  }
});

test('非法：缺 statements → fail', () => {
  const v = validateDisciplineCoverage({
    version: '1',
    as_of_package_version: '2.10.0',
    scope: 'x',
  });
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /statements/.test(e)));
});

test('非法：status 非法 → fail', () => {
  const v = validateDisciplineCoverage({
    version: '1',
    as_of_package_version: '2.10.0',
    scope: 'x',
    statements: [
      { id: 'X1', source: 'a', summary: 's', status: 'done' },
    ],
  });
  assert.equal(v.ok, false);
  assert.ok(v.errors.some((e) => /status/.test(e)));
});

test('非法 fixture 文件 → loadDisciplineCoverage 抛错', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-bad-'));
  const bad = path.join(dir, 'discipline-coverage.yaml');
  fs.writeFileSync(
    bad,
    'version: "1"\nas_of_package_version: "2.10.0"\nscope: x\nstatements: []\n',
  );
  assert.throws(
    () => loadDisciplineCoverage({ filePath: bad }),
    (e) => /校验失败|statements/.test(e.message),
  );
});

test('formatDisciplineShow 含 version / as_of / 计数', () => {
  const { data } = loadDisciplineCoverage({ harnessRoot: repoRoot });
  const text = formatDisciplineShow(data);
  assert.match(text, /discipline-coverage v1/);
  assert.match(text, /as_of: 2\.13\.0/);
  assert.match(text, /## statements/);
  assert.match(text, /## gaps/);
});

test('discipline show CLI · exit 0 · 含 as_of', () => {
  const r = runNode(['discipline', 'show']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /as_of: 2\.13\.0/);
});

test('discipline show --json · 可 parse · version', () => {
  const r = runNode(['discipline', 'show', '--json']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const data = JSON.parse(r.stdout);
  assert.equal(data.version, '1');
  assert.ok(Array.isArray(data.statements));
});
