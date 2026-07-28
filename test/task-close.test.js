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
| **graph_delta** | \`none\` |
| **graph_delta_note** | \`fixture · 无图谱增量\` |
| **wiki_delta** | \`n/a\` |
| **wiki_delta_note** | \`fixture · 无 wiki 轨\` |

## 验收标准

- [x] 甲
- [X] 乙

### 自检结论（执行者）

npm test 全绿（42 passed）。

### KPI（00）

Task_KPI%: 88

### 经验总结

- fixture 基线通过
- close 闸覆盖 invoke 与自检
- KPI 最小形态可解析
`;

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-close-'));
}

/**
 * 标准 fixture：active task + invoke hats（默认 10 + 30_40）+ R1 审查文。
 * invokeMode: 'default' | 'minimal30' | false（配合 invoke:false）
 */
function writeFixture(
  target,
  {
    taskContent = TASK_OK,
    taskName = 'task_demo_v1.md',
    invoke = true,
    review = true,
    invokeMode = 'default',
    invokeSlug = 'demo',
  } = {},
) {
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(path.join(activeDir, taskName), taskContent);
  if (invoke) {
    const invokeDir = path.join(target, 'docs/harness/invokes/by-task', invokeSlug);
    fs.mkdirSync(invokeDir, { recursive: true });
    if (invokeMode === 'minimal30') {
      fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_30_demo.md'), '# invoke 30\n');
    } else {
      fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_10_demo.md'), '# invoke 10\n');
      fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_30_40_demo.md'), '# invoke 30+40\n');
    }
  }
  if (review) {
    const reviewsDir = path.join(target, 'docs/harness/reviews');
    fs.mkdirSync(reviewsDir, { recursive: true });
    const reviewBase = taskName.replace(/\.md$/, '').replace(/^task_/, 'task_');
    // task_demo_v1 → task_demo_audit；strip _v1 for findReview stripVer
    const reviewName = `${reviewBase.replace(/_v\d+$/, '')}_audit_R1_20260724.md`;
    fs.writeFileSync(path.join(reviewsDir, reviewName), '# review\n');
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

test('close PASS：文件名下划线 ↔ task_slug 连字符惯例等价（工作区实测惯例）', () => {
  const target = makeTarget();
  const content = TASK_OK.replace('**task_slug** | `demo`', '**task_slug** | `demo-task`');
  writeFixture(target, {
    taskContent: content,
    taskName: 'task_demo_task_v1.md',
    invokeSlug: 'demo-task',
  });

  const result = runNode(['task', 'close', '--file', 'docs/tasks/active/task_demo_task_v1.md', '--yes'], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(lastLine(result.stdout), 'CLOSE: PASS · demo-task');
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
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_10_demo.md'), '# invoke 10\n');
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_30_40_demo.md'), '# invoke 30+40\n');
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'task_demo_audit_R1_20260724.md'), '# review\n');

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

test('close 检查 6：R<n> 审查文缺失 → exit 2 不 mv；--allow-no-review warn 放行', () => {
  const target = makeTarget();
  const rel = writeFixture(target, { review: false });

  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /missing R<n> review/);
  assert.ok(fs.existsSync(path.join(target, rel)), 'BLOCKED 不应 mv');

  const waived = runNode(['task', 'close', '--file', rel, '--yes', '--allow-no-review'], target);
  assert.equal(waived.status, 0, waived.stderr || waived.stdout);
  assert.match(waived.stdout, /warn/i);
  assert.equal(lastLine(waived.stdout), 'CLOSE: PASS · demo');
  assert.ok(fs.existsSync(path.join(target, 'docs/tasks/done/task_demo_v1.md')));
});

test('close：编排仓布局 docs/harness/tasks/active → 同级 done', () => {
  const target = makeTarget();
  const activeDir = path.join(target, 'docs/harness/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(path.join(activeDir, 'task_demo_v1.md'), TASK_OK);
  const invokeDir = path.join(target, 'docs/harness/invokes/by-task/demo');
  fs.mkdirSync(invokeDir, { recursive: true });
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_10_demo.md'), '# invoke 10\n');
  fs.writeFileSync(path.join(invokeDir, 'invoke_20260722_30_40_demo.md'), '# invoke 30+40\n');
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  fs.mkdirSync(reviewsDir, { recursive: true });
  fs.writeFileSync(path.join(reviewsDir, 'task_demo_audit_R1_20260724.md'), '# review\n');

  const result = runNode(['task', 'close', '--file', 'docs/harness/tasks/active/task_demo_v1.md', '--yes'], target);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(
    fs.existsSync(path.join(target, 'docs/harness/tasks/done/task_demo_v1.md')),
    '应推导同级 done/',
  );
});

test('close BLOCKED：graph_delta=none 无 note', () => {
  const target = makeTarget();
  const cleaned = TASK_OK.replace(
    /\|\s*\*\*graph_delta_note\*\*\s*\|\s*`[^`]*`\s*\|\n?/,
    '',
  );
  const rel = writeFixture(target, { taskContent: cleaned });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2, result.stdout);
  assert.match(result.stdout, /graph_delta_note/);
});

test('close BLOCKED：graph_delta 路径不存在', () => {
  const target = makeTarget();
  const content = TASK_OK.replace(
    '| **graph_delta** | `none` |',
    '| **graph_delta** | `docs/_tech_graph/missing_flow.md` |',
  ).replace(/\|\s*\*\*graph_delta_note\*\*\s*\|\s*`[^`]*`\s*\|\n?/, '');
  const rel = writeFixture(target, { taskContent: content });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /graph_delta 路径不存在/);
});

test('close WARN：缺 graph_delta 字段（不 BLOCK）', () => {
  const target = makeTarget();
  const content = TASK_OK.replace(/\|\s*\*\*graph_delta\*\*\s*\|\s*`[^`]*`\s*\|\n?/, '').replace(
    /\|\s*\*\*graph_delta_note\*\*\s*\|\s*`[^`]*`\s*\|\n?/,
    '',
  );
  const rel = writeFixture(target, { taskContent: content });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /warn:.*graph_delta/i);
});

test('close BLOCKED：KPI 无可解析分数；--allow-kpi-gap 放行', () => {
  const target = makeTarget();
  const content = TASK_OK.replace('Task_KPI%: 88', '（关账待填）');
  const rel = writeFixture(target, { taskContent: content });

  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /KPI/);

  const waived = runNode(
    ['task', 'close', '--file', rel, '--yes', '--allow-kpi-gap'],
    target,
  );
  assert.equal(waived.status, 0, waived.stdout);
  assert.match(waived.stdout, /allow-kpi-gap/);
});

test('close BLOCKED：experience_capture=required 无经验节；--allow-experience-gap 放行', () => {
  const target = makeTarget();
  let content = TASK_OK.replace(
    '| **graph_delta_note** | `fixture · 无图谱增量` |',
    '| **graph_delta_note** | `fixture · 无图谱增量` |\n| **experience_capture** | `required` |',
  );
  content = content.replace(/### 经验总结[\s\S]*$/, '');
  const rel = writeFixture(target, { taskContent: content });

  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /experience/i);

  const waived = runNode(
    ['task', 'close', '--file', rel, '--yes', '--allow-experience-gap'],
    target,
  );
  assert.equal(waived.status, 0, waived.stdout);
  assert.match(waived.stdout, /allow-experience-gap/);
});

test('close PASS：四维 KPI 简表可解析', () => {
  const target = makeTarget();
  const content = TASK_OK.replace(
    'Task_KPI%: 88',
    '| 维 | 分 |\n| --- | --- |\n| 质量 | 4 |\n| 过程 | 5 |\n| 可观测 | 4 |\n| 回馈 | 3 |',
  );
  const rel = writeFixture(target, { taskContent: content });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 0, result.stdout);
});

test('close BLOCKED：缺 wiki_delta 字段；--allow-wiki-gap 放行', () => {
  const target = makeTarget();
  const content = TASK_OK.replace(/\|\s*\*\*wiki_delta\*\*\s*\|\s*`[^`]*`\s*\|\n?/, '').replace(
    /\|\s*\*\*wiki_delta_note\*\*\s*\|\s*`[^`]*`\s*\|\n?/,
    '',
  );
  const rel = writeFixture(target, { taskContent: content });
  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2);
  assert.match(blocked.stdout, /wiki_delta/);

  const waived = runNode(
    ['task', 'close', '--file', rel, '--yes', '--allow-wiki-gap'],
    target,
  );
  assert.equal(waived.status, 0, waived.stdout);
  assert.match(waived.stdout, /allow-wiki-gap/);
});

test('close BLOCKED：wiki_delta=none 无 note', () => {
  const target = makeTarget();
  const content = TASK_OK.replace('| **wiki_delta** | `n/a` |', '| **wiki_delta** | `none` |').replace(
    /\|\s*\*\*wiki_delta_note\*\*\s*\|\s*`[^`]*`\s*\|\n?/,
    '',
  );
  const rel = writeFixture(target, { taskContent: content });
  const result = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(result.status, 2);
  assert.match(result.stdout, /wiki_delta_note|wiki_delta=none/);
});

test('close BLOCKED：experience=required + wiki path 无晋升指针；有指针则 PASS', () => {
  const target = makeTarget();
  const wikiDir = path.join(target, 'docs/coding_wiki');
  fs.mkdirSync(wikiDir, { recursive: true });
  fs.writeFileSync(path.join(wikiDir, 'volatile.md'), '# v\n');

  const baseMeta = `| 字段 | 值 |
| --- | --- |
| **task_slug** | \`demo\` |
| **graph_delta** | \`none\` |
| **graph_delta_note** | \`fixture · 无图谱增量\` |
| **wiki_delta** | \`docs/coding_wiki/volatile.md\` |
| **wiki_delta_note** | \`updated volatile\` |
| **experience_capture** | \`required\` |
`;

  const tail = `
## 验收标准

- [x] 甲
- [X] 乙

### 自检结论（执行者）

npm test 全绿（42 passed）。

### KPI（00）

Task_KPI%: 88

`;

  const missingPtr = `# Task · demo

> **状态**：\`done\` · 2026-07-22

## Harness 元信息

${baseMeta}
${tail}
### 经验总结

- fixture 基线通过
- close 闸覆盖 invoke 与自检
- KPI 最小形态可解析
`;

  const rel = writeFixture(target, { taskContent: missingPtr });
  const blocked = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(blocked.status, 2, blocked.stdout);
  assert.match(blocked.stdout, /wiki 晋升|coding_wiki|wiki_promoted/i);

  const withPtr = missingPtr.replace(
    /### 经验总结[\s\S]*$/,
    '### 经验总结\n\n- fixture 基线通过\n- close 闸覆盖 invoke 与自检\n- Wiki: docs/coding_wiki/volatile.md\n',
  );
  fs.writeFileSync(path.join(target, 'docs/tasks/active/task_demo_v1.md'), withPtr);
  const ok = runNode(['task', 'close', '--file', rel, '--yes'], target);
  assert.equal(ok.status, 0, ok.stdout);
});
