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

/** 全过基准 fixture：含全部必填节 + 人工闸 */
const TASK_OK = `# Task · demo

> **状态**：\`draft\`（00 起草完成）

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | pending | 22, 30 | gate |

## 背景与目标

做一件事。

## 失败路径

| 触发 | 行为 | 可重试 |
| --- | --- | --- |
| x | y | 是 |

## 验收标准

- [ ] 甲
- [ ] 乙

### 自检结论（执行者）

（30/40 回填）
`;

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-lint-'));
}

function writeTask(target, content, name = 'task_demo_v1.md') {
  const dir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), content);
  return path.join('docs/tasks/active', name);
}

function lastLine(stdout) {
  const lines = stdout.trim().split('\n');
  return lines[lines.length - 1];
}

test('lint PASS：全节齐全 · exit 0 · 末行协议 · W3 占位符仅 warn', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK);

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(lastLine(result.stdout), 'LINT: PASS · task_demo_v1.md');
  assert.match(result.stdout, /W3/); // 占位符 warn
});

test('E1：缺 ## Harness 元信息 节 → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace(/## Harness 元信息[\s\S]*?\n\n### 人工闸/, '### 人工闸'));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E1/);
  assert.match(lastLine(result.stdout), /LINT: FAIL · task_demo_v1\.md/);
});

test('E1：元信息表缺 task_slug → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace('| **task_slug** | `demo` |', '| **test_strategy** | `required` |'));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E1/);
});

test('E2：缺 > **状态** 行 → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace('> **状态**：`draft`（00 起草完成）\n\n', ''));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E2/);
});

test('W1：状态 token 词表外 → warn · exit 0', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace('`draft`（00 起草完成）', '`frozen`（冻结）'));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /W1/);
});

test('E3：缺 ## 验收标准 节 → exit 2；有节无勾选项 → exit 2', () => {
  const target = makeTarget();
  const rel1 = writeTask(target, TASK_OK.replace(/## 验收标准[\s\S]*?\n\n### 自检结论/, '### 自检结论'), 'task_demo_v1.md');
  const r1 = runNode(['task', 'lint', '--file', rel1], target);
  assert.equal(r1.status, 2);
  assert.match(r1.stdout, /E3/);

  const rel2 = writeTask(target, TASK_OK.replace('- [ ] 甲\n- [ ] 乙', '甲\n乙'), 'task_demo2_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], target);
  assert.equal(r2.status, 2);
  assert.match(r2.stdout, /E3/);
});

test('E4：缺失败路径节 → exit 2；failure_paths / 失败路径表 变体 → pass', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace(/## 失败路径[\s\S]*?\n\n## 验收标准/, '## 验收标准'));
  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E4/);

  const t2 = makeTarget();
  const rel2 = writeTask(t2, TASK_OK.replace('## 失败路径', '## failure_paths'), 'task_demo_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], t2);
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);

  const t3 = makeTarget();
  const rel3 = writeTask(t3, TASK_OK.replace('## 失败路径', '## 失败路径表'), 'task_demo_v1.md');
  const r3 = runNode(['task', 'lint', '--file', rel3], t3);
  assert.equal(r3.status, 0, r3.stderr || r3.stdout);
});

test('标题提及不误伤：表格/正文中的 `## 验收标准` 文本不算节（行首锚定）', () => {
  const target = makeTarget();
  // 在真实节前插入一处行内提及（本 task 自身的规则表就是这种形态）
  const content = TASK_OK.replace(
    '## 背景与目标',
    '## 规则说明\n\n| # | 规则 |\n| --- | --- |\n| E3 | 缺 `## 验收标准` 节或节内无勾选项 |\n| E5 | 缺 `### 自检结论` 节 |\n\n## 背景与目标',
  );
  const rel = writeTask(target, content);

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(lastLine(result.stdout), 'LINT: PASS · task_demo_v1.md');
});

test('E5：缺 ### 自检结论 节 → exit 2', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace(/### 自检结论（执行者）[\s\S]*$/, ''));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E5/);
});

test('E6：真实绝对路径 → exit 2 带行号；规则自身的泛型写法不误伤', () => {
  const target = makeTarget();
  const withReal = writeTask(
    target,
    TASK_OK.replace('做一件事。', '做一件事。\n\n参考 /Users/cyning/Desktop/secret.md 与 /home/admin/x.md'),
  );
  const r1 = runNode(['task', 'lint', '--file', withReal], target);
  assert.equal(r1.status, 2);
  assert.match(r1.stdout, /E6/);
  assert.match(r1.stdout, /E6:L\d+/); // 行号

  // 泛型模式（/Users/ 后无真实段 · 如规则文档自身）不触发
  const t2 = makeTarget();
  const generic = writeTask(
    t2,
    TASK_OK.replace('做一件事。', '禁写 `/Users/`、`/home/`、`/root/` 形式的路径。'),
  );
  const r2 = runNode(['task', 'lint', '--file', generic], t2);
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);

  // Windows 真实路径
  const t3 = makeTarget();
  const win = writeTask(t3, TASK_OK.replace('做一件事。', '见 C:\\Users\\cyning\\x.md'));
  const r3 = runNode(['task', 'lint', '--file', win], t3);
  assert.equal(r3.status, 2);
  assert.match(r3.stdout, /E6/);
});

test('E7：文件名 slug ≠ 元信息 task_slug → exit 2；下划线↔连字符等价 → pass', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK, 'task_other_name_v1.md');
  const r1 = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(r1.status, 2);
  assert.match(r1.stdout, /E7/);

  const t2 = makeTarget();
  const content = TASK_OK.replace('**task_slug** | `demo`', '**task_slug** | `demo-task`');
  const rel2 = writeTask(t2, content, 'task_demo_task_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], t2);
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);
});

test('W2：缺 ### 人工闸 节 → warn · exit 0', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace(/### 人工闸[\s\S]*?\n\n## 背景与目标/, '## 背景与目标'));

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /W2/);
});

test('--json：统一契约 {ok, errors[], warnings[], file, slug} · errors 元素含 rule/message', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK.replace('> **状态**：`draft`（00 起草完成）\n\n', ''));

  const result = runNode(['task', 'lint', '--file', rel, '--json'], target);
  assert.equal(result.status, 2);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.ok, false);
  assert.ok(Array.isArray(payload.errors));
  assert.ok(Array.isArray(payload.warnings));
  assert.equal(payload.slug, 'demo');
  assert.ok(payload.errors.some((e) => e.rule === 'E2' && typeof e.message === 'string'));
});

test('usage：缺 --file 或文件不存在 → exit 1', () => {
  const target = makeTarget();
  const r1 = runNode(['task', 'lint'], target);
  assert.equal(r1.status, 1);

  const r2 = runNode(['task', 'lint', '--file', 'docs/tasks/active/nope_v1.md'], target);
  assert.equal(r2.status, 1);
});
