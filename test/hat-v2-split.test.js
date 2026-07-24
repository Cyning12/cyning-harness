import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncSh = path.join(repoRoot, 'wizard', 'harness-sync.sh');

const NEW_HATS = [
  '10-task-requirements.md',
  '10-spec-requirements.md',
  '20-task-audit.md',
  '20-spec-audit.md',
  '30-execute-code.md',
  '40-self-check.md',
];
const OLD_HATS = ['10-requirements.md', '22-task-audit.md'];

/** shipped 路径（零残留断言范围 · _sandbox 不 ship 除外） */
const SHIPPED_DIRS = ['lib', 'wizard', 'harness', 'ide', 'ci', 'golden'];
const SHIPPED_FILES = ['README.md', 'AGENTS.md'];

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
      yield* walk(full);
    } else if (/\.(md|js|sh|example)$/.test(ent.name)) {
      yield full;
    }
  }
}

test('包内帽集合 = V2 六帽 · 旧 2 帽不存在', () => {
  const promptsDir = path.join(repoRoot, 'harness', 'prompts');
  for (const f of NEW_HATS) {
    assert.ok(fs.existsSync(path.join(promptsDir, f)), `缺新帽 ${f}`);
  }
  for (const f of OLD_HATS) {
    assert.ok(!fs.existsSync(path.join(promptsDir, f)), `旧帽应删除 ${f}`);
  }
});

test('旧文件名引用零残留（shipped 文件 · 路径形态引用 · docs 历史留档豁免）', () => {
  const hits = [];
  const scan = (full) => {
    const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
    if (rel.includes('_sandbox')) return; // npm 不 ship
    const content = fs.readFileSync(full, 'utf8');
    for (const [i, line] of content.split('\n').entries()) {
      for (const old of OLD_HATS) {
        // 只挡「活引用」：`/10-requirements.md` 路径形态或 ]( 链接形态；
        // 改名映射/修订记录里的裸名提及（自 `X` 改名 · X → Y）是合法历史，不挡
        const asPath = line.includes(`/${old}`);
        const asLink = line.includes('](') && line.includes(old);
        if (asPath || asLink) hits.push(`${rel}:${i + 1} → ${old}`);
      }
    }
  };
  for (const d of SHIPPED_DIRS) {
    const dir = path.join(repoRoot, d);
    if (fs.existsSync(dir)) for (const f of walk(dir)) scan(f);
  }
  const demoDir = path.join(repoRoot, 'examples', 'demo_checkout');
  if (fs.existsSync(demoDir)) for (const f of walk(demoDir)) scan(f);
  for (const f of SHIPPED_FILES) {
    const full = path.join(repoRoot, f);
    if (fs.existsSync(full)) scan(full);
  }
  assert.deepEqual(hits, [], `旧文件名残留:\n${hits.join('\n')}`);
});

function runSync(target, env = {}) {
  return spawnSync('bash', [syncSh, 'apply', '--target', target], {
    env: { ...process.env, CYNING_HARNESS: repoRoot, ...env },
    encoding: 'utf8',
  });
}

function makeTargetWithOldHats() {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-obsolete-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'profile.json'),
    '{"harness_prompts": true}\n',
  );
  const promptsDir = path.join(target, 'docs/harness/prompts');
  fs.mkdirSync(promptsDir, { recursive: true });
  for (const f of OLD_HATS) {
    fs.writeFileSync(path.join(promptsDir, f), '# old hat\n');
  }
  // sync 会写新帽 · 需要一个 git 仓规避 git-clean 检查
  spawnSync('git', ['init', '-q'], { cwd: target });
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init'], { cwd: target });
  return target;
}

test('sync obsolete：target 含旧帽 → warn 提示人工删除 · 不自动删 · 新帽照落', () => {
  const target = makeTargetWithOldHats();

  const result = runSync(target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /warn: obsolete/);
  assert.match(result.stdout, /10-requirements\.md/);
  assert.match(result.stdout, /22-task-audit\.md/);

  const promptsDir = path.join(target, 'docs/harness/prompts');
  // 不自动删
  for (const f of OLD_HATS) {
    assert.ok(fs.existsSync(path.join(promptsDir, f)), `obsolete 不应自动删 ${f}`);
  }
  // 新帽照落
  for (const f of NEW_HATS) {
    assert.ok(fs.existsSync(path.join(promptsDir, f)), `新帽应落地 ${f}`);
  }

  // 人工删除后 warn 消失
  for (const f of OLD_HATS) fs.rmSync(path.join(promptsDir, f));
  spawnSync('git', ['add', '-A'], { cwd: target });
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'rm old'], { cwd: target });
  const result2 = runSync(target);
  assert.equal(result2.status, 0, result2.stderr || result2.stdout);
  assert.doesNotMatch(result2.stdout, /warn: obsolete/);
});
