# Harness 方法论 · 总指引

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **范围** | cyning-harness **产品仓**内方法论文档索引 · 与工作区 / 治理仓分层 |
| **关系图** | [`DOCUMENT_MAP_v1_zh.md`](./DOCUMENT_MAP_v1_zh.md) |

> **阅读顺序（维护者）**：战略 POINTER → 产品设计本体 v1.2 → P0 差距 →（可选）HGM 草案 v0  
> **阅读顺序（接入者）**：[`../ONBOARDING.md`](../ONBOARDING.md) → [`execution/P0_V0.2_GAP.md`](./execution/P0_V0.2_GAP.md) → 金样 [`../examples/demo_checkout/`](../examples/demo_checkout/)

---

## 1. 文档分层（四层）

```text
L0  治理 / 行业     ai_coding_governance/methodology/     （私有 · 推广方法论）
L1  工作区战略      Projects/docs/harness/guides/         （STRATEGY_* · 试点 · 分发）
L2  产品方法论      cyning-harness/docs/methodology/      （本目录 · 真值）
L3  运行实例        业务仓 docs/tasks · harness · …       （S2 保护 · 用户数据）
```

| 层 | 回答的问题 | 真值位置 |
| --- | --- | --- |
| **L0** | 为什么 Harness · 目标态 · 行业对照 | 治理仓 POINTER → [`pointers/`](./pointers/README.md) |
| **L1** | 何时开源 · 里程碑 · 试点 kimi-code-meta | 工作区 `docs/harness/guides/` |
| **L2** | Track/Hat/Sync 如何实现 · 公理 · HGM | **本目录** `product/` · `graph/` · `execution/` |
| **L3** | 具体 task / review / invoke | 嵌入后的业务仓 |

**冲突时**：L2 产品本体 > L1 战略叙事 > L0 治理泛化（实现细节以 L2 为准）。

---

## 2. 子目录职责

| 目录 | 内容 | 主文档 |
| --- | --- | --- |
| [`product/`](./product/README.md) | **产品设计本体** · 类 / 公理 / 状态机 | [`DESIGN_ONTOLOGY_v1_zh.md`](./product/DESIGN_ONTOLOGY_v1_zh.md) v1.2 |
| [`graph/`](./graph/README.md) | **Harness Graph Model** · 过程实例图 + 事件 | [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./graph/HARNESS_GRAPH_MODEL_design_v0_zh.md) |
| [`execution/`](./execution/README.md) | **落地差距** · P0 命令 · 验收 | [`P0_V0.2_GAP.md`](./execution/P0_V0.2_GAP.md) |
| [`pointers/`](./pointers/README.md) | 工作区 / 治理仓 **只读 POINTER** | 禁止复制全文 |

---

## 3. 核心概念链（精简）

```text
战略本体 (DisciplinePackage · MIT · push)
    ↓ 约束
产品设计本体 (Track · Hat · Gate · P/S/D 公理 · ICVO)
    ↓ 实现
wizard / harness-sync / gate-check（命令式 · 类 OOP）
    ↓ 可选 v0.5+
Harness Graph Model（显式边 + 事件历史 + 公理查询）
```

**HGM 公式**（见 [`graph/README.md`](./graph/README.md)）：

```text
HGM = 结构化对象 + 显式带类型的边 + 不可变事件历史 + 可推理的公理
```

---

## 4. 与工作区 Harness V2 的关系

| 工作区文档 | 关系 |
| --- | --- |
| [`HARNESS_V2_PLAN.md`](./pointers/HARNESS_V2_PLAN_v1_zh.md) | Ink 工作区 Harness 规划 · task 字段 · CI 批次 |
| [`SDD_HAT_FLOW.md`](./pointers/SDD_HAT_FLOW_v1_zh.md) | 历史帽编号 · Starter 以产品仓 prompts 为准 |
| 工作区 `docs/harness/prompts/` | **Extended** 全量帽 · 不默认复制进产品包 |

产品包 **Starter** 闭包：`harness/prompts/` 10 · 22 · 30（+ A2 待 40）。

---

## 5. 后续优化（待办）

| # | 项 | 目标版本 |
| --- | --- | --- |
| O1 | `ontology.yaml` 从本体抽取 | v0.4 |
| O2 | 本总指引与 STRATEGY_MASTER 日历双向链 | v0.3 |
| O3 | HGM `events/*.jsonl` 原型 | v0.5 |
| O4 | 对外博客摘 §7.5 + ICVO 四支柱 | Q3 push 前 |
| O5 | 治理仓 L0 方法论单页摘要（不重复 L2） | 可选 |

---

## 6. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 初版总指引 · 归集 product/graph/execution/pointers |
