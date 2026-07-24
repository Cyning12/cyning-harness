---
name: rethink-mechanization-rate-01-big-directions
description: 大方向判断 · 机械化率框架的提出与四个改进方向排序 · 何时读：理解本系列的顶层逻辑
---

# 01 · 大方向：从「事故驱动补闸」到「机械化率驱动改进」

> **简介**：本文是 2026-07-24 战略讨论的落盘版。核心命题：cyning-harness 的护城河是**纪律的机械化率**——明文纪律有多少被代码强制，而不是靠 Agent 自觉。当前它在被动挨打：每个缺口都要等一次线上事故来揭示。

## 1. 核心判断

v2.2 的故事（invoke 留档连续 4 任务失守 → `task close` 补闸）的本质：

1. 纪律是**声明**出来的（`harness/prompts/*.md` 的自然语言），enforce 是**个案**补出来的；
2. invoke 绝不是唯一一条纯 Prompt 层纪律——reviews 留档、思考轮槽位、task 结构完整性、git 行为纪律……都没有覆盖矩阵；
3. 缺口的发现机制是**用户追问**（2026-07-20「为何 invokes/by-task 无留档」），这是系统最差劲的传感器。

**推论**：改进的第一优先级不是任何单点功能，而是让缺口**系统性地自己浮出来**。

## 2. 四个方向

### 方向一 · 机械化率审计（本系列 02–04）

盘点规范语句 × 强制状态，产出覆盖矩阵。每个 prompt-only 缺口自动成为候选 task。
**定位：改进路线的生成器。** 成本极低，产出即路线图。

### 方向二 · 生命周期状态机（架构脊柱）

CLI 今天是一袋动词，背后实际是**一个** task 生命周期：`draft → R1 → approved → 30 → 40 → done → archived`。`verify` 是 30 转移的前置检查，`close` 是 done→archived 转移——状态机是隐式的。
显式化后（如 `lifecycle.yaml`：状态/转移/前置条件），方向一产出的每个新闸都有**天然挂点**；「这个 task 现在能做什么」一条命令可答（`verify --json` 的 handoff 是胚胎）。
**落地（v2.7.0 · 文档先行）**：产品包真值 [`harness/lifecycle.yaml`](../../../harness/lifecycle.yaml) + `npx @cyning/harness lifecycle show [--json]`（只读 · **不做**转移引擎）；`verify --task` 已挂 `task_lint`（severity=warn）。
**原则**：闸只挡实质、宽容形式（slug 事件教训：现实有两种命名惯例，闸太死就误伤）。

### 方向三 · Agent 一等公民接口（分发放大器）

库的真实用户越来越是 Agent。`--json` / `VERIFY: PASS` / `CLOSE: PASS` 已出现但各命令各搞各的。
统一机器契约（ok/blockers/gates/next_action 同 schema + exit code 语义一致），成熟后包 `harness mcp` —— 是远期「Agent 治理适配器层」的最小可行版。
**排序约束**：契约不稳时上 MCP = 把内部混乱固化成 API，故排在一、二之后。

### 方向四 · HGM 消费者（按需拉动，暂缓）

G1（events/snapshot/axioms）与 invoke_index 犯同一种病：**基础设施先行，消费者缺席**。G2（timeline/patterns/SQLite）只在有具体待答问题时启动——而方向一会替你把问题问出来（「哪些 task 跳过 40？」「draft 滞留多久？」）。

## 3. 排序与逻辑

```
方向一（审计） → 方向二（状态机） → 方向三（Agent 契约/MCP）
   产出生成器        让补闸变便宜         语义稳定后放大
方向四 G2：被方向一的问题拉动后再启动
```

每一步让下一步更便宜，且全程可 dogfood——是库自身哲学（文件真值 → 机械执行 → 可选投影）的自洽延伸。

## 4. 反方向纪律（同等重要）

库最大的风险不是缺功能，而是**治理变成负担**——闸多到 Agent 绕过它。每个新闸须过三问（task-close 式检验）：

1. **挂点对吗**？（检查时刻必须晚于产物存在时刻——verify 查 invoke 永远 fail 的教训）
2. **误报率可控吗**？（slug 教训：宽容形式差异，只挡实质）
3. **有泄压阀吗**？（`--allow-unchecked` 模式：可豁免、须留痕）

## 5. 与库自述路线的关系

- 不与 `ROADMAP_TO_AGENT_GOVERNANCE`（proposal）冲突：方向三是其阶段 1 的廉价前置；
- 不与 `methodology/ROADMAP_v1_zh.md`（L2 真值）冲突：G2 本就在 v2.x 序列内，本文只主张「消费者先行」；
- 方向一/二是对主轨的**质量投资**，不改变 semver 轨道划分。
