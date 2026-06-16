# Harness 方法论 · 总指引


| 项       | 内容                                                 |
| ------- | -------------------------------------------------- |
| **状态**  | `active`                                           |
| **版本**  | v1.2                                               |
| **日期**  | 2026-06-15                                         |
| **路线真值** | [`ROADMAP_v1_zh.md`](./ROADMAP_v1_zh.md) · 工作区 Epic [`TASK_epic_cyning_harness_roadmap`](../../../../docs/harness/tasks/active/TASK_epic_cyning_harness_roadmap_v0_2_to_v1_v1.md) |
| **范围**  | cyning-harness **产品仓**内方法论文档索引 · 与工作区 / 治理仓分层      |
| **关系图** | `[DOCUMENT_MAP_v1_zh.md](./DOCUMENT_MAP_v1_zh.md)` |


> **阅读顺序（维护者）**：战略 POINTER → 产品设计本体 v1.2 → P0 差距 →（可选）HGM 草案 v0 · [一致性审计 `AUDIT_doc_consistency_2026-06-15_zh.md`](./AUDIT_doc_consistency_2026-06-15_zh.md)  
> **阅读顺序（接入者）**：`[../ONBOARDING.md](../ONBOARDING.md)` → `[execution/P0_V0.2_GAP.md](./execution/P0_V0.2_GAP.md)` → 金样 `[../examples/demo_checkout/](../examples/demo_checkout/)`

---

## 1. 文档分层（四层）

```text
L0  治理 / 行业     ai_coding_governance/methodology/     （私有 · 推广方法论）
L1  工作区战略      Projects/docs/harness/guides/         （STRATEGY_* · 试点 · 分发）
L2  产品方法论      cyning-harness/docs/methodology/      （本目录 · 真值）
L3  运行实例        业务仓 docs/tasks · harness · …       （S2 保护 · 用户数据）
```


| 层      | 回答的问题                          | 真值位置                                              |
| ------ | ------------------------------ | ------------------------------------------------- |
| **L0** | 为什么 Harness · 目标态 · 行业对照       | 治理仓 POINTER → `[pointers/](./pointers/README.md)` |
| **L1** | 何时开源 · 里程碑 · 试点 kimi-code-meta | 工作区 `docs/harness/guides/`                        |
| **L2** | Track/Hat/Sync 如何实现 · 公理 · HGM | **本目录** `product/` · `graph/` · `execution/`      |
| **L3** | 具体 task / review / invoke      | 嵌入后的业务仓                                           |


**冲突时**：L2 产品本体 > L1 战略叙事 > L0 治理泛化（实现细节以 L2 为准）。

---

## 2. 子目录职责


| 目录                                    | 内容                                   | 主文档                                                                                  |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| `[product/](./product/README.md)`     | **产品设计本体** · 类 / 公理 / 状态机            | `[DESIGN_ONTOLOGY_v1_zh.md](./product/DESIGN_ONTOLOGY_v1_zh.md)` v1.2                |
| `[graph/](./graph/README.md)`         | **Harness Graph Model** · 过程实例图 + 事件 | `[HARNESS_GRAPH_MODEL_design_v0_zh.md](./graph/HARNESS_GRAPH_MODEL_design_v0_zh.md)` |
| `[execution/](./execution/README.md)` | **落地差距** · P0 命令 · 验收                | `[P0_V0.2_GAP.md](./execution/P0_V0.2_GAP.md)`                                       |
| `[reviews/](./reviews/)`              | **方案审核稿** · 待外部 Agent 审方向           | `REVIEW_B3_*` · `REVIEW_B9_*`                                                        |
| `[prompts/](./prompts/)`                | 审计 / 写作 / **可行性审核** Invoke          | `PROMPT_feasibility_review_b_evidence_v1_zh.md`                                       |
| `[pointers/](./pointers/README.md)`   | 工作区 / 治理仓 **只读 POINTER**             | 禁止复制全文                                                                               |


---

## 3. 核心概念链（精简）

```text
战略本体 (DisciplinePackage · MIT · push)
    ↓ 约束
产品设计本体 (Track · Hat · Gate · P/S/D 公理 · ICVO)
    ↓ 实现
wizard / harness-sync / gate-check（命令式 · 类 OOP）
    ↓ 可选 v2.0+（Track G · v1.0 后）
Harness Graph Model（显式边 + 事件历史 + 公理查询）
```

**HGM 公式**（见 `[graph/README.md](./graph/README.md)`）：

```text
HGM = 结构化对象 + 显式带类型的边 + 不可变事件历史 + 可推理的公理
```

---

## 4. 与工作区 Harness V2 的关系


| 工作区文档                                                       | 关系                                   |
| ----------------------------------------------------------- | ------------------------------------ |
| `[HARNESS_V2_PLAN.md](./pointers/HARNESS_V2_PLAN_v1_zh.md)` | Ink 工作区 Harness 规划 · task 字段 · CI 批次 |
| `[SDD_HAT_FLOW.md](./pointers/SDD_HAT_FLOW_v1_zh.md)`       | 历史帽编号 · Starter 以产品仓 prompts 为准      |
| 工作区 `docs/harness/prompts/`                                 | **Extended** 全量帽 · 不默认复制进产品包         |


产品包 **Starter** 闭包：`harness/prompts/` 10 · 22 · 30（+ A2 待 40）。

---

## 5. 后续优化全景

§5 不是「仅 5 条文档待办」，而是 **文档轨（O）** 摘要；**产品 / 试点 / HGM** 见 [`ROADMAP_v1_zh.md`](./ROADMAP_v1_zh.md)。

### 5.1 文档轨（O 系列）

| # | 项 | 目标版本 |
| --- | --- | --- |
| O1 | `ontology.yaml` 从本体抽取 | v0.4 |
| O2 | 本总指引与 STRATEGY_MASTER 日历双向链 | v0.3 |
| O3 | HGM `events/*.jsonl` 原型（**proposal · 未实现**） | Track G · **v2.0+** |
| O4 | 对外博客 · ICVO 四支柱 · §7.5 展开 | Q3 push 前 |
| O5 | 治理仓 L0 单页摘要（不重复 L2） | 可选 |
| O6 | `DOCUMENT_MAP` 随 semver 自动校验脚本 | v1.0 |
| O7 | 写作 Prompt 系列沉淀（[`prompts/`](./prompts/)） | 持续 |

### 5.2 产品实现轨（P 系列 · 摘要）

| # | 项 | 版本 | 真值 |
| --- | --- | --- | --- |
| P0 | 金样 10→22→30 闭环 | v0.2 | [`execution/P0_V0.2_GAP.md`](./execution/P0_V0.2_GAP.md) |
| P1 | npx · manifest · S5（**v0.3 · 未实现**） | v0.3 | 本体 §7.4 · ROADMAP §2 |
| P2 | 40 帽 · task schema · FailureReport | v0.3.x | 本体 §7.2 |
| P3 | ontology.yaml · D7 · public push | v0.4 | ROADMAP A3.5 |
| P4 | ICVO audit · invoke_index · Inform graph | v1.0 | 本体 §5.4 |
| P5 | 三路合并 · rollback | v0.4 | 本体 §4.3 · S6 |

### 5.3 知识建模轨（K 系列 · HGM）

| # | 项 | 版本 |
| --- | --- | --- |
| K1 | 事件 schema + ingest（**proposal · 未实现**） | Track G · G1 / **v2.0+** |
| K2 | snapshot + axioms check（**proposal**） | **v2.0–v2.1** |
| K3 | timeline / patterns（**proposal**） | **v2.1–v2.2** |
| K4 | 与 Runtime/C 轨推理衔接 | v1.0+ · **未立项** |

> **Track G 用语**：**G1 / v2.0+** 为能力标签，**启动闸门在 v1.0 之后**（见 [`ROADMAP_v1_zh.md`](./ROADMAP_v1_zh.md) §2.0 · §2.2 · §5）· **非**主轨下一档 semver（**废止 v0.5/v0.6 指 HGM**）。

### 5.4 试点与叙事轨（B/D · 摘要）

| 轨 | 项 | 指针 |
| --- | --- | --- |
| B | kimi-code-meta · **#8 B2+micro-bench（1+3）** · **#9 Agent-shell（2 并行）** | [`reviews/REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md`](./reviews/REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md) · [`REVIEW_B9_agent_shell_parallel_v1_zh.md`](./reviews/REVIEW_B9_agent_shell_parallel_v1_zh.md) |
| D | MIT push · ETCLOVG · 求职向 preset | STRATEGY_ONTOLOGY §5 |

**原则**：v0.2–v0.4 **不扩 K 轨人力**；HGM 在 v1.0 公理稳定后再动 ingest（ROADMAP §5 闸门）。

---

## 6. 修订记录


| 版本   | 日期         | 说明                                          |
| ---- | ---------- | ------------------------------------------- |
| v1.0 | 2026-06-15 | 初版总指引 · 归集 product/graph/execution/pointers |
| v1.1 | 2026-06-15 | §5 扩为 O/P/K/B/D 全景 · ROADMAP · 写作 Prompt |
| v1.1.1 | 2026-06-15 | K/O 轨 proposal 标注 · Track G 脚注 · 链审计报告 |
| v1.2 | 2026-06-15 | Track B 证据 #8/#9 · reviews/ · 可行性审核 Prompt |
| v1.3 | 2026-06-15 | **SEM-02**：Track G **v2.x** · 对齐 ROADMAP v1.4 |
