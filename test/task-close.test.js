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

const TASK_OK = `# Task · demo

> **状态**：\`done\` · 2026-07-22

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |

## 验收标准

- [x] 甲
- [X] 乙

### 自检结论（执行者）

npm test 全绿（42 passed）。
`;

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-close-'));
}

/** 标准 fixture：active task + invoke 落盘齐全；overrides 可改 task 正文 */
function writeFixture(target, { taskContent = TASK_OK, taskName = 'task_demo_v1.md', invoke = true } = {}) {
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(path.join(activeDir, taskName), taskContent);
  if (invoke) {
    const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
    fs.mkdirSync(invokeDir, { recursive: true });
    fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_30_demo.md'), '# invoke\n');
  }
  return path.join('docs/tasks/active', taskName);
}

function lastLine(stdout) {
  const lines = stdout.trim().split('\n');
  return lines[lines.length - 1];
}

test('close PASS + --yes：归档到同级 done/ · basename 保留 · 末行协议', () => {
  const target = makeTarget();
  const rel = writeFixture(target);

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo');
  assert.ok(!fs.existsSync(path.join(target, rel)), '源文件应被移走');
  assert.ok(
    fs.existsSync(path.join(target, 'docs/tasks/done/task_demo_v1.md')),
    '应归档到 docs/tasks/done/ 且 basename 保留',
  );
});

test('close 无 --yes = dry-run：只检不 mv · exit 0', () => {
  const target = makeTarget();
  const rel = writeFixture(target);

  const result = runNode(['task', 'close', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo');
  assert.match(result.stdout, /dry-run/);
  assert.ok(fs.existsSync(path.join(target, rel)), 'dry-run 不应 mv');
});

test('close BLOCKED：invoke 目录缺失 → exit 2 · 不 mv', () => {
  const target = makeTarget();
  const rel = writeFixture(target, { invoke: false });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2, result.stderr || result.stdout);
  assert.match(result.stdout, /CLOSE: BLOCKED · missing invoke snapshots/);
  assert.ok(fs.existsSync(path.join(target, rel)), 'BLOCKED 不应 mv');
});

test('close BLOCKED：invoke 目录存在但无 .md', () => {
  const target = makeTarget();
  const rel = writeFixture(target, { invoke: false });
  fs.mkdirSync(path.join(target, 'docs/harness/invokes/by-task/demo'), { recursive: true });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /missing invoke snapshots/);
  assert.ok(fs.existsSync(path.join(target, rel)));
});

test('close BLOCKED：自检结论为占位符（30/40 回填）', () => {
  const target = makeTarget();
  const rel = writeFixture(target, {
    taskContent: TASK_OK.replace('npm test 全绿（42 passed）。', '（30/40 回填）'),
  });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /CLOSE: BLOCKED/);
  assert.match(result.stdout, /自检结论/);
  assert.ok(fs.existsSync(path.join(target, rel)));
});

test('close BLOCKED：缺 ### 自检结论 节', () => {
  const target = makeTarget();
  const rel = writeFixture(target, {
    taskContent: TASK_OK.replace(/### 自检结论（执行者）[\s\S]*$/, ''),
  });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /自检结论/);
  assert.ok(fs.existsSync(path.join(target, rel)));
});

test('close BLOCKED：验收标准存在未勾选项；--allow-unchecked 放行并 warn', () => {
  const target = makeTarget();
  const rel = writeFixture(target, {
    taskContent: TASK_OK.replace('- [x] 甲', '- [ ] 甲'),
  });

  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /CLOSE: BLOCKED/);
  assert.match(blocked.stdout, /未勾选/);
  assert.ok(fs.existsSync(path.join(target, rel)));

  const waived = runNode(['task', 'close', '--file', rel, '--yes', '--allow-unchecked'], target);
  assert.equal(waived.status, 0, waived.stderr || waived.stdout);
  assert.match(waived.stdout, /warn/i);
  assert.equal(lastLine(waived.stdout), 'CLOSE: PASS · demo');
  assert.ok(fs.existsSync(path.join(target, 'docs/tasks/done/task_demo_v1.md')));
});

test('close BLOCKED：缺 ## 验收标准 节', () => {
  const target = makeTarget();
  const rel = writeFixture(target, {
    taskContent: TASK_OK.replace('## 验收标准', '## 验收（改名）'),
  });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /验收标准/);
  assert.ok(fs.existsSync(path.join(target, rel)));
});

test('close BLOCKED：文件名 slug ≠ 元信息 task_slug', () => {
  const target = makeTarget();
  const rel = writeFixture(target, { taskName: 'task_other_v1.md' });

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /slug/);
  assert.ok(fs.existsSync(path.join(target, rel)));
});

test('close BLOCKED：状态 in_progress；无反引号 done 可过', () => {
  const target = makeTarget();
  const rel = writeFixture(target, {
    taskContent: TASK_OK.replace('`done` · 2026-07-22', '`in_progress`'),
  });
  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /in_progress/);
  assert.ok(fs.existsSync(path.join(target, rel)));

  const target2 = makeTarget();
  const rel2 = writeFixture(target2, {
    taskContent: TASK_OK.replace('`done` · 2026-07-22', 'done（2026-07-22 验收通过）'),
  });
  const ok = runNode(['task', 'close', '--file', rel2, '--yes'], target2);
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  assert.equal(lastLine(ok.stdout), 'CLOSE: PASS · demo');
});

test('close BLOCKED：目标 done 文件已存在 · 不覆盖', () => {
  const target = makeTarget();
  const rel = writeFixture(target);
  const doneDir = path.join(target, 'docs/tasks/done');
  fs.mkdirSync(doneDir, { recursive: true });
  fs.writeFileSync(path.join(doneDir, 'task_demo_v1.md'), 'existing\n');

  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /已存在/);
  assert.ok(fs.existsSync(path.join(target, rel)));
  assert.equal(fs.readFileSync(path.join(doneDir, 'task_demo_v1.md'), 'utf8'), 'existing\n');
});

test('close：源文件不在 */active/ · 无 --target 拒绝；有 --target 放行', () => {
  const target = makeTarget();
  // 放在 done/ 下模拟二次 close
  const doneDir = path.join(target, 'docs/tasks/done');
  fs.mkdirSync(doneDir, { recursive: true });
  fs.writeFileSync(path.join(doneDir, 'task_demo_v1.md'), TASK_OK);
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invokeDir, { recursive: true });
  fs.writeFileSync(path.join(invokeDir, 'invoke.md'), '# invoke\n');

  const refused = runNode(['task', 'close', '--file', 'docs/tasks/done/task_demo_v1.md', '--yes'], target);
  assert.equal(refused.status, 2);
  assert.match(refused.stdout, /active/);

  const destArg = path.join(target, 'archive/task_demo_v1.md');
  const ok = runNode(
    ['task', 'close', '--file', 'docs/tasks/done/task_demo_v1.md', '--yes', '--target', destArg],
    target,
  );
  assert.equal(ok.status, 0, ok.stderr || ok.stdout);
  assert.ok(fs.existsSync(destArg));
});

test('close：编排仓布局 docs/harness/tasks/active → 同级 done', () => {
  const target = makeTarget();
  const activeDir = path.join(target, 'docs/harness/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(path.join(activeDir, 'task_demo_v1.md'), TASK_OK);
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invokeDir, { recursive: true });
  fs.writeFileSync(path.join(invokeDir, 'invoke.md'), '# invoke\n');

  const result = runNode(['task', 'close', '--file', 'docs/harness/tasks/active/task_demo_v1.md', '--yes'], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(
    fs.existsSync(path.join(target, 'docs/harness/tasks/done/task_demo_v1.md')),
    '应推导同级 done/',
  );
});
