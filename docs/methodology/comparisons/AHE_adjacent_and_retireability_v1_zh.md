# AHE 近形态条目与组件退役（v1）

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **来源** | awesome-harness-engineering Reference / Demo / Meta · `templates/HARNESS_CHECKLIST.md` 退役表 |
| **本方** | ICVO · 帽链 · S2 |

## 1. 对外差异化（相对近形态）

| 近邻类型（AHE 中） | 代表方向 | cyning-harness 差异 |
|--------------------|----------|---------------------|
| 仓内 AGENTS/HARNESS 工件实验仓 | harness-engineering / harness-experimental / agentic-stack | **可 npm 嵌入 + sync/upgrade + 机械闸**（verify/close），非仅文档实验 |
| 多角色薄编排 | Squad / Symphony / Harmonist | **帽次+人工闸表+reviews 留档**；Git 仅 Lead；无内置多 Agent Runtime |
| 跨 IDE 配置层 | everything-claude-code / Omnigent | **POINTER 薄入口**；真值在 prompts/task，不堆全局技能包 |
| 完整 coding agent | OpenHands / OpenCode | **明确不提供**；互补，用户自备 Cursor/Claude |
| Meta-Harness（自动进化脚手架） | auto-harness / Live-SWE 类 | **可审计静态纪律**优先；不默认自学改帽文 |

**一句话**：近邻多在「帮 agent 跑起来」；cyning 在「让过程与验收成为仓库真值且可同步」。

## 2. 组件退役表（建议引入人读清单）

> 原则（AHE）：组件因模型尚不能独自完成而存在；模型变强后应可退役。

| 组件（cyning） | 存在因为 | 可考虑减弱/拆除当 |
|----------------|----------|-------------------|
| `HG-AUDIT-R1` 硬闸 | 模型易伪造 approved / 跳过审查 | 审查文存在性+结论可机械证明且误报率可接受 |
| pre-30 invoke 硬闸 | 「开工」口语 ≠ 规格/task 闭环 | 端到端规格满足度可自动证明 |
| `wiki_delta` close 闸 | 经验不晋升、读序漂移 | Wiki/图谱自动一致且可测 |
| overlay local 块纪律 | sync 会冲产品面定制 | 三方合并/定制面分离已产品化且零冲突 |
| `task lint` 结构闸 | 任务单缺失败路径/元信息 | IDE/模板强制生成且不可跳过 |
| FRAGMENT GATE_VERIFY 首输出 | 模型跳过闸扫描直接改码 | verify JSON 被 IDE 强制消费为开工条件 |
| KPI / experience 关账字段 | 关账无回馈 | 组织另有强制复盘系统且挂钩合并 |

**纪律**：退役须改本体/USER_GUIDE/CHANGELOG；禁止静默删闸。

## 3. 与 ICVO 对齐

| 支柱 | 退役时勿伤 |
|------|------------|
| Inform | 图谱/wiki/task 真值可读 |
| Constrain | 仍有等价约束（规则或 CI） |
| Verify | 仍有可失败自动验收 |
| Orchestrate | 帽链/编排可简化，不可无过程留痕 |

## 4. 后续实现（签闸后）

- [ ] 将上表落入 `docs/CHECKLIST_*` 或 ICVO 审计附录（G-M2-03）
- [ ] ONBOARDING / USER_GUIDE 链消歧句（M1）

## 5. 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · M6 |
