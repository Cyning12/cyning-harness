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
  assert.ok(fs.existsSync(path.join(target, 'docs/harness/prompts/10-task-requirements.md')));
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

test('F1：upgrade 在已跟踪 local.json 路径变化时仍一把过（不因自身脏中止）', () => {
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

  // 模拟历史 npx 路径已入库
  const localPath = path.join(target, '.cyning-harness', 'local.json');
  fs.writeFileSync(
    localPath,
    `${JSON.stringify({ cyning_harness_root: '/tmp/fake-npx-hash/@cyning/harness' })}\n`,
  );
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['commit', '-m', 'init harness'], { cwd: target });

  result = runNode(['upgrade', '--target', target, '--yes'], {
    HARNESS_VERSION: '0.3.1',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stderr + result.stdout, /错误\(S5\)/);

  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  assert.equal(local.cyning_harness_root, repoRoot);
  assert.equal(readManifest(target).version, '0.3.1');
});

test('F2：upgrade 对 schema 外字段打 WARN · 干净五字段无非标准 WARN', () => {
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

  const mf = path.join(target, '.cyning-harness', 'manifest.json');
  const old = readManifest(target);
  fs.writeFileSync(
    mf,
    JSON.stringify(
      {
        ...old,
        name: 'ops-desk-web',
        tech_graph_dir: 'docs/_tech_graph',
        tasks_dir: 'docs/tasks',
        hooks: { graph_compile: 'scripts/graph-compile.sh' },
      },
      null,
      2,
    ),
  );
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['commit', '-m', 'legacy manifest fields'], { cwd: target });

  result = runNode(['upgrade', '--target', target, '--yes'], {
    HARNESS_VERSION: '0.3.1',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const out = result.stderr + result.stdout;
  assert.match(out, /WARN:.*非标准字段将被移除/);
  assert.match(out, /name/);
  assert.match(out, /tech_graph_dir/);
  assert.match(out, /tasks_dir/);
  assert.match(out, /hooks/);

  const after = readManifest(target);
  assert.equal(after.version, '0.3.1');
  assert.equal(after.name, undefined);
  assert.equal(after.tech_graph_dir, undefined);

  // 干净五字段再升：先提交首轮 upgrade 造成的簿记脏文件，再升
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['commit', '-m', 'after first upgrade'], { cwd: target });
  result = runNode(['upgrade', '--target', target, '--yes'], {
    HARNESS_VERSION: '0.3.2',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stderr + result.stdout, /非标准字段将被移除/);
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
    path.join(target, 'docs/harness/prompts/10-task-requirements.md'),
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
