# Task · 闭环硬闸 U1（G1 graph_delta + G3 KPI + G4 experience）

> **状态**：`in_progress`  
> **SPEC**：[`../spec/SPEC-close-loop-hard-gates_v1.md`](../spec/SPEC-close-loop-hard-gates_v1.md)  
> **工作区 PLAN**：`Projects/docs/harness/guides/PLAN_cyning_harness_close_loop_hard_gates_upgrade_v1_zh.md`  
> **Open Folder**：`cyning-harness/`  
> **30 Prompt**：工作区 `docs/harness/prompts/PROMPT_30_cyning_harness_close_loop_hard_gates_upgrade_v1_zh.md`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-close-loop-hard-gates-u1` |
| **test_strategy** | `required` |
| **test_strategy_note** | close/verify 新闸单测必可失败；`npm test` 全绿 |
| **code_quality_bar** | `strict` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/close-loop-hard-gates-u1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 产品 CLI/模板变更；无业务 `_tech_graph` 增量 |
| **experience_capture** | `required` |
| **kpi_rubric** | `KPI_RUBRIC_v1_3` |
| **kpi_aggregator** | `CLOSE` |
| **depends_on** | U0 pre-30 已合入 main（待同窗 npm 2.17.0） |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者 2026-07-28：「先收口U0，后继续U1」 |
| HG-SPEC-SIGNOFF | pending | 30 | 签 SPEC-close-loop-hard-gates_v1 或书面 skip_10_spec |
| HG-AUDIT-R1 | pending | 30 | 可 skip_review 书面；否则 20 审后签 |

---

## 背景与目标

在 U0 之上交付 ANALYSIS G1 / G3 P0 / G4：close 可机械挡 graph_delta / KPI / experience 缺口；verify 对 graph_delta WARN。与 U0 同目标发版 **2.17.0**（Unreleased 直至维护者 publish）。

---

## 范围

- [ ] G1：模板字段 + close/verify + 单测 + USER_GUIDE
- [ ] G3 P0：KPI 最小形态 + `--allow-kpi-gap` + 单测
- [ ] G4：experience 节 + `--allow-experience-gap` + 单测
- [ ] CHANGELOG Unreleased 归入 2.17.0 叙事（与 U0 同窗）
- [ ] PR → squash merge（禁直推 main）

## 非范围

- G2（另 task `…-consumer-ontology-bootstrap-v1`）
- G1.b / G3 P1 / harness-web
- npm publish（维护者）

## 失败路径

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| HG-SPEC-SIGNOFF / HG-AUDIT-R1 pending 即改 lib | 拒开工 | 是 |
| 用 `--allow-*-gap` 作为默认绿路径 | 40/00 打回 | 是 |
| 削弱 pre-30 / invoke close | 打回 | 是 |

## 验收标准

- [ ] 与 SPEC §4 勾选一致（本 task 覆盖 G1/G3/G4 部分）
- [ ] `npm test` 全绿
- [ ] PR 已 merge

### KPI（00）

（关账填）

### 经验总结

（关账填）

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00 起草 · U0 已合 main |
