# 一致性审计报告 · 2026-06-15

| 项 | 内容 |
| --- | --- |
| **状态** | `closed` · 后续任务已落盘 |
| **触发** | [`prompts/PROMPT_doc_consistency_audit_v1_zh.md`](./prompts/PROMPT_doc_consistency_audit_v1_zh.md) |
| **真值层** | L2 `docs/methodology/` |

---

## 摘要（≤150 字）

L2 真值链大体自洽，但存在 semver（v0.5 HGM 晚于 v1.0 闸门）、HGM design §5 与 ROADMAP 对 `gate-check --graph` 版本分歧、公众 ICV 三支柱 vs 产品 ICVO 四支柱缺桥接、STRATEGY A0「已完成」与 P0 未闭合等漂移。**2026-06-15 已全部落盘修复**（见 §6）。

---

## 问题清单（按严重程度）

| 级别 | ID | 问题 | 影响读者 | 建议改法 | 涉及文件 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | SEM-01 | v0.5.x 在 semver 表位于 v1.0 后，数字易误读 | 以为 HGM 是 v1.0 前产品版 | Track G 子表 + 对外脚注 | `ROADMAP_v1_zh.md` 等 | ✅ |
| P0 | ICV-01 | 公众 ICV 三支柱 vs 产品 ICVO 四支柱 | 续篇自相矛盾 | ICVO 升级说明 + 地图 v1.0.3 脚注 | 本体 · README · 公众稿 | ✅ |
| P0 | IMPL-01 | A0「已完成」vs P0 进行中 | 过度承诺 v0.2 | 拆 A0a/A0b | `STRATEGY_MASTER` | ✅ |
| P0 | IMPL-02 | HGM/jsonl/npx 未标 proposal | 以为已实现 | 统一 `proposal · 未实现` | HGM · README §5.3 | ✅ |
| P1 | MIX-01 | HGM §5 写 gate-check --graph @ v0.4 | 与 ROADMAP v1.0 冲突 | 校正为 v1.0 Inform | `HARNESS_GRAPH_MODEL_design_v0_zh.md` | ✅ |
| P1 | MAP-01 | DOCUMENT_MAP §4 README v1.0 滞后 | 锚点误报 | 更新 §4 | `DOCUMENT_MAP_v1_zh.md` | ✅ |
| P1 | MAP-02 | README §6 缺 v1.1 修订行 | 版本不一致 | 补修订记录 | `methodology/README.md` | ✅ |
| P1 | MIX-02 | Harness Engineering vs 纪律包 | 误解为 Runtime | STRATEGY §1.1 澄清 | `STRATEGY_MASTER` | ✅ |
| P1 | STRAT-01 | §4 无 Track G / ICVO D 轨 | L1 读者漏 G 轨 | 增 §4.9 | `STRATEGY_MASTER` | ✅ |
| P2 | VER-01 | invoke_index v0.4+ vs v1.0 | 排期歧义 | 统一 v1.0 | `DESIGN_ONTOLOGY` §6 | ✅ |
| P2 | PILOT-01 | 试点 vs P0 ACCEPTANCE 边界 | 对外泛化 | PILOT 边界句 | `PILOT_kimi_code_fork` | ✅ |

---

## ICVO 升级说明草稿（给续篇用）

连载 **方法论地图（v1.0.2+）** 中的 **ICV 三支柱**（Inform · Constrain · Verify）归属 **SDD 上层方法论**；**Harness 协作流程** 落实 **过程轨**，**不是** 与 ICV 平级的第四方法论支柱——**不变**。

在 **cyning-harness 产品本体（v1.2）** 中，卷三已实践的 **帽链、Handoff（00）、Epic 编排、invoke/review 落盘** 显式命名为第四产品支柱 **Orchestrate（编排）**，记作 **ICVO**——**产品轨映射升格**，不替代 Verify，不推翻 SDD 或公众 ICV。

**卷三/卷四对照**：§13 阶段流、§14 半自动 → Orchestrate；卷四 Epic → EpicTask；00 Handoff → OrchestratorHat（Extended）。

**方法论地图 v1.0.3**：已增 §3 脚注（不改正文结构）。

---

## semver / Track G 对外统一用语建议

> cyning-harness 产品主版本按 **v0.2 → v0.3（npx）→ v0.4（public push）→ v1.0（stable）** 推进。**Track G（Harness Graph Model）** 是 **v1.0 公理稳定后的可选增强**，能力标签 **G1 / v0.5+**，**不是** 早于 v1.0 的产品版，也 **不阻塞** Q3 开源。对外请写 **「Track G 提案」** 或 **「G1：事件+jsonl ingest（proposal · 未实现）」**。

---

## 6. 已执行后续任务

- [x] 更新 DOCUMENT_MAP §4 版本锚点
- [x] ROADMAP 增「对外表述」脚注 + Track G 子表
- [x] 方法论地图 v1.0.3 勘误（ICVO 脚注 · 不改正文结构）
- [x] DESIGN_ONTOLOGY product/README 链到续篇 / ICVO 对照
- [x] HGM design §5 / 依赖行校正
- [x] STRATEGY_MASTER A0 · §1.1 · §4.9
- [x] PILOT 与 P0 边界句

---

## 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-06-15 | 初版审计 · 同日落盘修复 |
