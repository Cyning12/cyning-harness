# cyning-harness · 统一更新路线（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **版本** | v1.4 |
| **日期** | 2026-06-15 |
| **性质** | **L2 产品路线真值** · 吸收本体 v1.2 + HGM + P0 后修订 |
| **L1 对齐** | 工作区 [`STRATEGY_MASTER`](./pointers/STRATEGY_MASTER_v1_zh.md) Track A/B/C/D · **冲突时本文件管产品 semver 与能力边界** |

> **2026-06-15 结论**：OOP / 本体 / 图论 / History 融合 **不推翻** v0.2→v1.0 主轨；**Track G（HGM）** 在 **v1.0 关账后** 以 **v2.x** semver 推进（G1→v2.0+ · G2→v2.1+）· **不阻塞** A1 npx 与 Q3 push。  
> **SEM-02**：废止用 **v0.5/v0.6** 标注 HGM（易误读为 v0.4 与 v1.0 之间的主轨版本）。

---

## 1. 思想栈 → 工程映射

| 思想 | 在 Harness 中的落点 | 版本 |
| --- | --- | --- |
| **OOP** | wizard 脚本 · bash/TS 实现 · Task/Hat 作「类」的 runtime 投影 | 现在 |
| **本体** | `product/DESIGN_ONTOLOGY` · P/S/D 公理 · ICVO 四支柱 | v1.2 已文档化 |
| **图论（过程）** | HGM：显式边 · 遍历 · 模式查询 | **v2.0+**（Track G · v1.0 后） |
| **History** | append-only 事件 · gate/task 状态变迁 | **v2.0+**（Track G · v1.0 后） |
| **图论（Inform）** | `docs/_tech_graph/` · `gate-check --graph` | v1.0 |

```text
文件真值（L3 Markdown）  →  命令式实现（OOP/bash）  →  可选图+事件投影（HGM）
         ↑ 始终优先                    ↑ v0.2–v0.4 主投入
```

---

## 2. 版本里程碑（产品 semver）

### 2.0 Semver 命名纪律（SEM-02 · 2026-06-15）

| 轨道 | 版本序列 | 说明 |
| --- | --- | --- |
| **Track A · 主轨** | **v0.2 → v0.3 → v0.4 → v1.0** | `@cyning/harness` npm · A1–A4 · **当前已到 v0.4** |
| **Track G · HGM** | **v2.0+（G1）→ v2.1+（G2）→ …** | **仅 v1.0 关账后** 启动 · 主版本 **2** 表示「公理稳定后的增强线」 |
| **废止** | ~~v0.5 / v0.6~~ 作 HGM 号 | 数字像插在 v0.4 与 v1.0 之间 · 已全部改 **v2.x** |

对外一句：**主轨到 v1.0 · HGM 从 v2.0 起 · 不写「产品 v0.5」指 HGM。**

> **对外表述（semver 纪律）**：主产品按 **§2.0 主轨** 推进。**Track G** 能力标签 **G1 / v2.0+**（见 §2.2），**启动闸门在 v1.0 之后**（§5）；**不是**主轨下一档 semver，也 **不阻塞** public push。对外请写 **「Track G 提案 · v2.x」**，避免 **「即将发布 v0.5」** 或 **「v0.5 在 v1.0 前」**。

### 2.1 主轨（A · 产品包）

| 版本 | 代号 | 须交付（实现） | 文档 / 方法论 |
| --- | --- | --- | --- |
| **v0.2.x** | **P0 闭环** | harness-only · sync plan/apply · gate-check · 金样 10→22→30 | methodology/ 归集 · P0 gap |
| **v0.3.0** | **A1 分发** | manifest · npx init/upgrade/check · S5 git-clean · **✅ 2026-06-15**（Release/npm 留维护者） | FailureReport 模板 · rejected→draft gate-check |
| **v0.3.x** | **A2 Starter** | 40-self-check 帽 · `task.harness.v1.json` · depends_on 禁环 CLI · **✅ 2026-06-15** | ONBOARDING npx 优先 |
| **v0.4.0** | **A3 + push** | ontology.yaml · D7 HG-RELEASE · demo_checkout 脱敏 · MIT public | ETCLOVG 映射页 · README 叙事 |
| **v1.0.0** | **A4 stable** | ICVO audit CLI · invoke_index · gate-check --graph（Inform） | CHANGELOG 冻结 · B2 量化进 README |

### 2.2 Track G（HGM · v1.0 后 · proposal）

| 能力标签 | 代号 | 须交付（实现） | 文档 |
| --- | --- | --- | --- |
| **G1 · v2.0+** | HGM 起步 | `events/*.jsonl` · graph ingest · snapshot · axioms check 子集（**均未实现**） | HGM design v0.1→v0.2 |
| **G2 · v2.1+** | HGM 查询 | timeline · patterns · SQLite 投影 | 可选 Neo4j 导出 |

**刻意不做（至 v1.0）**：GrowingReasoningAgent · OWL 推理机 · 热插拔 Track（Q5）· Neo4j 默认后端 · **Track G ingest（v1.0 前）**。

---

## 3. 并行轨道（与 STRATEGY_MASTER 对照）

| 轨 | STRATEGY 名 | 本路线重点 | 当前 |
| --- | --- | --- | --- |
| **A** | 产品包 | §2 表 · v0.2→v1.0 | **A2 40 绿** · A3 / B next |
| **B** | kimi-code-meta 试点 | oss-fork-meta / kimi-code-meta preset · 上游 PR 证据 · **#8 B2+micro-bench（1+3 主链）** · **#9 Agent-shell（2 并行）** | B0 · 证据方案待审 |
| **C** | Runtime | harness ctx · Worker · **HGM 不替代 C** | 后置 |
| **D** | 对外叙事 | ICVO · §7.5 对比 · 理论文章（见 prompts/） | 待 P0 绿 |
| **G** | **（新增）HGM** | §2 **v2.x** · 依赖 v1.0 公理稳定 | proposal |

---

## 4. 相对 STRATEGY_MASTER v1.2 的变更摘要

| 变更 | 说明 |
| --- | --- |
| **A3 与 P0 关系** | P0 金样已建 `examples/demo_checkout/` · A3 = 脱敏 + 补 40 帽完整链 |
| **methodology/** | L2 文档真值集中 · 不改变 A1–A4 日期 |
| **Track G** | 新增 · 不插入 A1/A2 人力 · **v2.0 启动条件**：v1.0 关账 + 事件 schema 冻结 |
| **ICVO 叙事** | 纳入 D 轨与 v1.0 验收 · 非新 semver |
| **三路合并 / rollback** | 仍 v0.3 设计 · v0.4 实现（本体 §4.3） |

**无需重写的部分**：MIT · Q3–Q4 push · npx P0 · kimi 双分支 · Runtime 后置。

---

## 5. 验收闸门（阶段切换条件）

| 从 → 到 | 闸门 |
| --- | --- |
| v0.2 → v0.3 | P0 金样 ACCEPTANCE ✅ · A1 实现 ✅（Release/npm 可后补） |
| v0.3 → v0.4 | npx upgrade dogfood（kimi-code-meta）· ontology.yaml 草案 |
| v0.4 → v1.0 | public push 审计 · **#8 B2 + SDD-Compliance micro-bench** · ICVO audit 子集绿 |
| v1.0 → v2.0 HGM | 维护者确认事件 schema 冻结 · ingest 不破坏 S2 · G1 立项 |

---

## 6. 工作区任务编排

Epic 与子 task 真值：`Projects/docs/harness/tasks/active/`

| Epic / 子 task | 对应 ROADMAP |
| --- | --- |
| [`TASK_epic_cyning_harness_roadmap_v0_2_to_v1_v1.md`](../../../../docs/harness/tasks/active/TASK_epic_cyning_harness_roadmap_v0_2_to_v1_v1.md) | 全文 |
| #1 P0 golden close | v0.2.x · **done** 2026-06-15 |
| #2 A1 npx | v0.3.0 · **done** 2026-06-15 |
| #3 A2 Starter | v0.3.x · **done 2026-06-15** |
| #4 B kimi dogfood | Track B · **next** |
| #5 D 续篇 | Track D · 篇 1 已 draft |
| #6 A3 public push | v0.4.0 |
| #7 A4 v1.0 | v1.0.0 · 引用 #8 |
| **#8 B2 + bench** | Track B · **1+3 主证据** · P0 绿后优先 |
| **#9 Agent-shell** | Track B · **2 并行** · 核实期 · 不挡 A3 |

**证据策略（2026-06-15 锁定）**：

| 线 | 内容 | 优先级 |
| --- | --- | --- |
| **1+3** | B2 真实试点量化 + SDD-Compliance micro-bench（5 scenario） | **主链** · #8 |
| **2** | Agent-shell（Kimi agent 规则层 SDD） | **并行** · #9 · Epic 不强制 |

审核稿：`methodology/reviews/REVIEW_B3_*` · `REVIEW_B9_*` · Prompt：`prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md`

**审核结论（2026-06-15）**：B8 **4/5** · B9 **3/5** · 均 **APPROVE_WITH_CHANGES** · #8 **P0 绿后主投入** · #9 **≤4h/周** · #8 scenario 冻结后再开 #9

**理论参考**：[`ARTICLE_纪律包工程续篇_篇1`](../../../../ai_coding_governance/narrative/discipline_package_series/ARTICLE_纪律包工程续篇_篇1_从OOP到本体_v1_zh.md)

---

## 7. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 本体+HGM 融合后首版统一路线 · 新增 Track G |
| v1.1 | 2026-06-15 | §2 主轨/Track G 分表 · 对外表述脚注 · 一致性审计落盘 |
| v1.2 | 2026-06-15 | §6 链工作区 Epic 任务 · 篇 1 理论参考 |
| v1.3 | 2026-06-15 | Track B 证据三线 · #8/#9 · 审核稿索引 |
| v1.3.1 | 2026-06-15 | B8/B9 审核结论回写 · S1–S4 · 3×2 · D6 字段 |
| v1.3.2 | 2026-06-15 | P0 金样关账 · v0.2→v0.3 首闸满足 · A1 next |
| v1.3.3 | 2026-06-15 | A1 实现关账 · A2 next · v0.3.0 表标注 |
| v1.4 | 2026-06-15 | **SEM-02**：HGM Track G **v0.5/v0.6 → v2.x** · 增 §2.0 命名纪律 |
