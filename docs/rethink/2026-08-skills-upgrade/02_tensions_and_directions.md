---
name: rethink-skills-upgrade-02-tensions-and-directions
description: 关键张力与候选方向 · 自动激活 vs 串行协议等五张力 + A/B/C/D 方向 + 反方向纪律 · 何时读：评审 skills 升级路线
---

# 02 · 张力与候选方向

> **简介**：Skills 升级的真正难点不是格式翻译（01 已证低成本），而是五个结构性张力。本文先列张力，再给候选方向 A/B/C/D 与排序，最后立反方向纪律。

## 1. 五个关键张力

### T1 · 自动激活 vs 串行协议（最锋利）

Skill 的语义是「**任务匹配 description 就自动加载**」；harness 链的语义是「**Lead 按协议显式换帽，闸不过不前进**」。
具体风险：用户在子仓改码时说「帮我补个测试」，client 若自动激活了 30-execute-code 类 skill，可能**绕过 HG-AUDIT-R1 pending 的停工纪律**——`pending → 30 拒改码` 目前是协议层纪律，skill 自动激活会让它变成「看模型心情」。
**初判**：帽执行类（30/40/50）的 skill 化必须带「**负向触发**」设计——description 与正文第一条指令都是「先查 gate，pending 即停」；且 knowledge 类先行、执行类后置。

### T2 · 上下文模型：subagent 隔离 vs 主上下文加载

当前换帽 = spawn 独立 subagent（隔离上下文、回报 ≤10 行、防 drift）。Skill 加载进**主上下文**。
harness 的隔离是刻意的（防上下文污染、强制回报纪律）。**Skill 化不应消灭 subagent 链**，二者关系应是：skill 提供知识与流程（什么该做、查什么闸），subagent 提供执行隔离。Claude Code 中 skill 也可被 subagent 继承/引用，二者可叠加而非互斥。

### T3 · 双真值风险（工程纪律）

若 `prompts/`（条文真值）与 `skills/`（标准封装）各自手写维护 → 必然 drift，违背「单源真值」铁律。
**解法候选**：SKILL.md 做成**薄层**（frontmatter + 指向 prompts/ 的相对引用），或**生成物**（从 prompts/ + frontmatter 元数据由脚本生成，CI 校验一致）。绝不允许第三份手写副本。

### T4 · 分发面格式 vs 包现有结构

npm 包今天分发 `harness/prompts/`。标准 skills 需要 `skills/<name>/SKILL.md` 目录结构。问题：包内目录如何摆？消费者如何把 skills 装进各自 client（`.claude/skills/`、Cursor 的 skills 路径、Codex 的路径各不相同）？
**初判**：包出 `skills/` 目录 + 安装说明/安装脚本；各 client 的放置差异写进 `compatibility` 字段与 README，而不是替 client 做决定。

### T5 · 机械化率哲学一致性

库的护城河是「纪律的机械化率」。Skills 是 prompt 层封装，**不提升机械化率**——若包装成「升级」让人误以为纪律变强了，是治理倒退。
**自我约束**：本系列产出必须明确——skills 化提升的是**可达性/分发面/发现率**，纪律强度仍来自 CLI 闸。附带红利：`skills-ref validate` + 自研一致性校验可入 CI，反而给「格式纪律」加了机械闸。

## 2. 候选方向

### A · 知识型 Skill 先行（低风险探针）

把**模板/清单/runbook 类**资产先包成标准 skills：
- 候选：`SPEC_TEMPLATE_v1_zh.md` → `harness-spec-drafting` skill；REVIEW/acceptance checklist → `harness-review-checklist`；wiki 升级 runbook → `harness-upgrade-runbook`
- 特征：只读知识、无执行权、无闸绕过面 → T1 风险为零
- 价值：验证目录结构、description 写法、跨 client 安装路径，积累 dogfood 数据

### B · 帽的 Skill 薄层封装（核心命题）

每帽一个标准 skill 目录，SKILL.md = frontmatter（精心打磨 description，含**何时不用**）+ 薄层正文（必读指向 `prompts/` 条文，保持单源真值）：
```
skills/harness-10-spec/
├── SKILL.md        # frontmatter + 薄层（禁复制条文全文）
└── references/     # 软链/复制自 prompts/ 的条文（生成，非手写）
```
- 覆盖 Starter 5 帽先行；Extended 帽（00/50/handoff）留工作区层
- description 必须写负向触发（如 30：「HG-AUDIT-R1 pending 时**不得**执行改码」）
- `allowed-tools` 仅作提示性声明（实验字段，不作纪律依赖）

### C · 生成器 + CI 校验（机械化挂钩）

从既有真值生成 skills 目录：
- 源：`harness/prompts/*.md` + 新增元数据（每帽的 name/description/触发词，可挂 `discipline-coverage.yaml` 旁）
- 生成：`scripts/build_skills.*` → `skills/`；CI 跑 `skills-ref validate` + 自研「薄层不含条文全文」「references 与源一致」校验
- 与机械化率系列同构：格式纪律 → 机械闸；每个新帽必须先有元数据才能进分发

### D · 远期：Skills 作为 Agent 治理适配层的入口

skills/ 与未来的 `harness mcp`（方向三）并列：skill 管「知道怎么做事」，MCP 管「机器可读的状态与闸」。排序在 A/B/C 之后，契约不稳不上。

## 3. 排序建议

```
A（知识探针） → B（帽薄层） → C（生成器+CI）
                  ↑ 每步都 dogfood：harness 自己的链先用上自己的 skills
D：MCP 契约稳定后启动
```

逻辑与机械化率系列一致：**每一步让下一步更便宜**（A 验证格式 → B 复用格式 → C 把 B 的手工纪律机械化）。

## 4. 反方向纪律（防止治理变负担）

1. **不做第三份真值**——skills 只能是薄层或生成物；CI 校验「SKILL.md ≤500 行」「正文不含条文大段复制」
2. **不用 skill 描述承担闸**——「30 先查 gate」写进 skill 是提醒不是强制；强制仍在 CLI（`verify`/`close`）
3. **不追全 client 适配**——`compatibility` 声明要求即可；client 侧放置写文档，不写进包逻辑
4. **不动 subagent 链**——`.claude/agents/` 薄层与 skills 并存，各自管「隔离执行」与「标准分发」；若未来合并，须先证明回报纪律与隔离性不退化
5. **不立执行帽 skill 的项**，直到 A 的 dogfood 数据证明 T1 负向触发设计有效

## 5. 留给 R2 的问题

- 帽元数据（name/description/触发词）落哪个文件？（新 yaml vs 挂 `discipline-coverage.yaml` vs 嵌 prompts 头部）
- `references/` 用复制还是软链？（npm 包对软链不友好 → 倾向生成时复制 + CI 一致性校验）
- 工作区 `Projects/.claude/skills/` 与包 `skills/` 的关系（消费 vs 分发，谁先 dogfood）
- 执行帽 skill 的负向触发 description 具体措辞与评测方法（如何 dogfood 验证「pending 时不被误激活」）
