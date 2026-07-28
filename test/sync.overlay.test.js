import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncSh = path.join(repoRoot, 'wizard', 'harness-sync.sh');

function gitInitCommit(dir) {
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 'test@cyning.dev'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 'cyning-test'], { cwd: dir });
  spawnSync('git', ['add', '-A'], { cwd: dir });
  spawnSync('git', ['commit', '-qm', 'init'], { cwd: dir });
}

function runSync(target) {
  return spawnSync('bash', [syncSh, 'apply', '--target', target], {
    env: { ...process.env, CYNING_HARNESS: repoRoot },
    encoding: 'utf8',
  });
}

test('sync overlay · 无定制：FRAGMENT 占位 → 01_struct', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-overlay-plain-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'profile.json'),
    JSON.stringify({
      preset: 'harness-only',
      tracks: { harness_prompts: true, ide_cursor: false, ide_claude: false, ide_agents: false },
    }),
  );
  gitInitCommit(target);
  const r = runSync(target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const frag = fs.readFileSync(
    path.join(target, 'docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md'),
    'utf8',
  );
  assert.match(frag, /01_struct/);
  assert.ok(!frag.includes('__HARNESS_GRAPH_MODULES_PATH__'));
  assert.match(r.stdout, /hint · overlay/);
});

test('sync overlay · graph_modules_path=l1/01_modules', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-overlay-gl-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'profile.json'),
    JSON.stringify({
      preset: 'fullstack-node-py',
      graph_modules_path: 'l1/01_modules',
      tracks: { harness_prompts: true, ide_agents: false, ide_claude: false, ide_cursor: false },
    }),
  );
  gitInitCommit(target);
  const r = runSync(target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const frag = fs.readFileSync(
    path.join(target, 'docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md'),
    'utf8',
  );
  assert.match(frag, /l1\/01_modules/);
  assert.ok(!frag.includes('01_struct或'));
});

test('sync overlay · local 块在产品 marker 外保留', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-overlay-local-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'profile.json'),
    JSON.stringify({
      tracks: { harness_prompts: false, ide_agents: true, ide_claude: false, ide_cursor: false },
    }),
  );
  fs.writeFileSync(
    path.join(target, 'AGENTS.md'),
    [
      '# biz',
      '',
      '<!-- cyning-harness:begin -->',
      'OLD PRODUCT',
      '<!-- cyning-harness:end -->',
      '',
      '<!-- cyning-harness-local:begin -->',
      'HG-PILOT-OPSDESK-GLAYER',
      'G-L0',
      'pre-30 invoke 缺失 → 拒改码',
      '<!-- cyning-harness-local:end -->',
      '',
    ].join('\n'),
  );
  gitInitCommit(target);
  const r = runSync(target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const agents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
  assert.match(agents, /HG-PILOT-OPSDESK-GLAYER/);
  assert.match(agents, /G-L0/);
  assert.match(agents, /pre-30 invoke 缺失/);
  assert.match(agents, /cyning-harness-local:begin/);
  assert.ok(!agents.includes('OLD PRODUCT'));
  assert.match(agents, /GATE_VERIFY|人工闸|HG-AUDIT-R1/);
});

test('sync overlay · 产品 marker 内嵌 local → salvage 到块外', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-overlay-salvage-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'profile.json'),
    JSON.stringify({
      tracks: { harness_prompts: false, ide_agents: true, ide_claude: false, ide_cursor: false },
    }),
  );
  fs.writeFileSync(
    path.join(target, 'AGENTS.md'),
    [
      '<!-- cyning-harness:begin -->',
      'OLD PRODUCT',
      '<!-- cyning-harness-local:begin -->',
      'SALVAGE_TOKEN_GLAYER',
      '<!-- cyning-harness-local:end -->',
      '<!-- cyning-harness:end -->',
      '',
    ].join('\n'),
  );
  gitInitCommit(target);
  const r = runSync(target);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /salvage/);
  const agents = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
  assert.match(agents, /SALVAGE_TOKEN_GLAYER/);
  assert.match(agents, /cyning-harness-local:begin/);
  // 产品新块在前；local 在 end 之后
  const productEnd = agents.indexOf('<!-- cyning-harness:end -->');
  const localBegin = agents.indexOf('<!-- cyning-harness-local:begin -->');
  assert.ok(productEnd >= 0 && localBegin > productEnd);
});
