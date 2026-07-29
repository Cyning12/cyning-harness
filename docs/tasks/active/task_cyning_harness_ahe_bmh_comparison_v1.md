# Task · AHE + BMH 对照研究落地（v1）

> **状态**：`active`  
> **关联**：[`docs/methodology/comparisons/README.md`](../../methodology/comparisons/README.md)  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/ahe-bmh-comparison-v1`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-ahe-bmh-comparison-v1` |
| **test_strategy** | `not_applicable` |
| **test_strategy_note** | 对照研究文档 / SPEC draft；无行为码变更 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/ahe-bmh-comparison-v1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 方法论对照；无业务 `_tech_graph` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 本波不改 coding_wiki 正文 |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者确认分派计划并 Implement |
| HG-AUDIT-R1 | approved | 30 | 文档对照 · skip_review 同会话 |

---

## 背景与目标

消化 awesome-harness-engineering（产业地图）与 Bench My Harness（测评平台），落地消歧叙事、模板/worktree 对照、观测 SPEC draft、纪律单变量 suite 大纲与退役表建议，供后续升级/测评签闸。

## 范围

- [x] `docs/methodology/comparisons/` M1–M6 + README
- [x] `docs/spec/SPEC-evaluation-observation_v1.md`（draft）
- [x] methodology README / DOCUMENT_MAP POINTER
- [x] 本 task · PR（不 bump npm · 不改 wizard/verify 行为）

## 非范围

BMH Cursor adapter；引入 LangGraph/mem0/E2B；实现 token 采集；擅自 publish

## 验收标准

- [x] 一词三义表 + 对外一句话
- [x] 六份产出可从 comparisons/README 索引
- [x] SPEC draft 含 source/confidence/comparability
- [x] PR URL

### 自检结论（执行者）

六模块 md + SPEC draft + comparisons/README + methodology 索引 + 本 task/invoke/R1 已齐；未改 wizard/verify；未 bump npm。

### 经验总结

外仓对照优先落「一词三义」与观测语义 draft，避免把测评 Runtime 误并入产品包；后续实现须另开签闸 task。

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 · 计划落地 |
