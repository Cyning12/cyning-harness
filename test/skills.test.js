import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildSkills,
  checkSkills,
  generateSkills,
  loadSkillPrompts,
  validateSkillFrontmatter,
} from '../lib/skills.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');
const promptsDir = path.join(repoRoot, 'harness', 'prompts');

function runNode(args, env = {}) {
  return spawnSync(process.execPath, [harnessBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ---------- frontmatter 约束 ----------

test('真包 6 条文 frontmatter 全部合法', () => {
  const prompts = loadSkillPrompts({ promptsDir });
  assert.equal(prompts.length, 6);
  for (const p of prompts) {
    assert.deepEqual(p.errors, [], `${p.file}: ${p.errors.join('; ')}`);
  }
  const names = prompts.map((p) => p.frontmatter.name).sort();
  assert.deepEqual(names, [
    'harness-10-spec',
    'harness-10-task',
    'harness-20-spec-audit',
    'harness-20-task-audit',
    'harness-30-execute',
    'harness-40-self-check',
  ]);
});

test('非法 name（大写/连字符）→ 报错', () => {
  for (const bad of ['Harness-10-task', '-x', 'x-', 'a--b', 'bad_name']) {
    const errs = validateSkillFrontmatter({ name: bad, description: 'd' }, 'fixture');
    assert.ok(errs.length > 0, `name=${bad} 应报错`);
  }
});

test('description 缺失或超 1024 → 报错', () => {
  assert.ok(validateSkillFrontmatter({ name: 'ok-name' }, 'f').length > 0);
  assert.ok(
    validateSkillFrontmatter({ name: 'ok-name', description: 'x'.repeat(1025) }, 'f').length > 0,
  );
  assert.equal(
    validateSkillFrontmatter({ name: 'ok-name', description: 'x'.repeat(1024) }, 'f').length,
    0,
  );
});

// ---------- 生成集与隔离 ----------

test('默认生成 4 帽 · 不含 30/40；withExecuteHats 生成 6 帽', () => {
  const def = generateSkills({ promptsDir });
  assert.equal(def.errors.length, 0, def.errors.join('; '));
  const dirs = new Set(
    [...def.files.keys()].filter((k) => k.includes('/')).map((k) => k.split('/')[0]),
  );
  assert.deepEqual([...dirs].sort(), [
    'harness-10-spec',
    'harness-10-task',
    'harness-20-spec-audit',
    'harness-20-task-audit',
  ]);
  const all = generateSkills({ promptsDir, withExecuteHats: true });
  const dirsAll = new Set(
    [...all.files.keys()].filter((k) => k.includes('/')).map((k) => k.split('/')[0]),
  );
  assert.equal(dirsAll.size, 6);
  assert.ok(dirsAll.has('harness-30-execute'));
  assert.ok(dirsAll.has('harness-40-self-check'));
});

test('生成确定性：两次 generateSkills 字节一致', () => {
  const a = generateSkills({ promptsDir, withExecuteHats: true });
  const b = generateSkills({ promptsDir, withExecuteHats: true });
  assert.deepEqual([...a.files.keys()].sort(), [...b.files.keys()].sort());
  for (const [k, v] of a.files) {
    assert.equal(b.files.get(k), v, k);
  }
});

test('30 帽链接重写 + references 复制', () => {
  const all = generateSkills({ promptsDir, withExecuteHats: true });
  const skill = all.files.get('harness-30-execute/SKILL.md');
  assert.ok(skill, '缺 harness-30-execute/SKILL.md');
  assert.match(skill, /references\/FRAGMENT_30_gate_verify_v1_zh\.md/);
  assert.match(skill, /references\/TEMPLATE_30_gate_stop\.md/);
  assert.ok(!skill.includes('](./FRAGMENT_'), '仍有未重写链接');
  assert.ok(all.files.has('harness-30-execute/references/FRAGMENT_30_gate_verify_v1_zh.md'));
  assert.ok(all.files.has('harness-30-execute/references/TEMPLATE_30_gate_stop.md'));
  // 未被 30 正文引用的 fragment 不进包
  assert.ok(!all.files.has('harness-30-execute/references/FRAGMENT_30_invoke_block_v1_zh.md'));
});

test('生成 README 含执行帽缺席标注', () => {
  const def = generateSkills({ promptsDir });
  const readme = def.files.get('README.md');
  assert.ok(readme, '缺生成的 skills/README.md');
  assert.match(readme, /生成物/);
  assert.match(readme, /harness-30-execute/);
  assert.match(readme, /不在本分发|未过 T1/);
});

// ---------- build / check ----------

test('build 落盘 + check 通过（tmp 工作区）', () => {
  const root = tmpdir('skills-build-');
  const pp = path.join(root, 'harness', 'prompts');
  fs.mkdirSync(pp, { recursive: true });
  for (const f of fs.readdirSync(promptsDir)) {
    fs.copyFileSync(path.join(promptsDir, f), path.join(pp, f));
  }
  const r = buildSkills({ promptsDir: pp, outDir: path.join(root, 'skills') });
  assert.equal(r.written.length > 0, true);
  assert.ok(fs.existsSync(path.join(root, 'skills', 'harness-10-task', 'SKILL.md')));
  const c = checkSkills({ promptsDir: pp, skillsDir: path.join(root, 'skills') });
  assert.equal(c.ok, true, c.errors.join('; '));
});

test('drift：手改生成物 → check 报文件名', () => {
  const root = tmpdir('skills-drift-');
  const pp = path.join(root, 'harness', 'prompts');
  fs.mkdirSync(pp, { recursive: true });
  for (const f of fs.readdirSync(promptsDir)) {
    fs.copyFileSync(path.join(promptsDir, f), path.join(pp, f));
  }
  buildSkills({ promptsDir: pp, outDir: path.join(root, 'skills') });
  const target = path.join(root, 'skills', 'harness-10-task', 'SKILL.md');
  fs.appendFileSync(target, '\nhand edit\n');
  const c = checkSkills({ promptsDir: pp, skillsDir: path.join(root, 'skills') });
  assert.equal(c.ok, false);
  assert.ok(c.errors.some((e) => e.includes('harness-10-task/SKILL.md')), c.errors.join('; '));
});

test('repo 现状：skills check 绿（生成物入库不 drift）', () => {
  const c = checkSkills({
    promptsDir,
    skillsDir: path.join(repoRoot, 'skills'),
  });
  assert.equal(c.ok, true, c.errors.join('; '));
});

test('CLI · skills check exit 0', () => {
  const r = runNode(['skills', 'check']);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /SKILLS CHECK: PASS/);
});

test('CLI · skills build --with-execute-hats 写入 CYNING_HARNESS 指向的 tmp 根', () => {
  const root = tmpdir('skills-cli-');
  const pp = path.join(root, 'harness', 'prompts');
  fs.mkdirSync(pp, { recursive: true });
  for (const f of fs.readdirSync(promptsDir)) {
    fs.copyFileSync(path.join(promptsDir, f), path.join(pp, f));
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'tmp', version: '0.0.0' }));
  const r = runNode(['skills', 'build', '--with-execute-hats'], { CYNING_HARNESS: root });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.ok(fs.existsSync(path.join(root, 'skills', 'harness-30-execute', 'SKILL.md')));
});
