import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { isNewerVersion, readManifest } from '../lib/manifest.js';
import { resolveHarnessRoot } from '../lib/paths.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');

function runNode(args, env = {}) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CYNING_HARNESS: repoRoot,
      HARNESS_VERSION: '0.3.0',
      ...env,
    },
    encoding: 'utf8',
  });
}

function mkTempProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-a1-'));
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 'test@cyning.dev'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 'cyning-test'], { cwd: dir });
  return dir;
}

test('isNewerVersion semver', () => {
  assert.equal(isNewerVersion('0.2.0', '0.3.0'), true);
  assert.equal(isNewerVersion('0.3.0', '0.3.0'), false);
  assert.equal(isNewerVersion('0.4.0', '0.3.0'), false);
});

test('init 空目录写入 manifest 与 profile', () => {
  const target = mkTempProject();
  const result = runNode([
    'init',
    '--target',
    target,
    '--preset',
    'harness-only',
    '--ide',
    'cursor,agents',
    '--yes',
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const manifest = readManifest(target);
  assert.ok(manifest);
  assert.equal(manifest.preset, 'harness-only');
  assert.deepEqual(manifest.ide, ['cursor', 'agents']);
  assert.equal(manifest.version, '0.3.0');
  assert.ok(fs.existsSync(path.join(target, '.cyning-harness/profile.json')));
  assert.ok(fs.existsSync(path.join(target, 'docs/harness/prompts/10-requirements.md')));
});

test('upgrade --yes 等价 upgrade.sh 并更新 manifest', () => {
  const target = mkTempProject();
  let result = runNode([
    'init',
    '--target',
    target,
    '--preset',
    'harness-only',
    '--ide',
    'cursor',
    '--yes',
  ]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const before = readManifest(target);
  result = runNode(['upgrade', '--target', target, '--yes'], {
    HARNESS_VERSION: '0.3.1',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const after = readManifest(target);
  assert.equal(after.version, '0.3.1');
  assert.equal(after.from_version, before.version);
});

test('check 报告可升级状态', () => {
  const target = mkTempProject();
  runNode([
    'init',
    '--target',
    target,
    '--preset',
    'harness-only',
    '--ide',
    'cursor',
    '--yes',
  ]);
  const result = runNode(['check', '--target', target], {
    HARNESS_VERSION: '0.3.0',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /manifest\.version/);
});

test('S5 git-clean 阻止 dirty apply', () => {
  const target = mkTempProject();
  runNode([
    'init',
    '--target',
    target,
    '--preset',
    'harness-only',
    '--ide',
    'cursor',
    '--yes',
  ]);
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['commit', '-m', 'harness init'], { cwd: target });
  fs.appendFileSync(
    path.join(target, 'docs/harness/prompts/10-requirements.md'),
    '\n<!-- dirty -->\n',
  );
  const sync = spawnSync(
    'bash',
    [path.join(repoRoot, 'wizard/harness-sync.sh'), 'apply', '--target', target],
    {
      cwd: repoRoot,
      env: { ...process.env, CYNING_HARNESS: repoRoot },
      encoding: 'utf8',
    },
  );
  assert.notEqual(sync.status, 0);
  assert.match(sync.stderr + sync.stdout, /S5/);
});

test('resolveHarnessRoot 指向产品包根', () => {
  const root = resolveHarnessRoot();
  assert.ok(fs.existsSync(path.join(root, 'wizard/harness-sync.sh')));
});
