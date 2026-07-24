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

// ─── G4 · 思考轮结构规则组（E8–E10 / W4–W5）───────────────────────────

/** 形态 A：完整 R0–R5 + 控制表三字段 + early_stop=no */
const THINK_CONTROL = `
### 思考轮控制

| 字段 | 值 |
| --- | --- |
| \`actual_last_round\` | \`R5\` |
| \`early_stop\` | \`no\` |
| \`early_stop_reason\` | — |
| \`residual_risks\` | none |
`;

const THINK_SLOTS = `
### R0 · 读入

（待填）

### R1 · 范围

（待填）

### R2 · 方案

（跳过 · 见思考轮控制）

### R3 · 边界

（待填）

### R4 · 验收

（待填）

### R5 · 签收就绪

（待填）
`;

const TASK_THINK_A = TASK_OK.replace(
  '### 自检结论（执行者）\n\n（30/40 回填）\n',
  `## 思考轮回填\n${THINK_SLOTS}${THINK_CONTROL}\n### 自检结论（执行者）\n\n（30/40 回填）\n`,
);

test('think-A：完整 R0–R5 + 控制表 → 无 E8/E9/E10 · exit 0 · 无 W4', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_THINK_A, 'task_think_a_ok_v1.md');
  // slug 对齐
  const content = fs.readFileSync(path.join(target, rel), 'utf8').replace('`demo`', '`think-a-ok`');
  fs.writeFileSync(path.join(target, rel), content);

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /\bE8\b|\bE9\b|\bE10\b|\bW4\b/);
});

test('think-A：缺 ### R3 槽 → E8 exit 2', () => {
  const target = makeTarget();
  const broken = TASK_THINK_A.replace(/### R3 · 边界[\s\S]*?\n\n### R4/, '### R4');
  const rel = writeTask(target, broken.replace('`demo`', '`think-a-miss-r3`'), 'task_think_a_miss_r3_v1.md');

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E8/);
});

test('think-A：缺 actual_last_round → E9 exit 2', () => {
  const target = makeTarget();
  const broken = TASK_THINK_A.replace('| `actual_last_round` | `R5` |\n', '');
  const rel = writeTask(target, broken.replace('`demo`', '`think-a-miss-field`'), 'task_think_a_miss_field_v1.md');

  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /E9/);
});

test('think-A：early_stop=yes 无 reason → E10 exit 2；有 reason → pass', () => {
  const target = makeTarget();
  const noReason = TASK_THINK_A.replace('| `early_stop` | `no` |', '| `early_stop` | `yes` |').replace(
    '| `early_stop_reason` | — |',
    '| `early_stop_reason` |  |',
  );
  const rel = writeTask(target, noReason.replace('`demo`', '`think-a-e10`'), 'task_think_a_e10_v1.md');
  const r1 = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(r1.status, 2);
  assert.match(r1.stdout, /E10/);

  const t2 = makeTarget();
  const withReason = TASK_THINK_A.replace('| `early_stop` | `no` |', '| `early_stop` | `yes` |').replace(
    '| `early_stop_reason` | — |',
    '| `early_stop_reason` | `scope 已闭合` |',
  );
  const rel2 = writeTask(t2, withReason.replace('`demo`', '`think-a-e10-ok`'), 'task_think_a_e10_ok_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], t2);
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);
  assert.doesNotMatch(r2.stdout, /\bE10\b/);
});

test('think-B/C：无思考轮节 → 仅 W4 · exit 0', () => {
  const target = makeTarget();
  const rel = writeTask(target, TASK_OK); // 形态 C：无节
  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /W4/);
});

test('think-A：### R6 无 round_extension_note → W5 · exit 0', () => {
  const target = makeTarget();
  const withR6 = TASK_THINK_A.replace(
    '### R5 · 签收就绪\n\n（待填）\n',
    '### R5 · 签收就绪\n\n（待填）\n\n### R6 · 扩展\n\n补一轮。\n',
  );
  const rel = writeTask(target, withR6.replace('`demo`', '`think-a-r6`'), 'task_think_a_r6_v1.md');
  const r1 = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(r1.status, 0);
  assert.match(r1.stdout, /W5/);

  const t2 = makeTarget();
  const withNote = withR6.replace(
    '| `residual_risks` | none |',
    '| `residual_risks` | none |\n| `round_extension_note` | `R6 补边界` |',
  );
  const rel2 = writeTask(t2, withNote.replace('`demo`', '`think-a-r6-ok`'), 'task_think_a_r6_ok_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], t2);
  assert.equal(r2.status, 0, r2.stderr || r2.stdout);
  assert.doesNotMatch(r2.stdout, /\bW5\b/);
});

test('think-A：槽标题带后缀宽容 · 占位符不触发 E', () => {
  const target = makeTarget();
  // TASK_THINK_A 已含「### R3 · 边界」后缀与（待填）/（跳过）
  const rel = writeTask(target, TASK_THINK_A.replace('`demo`', '`think-a-suffix`'), 'task_think_a_suffix_v1.md');
  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /\bE8\b|\bE9\b|\bE10\b/);
});

test('think-A：控制表字段 **bold** 写法不误报 E9（dogfood）', () => {
  const target = makeTarget();
  const bold = TASK_THINK_A.replace('| `actual_last_round` |', '| **actual_last_round** |')
    .replace('| `early_stop` |', '| **early_stop** |')
    .replace('| `residual_risks` |', '| **residual_risks** |')
    .replace('`demo`', '`think-a-bold`');
  const rel = writeTask(target, bold, 'task_think_a_bold_v1.md');
  const result = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(result.stdout, /\bE9\b/);
});

test('正文提及「思考轮」不触发；仅行首 ### R0 或思考轮标题触发', () => {
  const target = makeTarget();
  // 正文提及，无槽、无思考轮标题 → 应 W4（未触发结构检查）
  const mention = TASK_OK.replace('做一件事。', '本闸检查思考轮结构，但不在此处开槽。');
  const rel = writeTask(target, mention);
  const r1 = runNode(['task', 'lint', '--file', rel], target);
  assert.equal(r1.status, 0);
  assert.match(r1.stdout, /W4/);
  assert.doesNotMatch(r1.stdout, /\bE8\b/);

  // 仅 ## 思考轮 标题、无 ### R0 → 触发后 E8（缺槽）
  const t2 = makeTarget();
  const headingOnly = TASK_OK.replace(
    '### 自检结论（执行者）\n\n（30/40 回填）\n',
    '## 思考轮回填\n\n说明文字无槽。\n\n### 自检结论（执行者）\n\n（30/40 回填）\n',
  ).replace('`demo`', '`think-heading-only`');
  const rel2 = writeTask(t2, headingOnly, 'task_think_heading_only_v1.md');
  const r2 = runNode(['task', 'lint', '--file', rel2], t2);
  assert.equal(r2.status, 2);
  assert.match(r2.stdout, /E8/);
});
