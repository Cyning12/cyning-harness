# 「Harness」一词三义 · 消歧叙事（v1）

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **来源** | awesome-harness-engineering · Bench My Harness (BMH) · cyning-harness |
| **用途** | 对外/对内统一用语；避免把 Runtime、测评平台、纪律包混为一谈 |

## 1. 对外一句话（推荐）

**cyning-harness = 可嵌入业务仓的 ICVO 纪律与帽链真值包（无 Agent Runtime、无内置 LLM）；不是工具榜，也不是 Codex/Claude 跑分器。**

产业地图见 [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)；Agent 外壳受控对比见 [Bench My Harness](https://github.com/vinilana/bench-my-harness)。

## 2. 一词三义表

| 指称 | 代表仓 / 形态 | 「Harness」指什么 | 核心问题 | 是否含 LLM Runtime |
|------|---------------|-------------------|----------|-------------------|
| **A · 问题域 / 产业地图** | awesome-harness-engineering | 环绕 Agent 的脚手架：context、tools、plan、verify、memory、sandbox… | 选型与最佳实践导航 | 否（策展收录 Runtime，自身不交付） |
| **B · 可执行 coding agent 外壳** | BMH 所测对象（Codex / Claude Code…） | 驱动模型完成改码任务的进程、hooks、transcript | 「换 skill/模型/workflow 是否可测量地更好？」 | **是**（外部工具调用模型） |
| **C · 纪律嵌入包** | **cyning-harness（本仓）** | Track / Hat / Gate / Artifact · ICVO · sync 不覆盖 S2 | 「过程是否可同步、可审计、可验收？」 | **否** |

## 3. 关系（非替代）

```text
A（地图） ──语料/对照──► C（纪律包）
B（BMH 测 agent） ──方法论──► C 的「测评规划」
B ──间接──► 「已嵌入 C 的业务仓 × IDE agent」trial
           （测的是 agent+纪律上下文，不是 @cyning/harness 二进制）
```

## 4. 禁止说法

| 禁止 | 原因 |
|------|------|
| 「cyning-harness 是另一个 Cursor/Claude」 | C ≠ B |
| 「装完 awesome 列表 = 有了 Harness」 | A ≠ C |
| 「用 BMH 直接测 harness CLI 通过率」 | BMH 不理解 Hat/Gate；对象错位 |
| 「Harness = LangGraph」 | Runtime 在 A 的 Orchestration 节，不在 C 产品范围 |

## 5. 本仓锚点

- 产品定位：[`docs/ARCHITECTURE.md`](../../ARCHITECTURE.md)
- 本体：[`product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md)
- 帽链：[`product/SDD_HAT_FLOW_v2_zh.md`](../product/SDD_HAT_FLOW_v2_zh.md)

## 6. 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · AHE+BMH 对照首版 |
