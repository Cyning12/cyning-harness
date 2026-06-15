# cyning-harness · 统一更新路线（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **版本** | v1.1 |
| **日期** | 2026-06-15 |
| **性质** | **L2 产品路线真值** · 吸收本体 v1.2 + HGM + P0 后修订 |
| **L1 对齐** | 工作区 [`STRATEGY_MASTER`](./pointers/STRATEGY_MASTER_v1_zh.md) Track A/B/C/D · **冲突时本文件管产品 semver 与能力边界** |

> **2026-06-15 结论**：OOP / 本体 / 图论 / History 融合 **不推翻** v0.2→v1.0 主轨；新增 **Track G（HGM）** 为 v0.5+ 可选增强 · **不阻塞** A1 npx 与 Q3 push。

---

## 1. 思想栈 → 工程映射

| 思想 | 在 Harness 中的落点 | 版本 |
| --- | --- | --- |
| **OOP** | wizard 脚本 · bash/TS 实现 · Task/Hat 作「类」的 runtime 投影 | 现在 |
| **本体** | `product/DESIGN_ONTOLOGY` · P/S/D 公理 · ICVO 四支柱 | v1.2 已文档化 |
| **图论（过程）** | HGM：显式边 · 遍历 · 模式查询 | **v0.5+** |
| **History** | append-only 事件 · gate/task 状态变迁 | **v0.5+** |
| **图论（Inform）** | `docs/_tech_graph/` · `gate-check --graph` | v1.0 |

```text
文件真值（L3 Markdown）  →  命令式实现（OOP/bash）  →  可选图+事件投影（HGM）
         ↑ 始终优先                    ↑ v0.2–v0.4 主投入
```

---

## 2. 版本里程碑（产品 semver）

> **对外表述（semver 纪律）**：主产品版本按 **v0.2 → v0.3 → v0.4 → v1.0** 推进。**Track G** 能力标签为 **G1 / v0.5+**（见下表），**启动闸门在 v1.0 之后**（§5）；**不是** semver 时间序上早于 v1.0 的产品版，也 **不阻塞** Q3 public push。对外请写 **「Track G 提案」**，避免单独宣传「即将发布产品 v0.5」。

### 2.1 主轨（A · 产品包）

| 版本 | 代号 | 须交付（实现） | 文档 / 方法论 |
| --- | --- | --- | --- |
| **v0.2.x** | **P0 闭环** | harness-only · sync plan/apply · gate-check · 金样 10→22→30 | methodology/ 归集 · P0 gap |
| **v0.3.0** | **A1 分发** | manifest · npx init/upgrade/check（**proposal → 实现**）· S5 git-clean | FailureReport 模板 · rejected→draft gate-check |
| **v0.3.x** | **A2 Starter** | 40-self-check 帽 · `task.harness.v1.json` · depends_on 禁环 CLI | ONBOARDING npx 优先 |
| **v0.4.0** | **A3 + push** | ontology.yaml · D7 HG-RELEASE · demo_checkout 脱敏 · MIT public | ETCLOVG 映射页 · README 叙事 |
| **v1.0.0** | **A4 stable** | ICVO audit CLI · invoke_index · gate-check --graph（Inform） | CHANGELOG 冻结 · B2 量化进 README |

### 2.2 Track G（HGM · v1.0 后 · proposal）

| 能力标签 | 代号 | 须交付（实现） | 文档 |
| --- | --- | --- | --- |
| **G1 · v0.5+** | HGM 起步 | `events/*.jsonl` · graph ingest · snapshot · axioms check 子集（**均未实现**） | HGM design v0.1→v0.2 |
| **G2 · v0.6+** | HGM 查询 | timeline · patterns · SQLite 投影 | 可选 Neo4j 导出 |

**刻意不做（至 v1.0）**：GrowingReasoningAgent · OWL 推理机 · 热插拔 Track（Q5）· Neo4j 默认后端 · **Track G ingest（v1.0 前）**。

---

## 3. 并行轨道（与 STRATEGY_MASTER 对照）

| 轨 | STRATEGY 名 | 本路线重点 | 当前 |
| --- | --- | --- | --- |
| **A** | 产品包 | §2 表 · v0.2→v1.0 | P0 进行中 |
| **B** | kimi-code-meta 试点 | oss-fork-meta / kimi-code-meta preset · 上游 PR 证据 | B0 |
| **C** | Runtime | harness ctx · Worker · **HGM 不替代 C** | 后置 |
| **D** | 对外叙事 | ICVO · §7.5 对比 · 理论文章（见 prompts/） | 待 P0 绿 |
| **G** | **（新增）HGM** | §2 v0.5+ · 依赖 v1.0 公理稳定 | proposal |

---

## 4. 相对 STRATEGY_MASTER v1.2 的变更摘要

| 变更 | 说明 |
| --- | --- |
| **A3 与 P0 关系** | P0 金样已建 `examples/demo_checkout/` · A3 = 脱敏 + 补 40 帽完整链 |
| **methodology/** | L2 文档真值集中 · 不改变 A1–A4 日期 |
| **Track G** | 新增 · 不插入 A1/A2 人力 · v0.5 启动条件：v0.4 push 完成 + P0/A2 绿 |
| **ICVO 叙事** | 纳入 D 轨与 v1.0 验收 · 非新 semver |
| **三路合并 / rollback** | 仍 v0.3 设计 · v0.4 实现（本体 §4.3） |

**无需重写的部分**：MIT · Q3–Q4 push · npx P0 · kimi 双分支 · Runtime 后置。

---

## 5. 验收闸门（阶段切换条件）

| 从 → 到 | 闸门 |
| --- | --- |
| v0.2 → v0.3 | P0 金样 ACCEPTANCE 通过 · A1 三条验收可勾选 |
| v0.3 → v0.4 | npx upgrade dogfood（kimi-code-meta）· ontology.yaml 草案 |
| v0.4 → v1.0 | public push 审计 · B2 量化 · ICVO audit 子集绿 |
| v1.0 → v0.5 HGM | 维护者确认事件 schema 冻结 · ingest 不破坏 S2 |

---

## 6. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 本体+HGM 融合后首版统一路线 · 新增 Track G |
| v1.1 | 2026-06-15 | §2 主轨/Track G 分表 · 对外表述脚注 · 一致性审计落盘 |
