---
name: rethink-skills-upgrade-readme
description: 索引与背景 · 2026-08 cyning-harness × Agent Skills 升级思考系列 · 何时读：想了解本系列全貌/回溯思考过程
---

# Skills 升级 · 思考系列索引（2026-08）

> **简介**：本目录记录 cyning-harness「如何对接 Agent Skills 开放标准（agentskills.io）」的战略思考 —— 从帽体系与 Skill 格式的同构性出发，盘点现状映射、剖析关键张力、产出候选升级方向。**性质：思考留档（rethink），非 SPEC、非 task**；后续若立项，按 10-spec → 00 起草 task 链走正式流程。

## 背景（30 秒版）

- 2026-08-03：通读 [agentskills.io](https://agentskills.io/home) 规范（SKILL.md 格式 + progressive disclosure + 跨 client 生态）
- 直接动因：harness 的「帽条文 + 薄层指向 + 按需展开」与 Skill 标准**高度同构**；而 `.claude/agents/harness-*.md` 薄层是 Claude Code 专属手工版，包消费者（Cursor/Codex/Copilot/Gemini…）吃不到
- 上位脉络：[[2026-07 机械化率系列](../2026-07-mechanization-rate/README.md)] 方向三「Agent 一等公民接口（分发放大器）」——Skills 是其格式层的自然候选

## 文档地图

| 文档 | 内容 | 读它当你想… |
|---|---|---|
| [01_current_state_mapping.md](01_current_state_mapping.md) | 现状盘点：帽体系五要素 × Skill 标准五要素逐条映射；已是/不是 Skill 的边界 | 理解「我们离标准有多远」 |
| [02_tensions_and_directions.md](02_tensions_and_directions.md) | 五个关键张力 + 候选方向 A/B/C/D + 反方向纪律 | 评审升级路线 |
| [03_format_design.md](03_format_design.md) | R2 上：四个落点决策（元数据嵌头部 / references 复制 / 包内生成物入库 / skills build\|check）+ SKILL.md 草案 | 看具体格式长什么样 |
| [04_dogfood_evaluation.md](04_dogfood_evaluation.md) | R2 下：T1 对抗评测 S1–S3 + 30 帽负向触发 description 草案 + dogfood 三阶段 + 反方向自检 | 评审「不削弱闸纪律」的证据链 |
| [05_conclusion_proposal.md](05_conclusion_proposal.md) | R3：GO 结论（A+B+C 合一）+ 五问决策 + SPEC 形态草案 + 落地链预览 | 决定是否立项、起草 10-spec 前 |

## 过程记录（回溯用）

| 日期 | 动作 | 产出 |
|---|---|---|
| 2026-08-03 | 读 agentskills.io/home + /specification 全文 | 会话记录 |
| 2026-08-03 | 盘点 `.claude/agents/`（工作区 6 薄层）+ `harness/prompts/`（包 Starter 9 文件）+ `Projects/docs/harness/prompts/`（Extended 帽）；映射 Skill 标准 | 01 |
| 2026-08-03 | 张力分析 + 候选方向 | 02 |
| 2026-08-03 | R2：实测 Starter 条文行数（27–78，全 <500）→ 修正「薄层拆分」前提；四落点决策 + SKILL.md 草案 | 03 |
| 2026-08-03 | R2：T1 评测设计（S1–S3 判死线）+ dogfood 三阶段 + 反方向自检全过 | 04 |
| 2026-08-04 | R3：GO 结论（A+B+C 合一 SPEC · v2.x minor · sync 不动 · Extended 帽不做 · eval/ 半自动）+ SPEC 形态草案 | 05 |
| 2026-08-06 | **立项落地**：维护者「同意，立项」→ 10-spec（SPEC signed 当日）→ task R1 通过 → HG-AUDIT-R1 approved → 30 实施 D1–D6（分支 `task/agent-skills-packaging`） | [`../../spec/SPEC-agent-skills-packaging_v1.md`](../../spec/SPEC-agent-skills-packaging_v1.md) · [`../../tasks/active/task_cyning_harness_agent_skills_packaging_v1.md`](../../tasks/active/task_cyning_harness_agent_skills_packaging_v1.md) |
| 2026-08-06 | **dogfood D1 装机**：工作区 `Projects/.claude/skills/` 装入 `harness-10-task` / `harness-10-spec`（自本包 `skills/` 复制）· 触发观察待后续会话数据 | 观察行待补 |
| 2026-08-06 | **T1 评测执行并收口**：S1/S2 PASS（激活后纪律完整）· S3 盲靶 FAIL（未激活裸奔 · 对照组证实基座既有行为）→ **判死执行**：30/40 永不进默认分发 · D3 结果回写 04 | [`../../harness/reviews/eval_t1_gate_bypass_20260806.md`](../../harness/reviews/eval_t1_gate_bypass_20260806.md) |

**范围声明**：本轮覆盖 **npm 包分发面**（`harness/`）与 **工作区消费面**（`Projects/.claude/`、`Projects/docs/harness/`）两层。Ink 业务子仓（30/40/50 落地侧）不在本轮，方法可复用。

**关键外部事实**（2026-08 时点）：Agent Skills 标准为 Anthropic 发起的开放规范，已被 Claude Code、Cursor、GitHub Copilot、OpenAI Codex、Gemini CLI、OpenCode、Goose、VS Code 等 40+ client 支持；`allowed-tools` 字段为实验性；官方校验器 `skills-ref validate`。
