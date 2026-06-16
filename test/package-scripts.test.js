import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { mergePackageScripts } from '../lib/package-scripts.js';

test('mergePackageScripts 写入 devDep 与 scripts', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-ps-'));
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'demo' }));

  const result = mergePackageScripts(target, '1.0.1', 'pnpm');
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies['@cyning/harness'], '1.0.1');
  assert.equal(pkg.scripts['harness:verify'], 'harness verify');
  assert.equal(pkg.scripts['harness:gate'], 'harness gate-check');
  assert.equal(pkg.scripts['harness:audit'], 'harness audit');
});

test('mergePackageScripts 不覆盖已有 scripts key', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-ps-'));
  fs.writeFileSync(
    path.join(target, 'package.json'),
    JSON.stringify({
      name: 'demo',
      scripts: { 'harness:verify': 'custom verify' },
    }),
  );

  const result = mergePackageScripts(target, '1.0.1', 'pnpm');
  assert.equal(result.changed, true);

  const pkg = JSON.parse(fs.readFileSync(path.join(target, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies['@cyning/harness'], '1.0.1');
  assert.equal(pkg.scripts['harness:verify'], 'custom verify');
  assert.equal(pkg.scripts['harness:gate'], 'harness gate-check');
});

test('mergePackageScripts 无 package.json 时 skip', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-ps-'));
  const result = mergePackageScripts(target, '1.0.1', 'pnpm');
  assert.equal(result.skipped, true);
  assert.equal(result.changed, false);
});

test('mergePackageScripts auto 检测 pnpm', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-ps-'));
  fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'demo' }));
  fs.writeFileSync(path.join(target, 'pnpm-lock.yaml'), '');

  const result = mergePackageScripts(target, '1.0.1', 'auto');
  assert.equal(result.pm, 'pnpm');
});
