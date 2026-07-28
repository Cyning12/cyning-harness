# Task · Consumer ontology bootstrap（G2 P0）

> **状态**：`draft`  
> **SPEC**：[`../spec/SPEC-close-loop-hard-gates_v1.md`](../spec/SPEC-close-loop-hard-gates_v1.md) §2.4  
> **依赖**：建议 U1（G1/G3/G4）合入后或同窗串行  

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-consumer-ontology-bootstrap-v1` |
| **test_strategy** | `recommended` |
| **test_strategy_note** | 以模板/样例存在性断言为主；无强制 CLI BLOCK |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/consumer-ontology-bootstrap-v1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 文档/模板；无业务图谱增量 |
| **experience_capture** | `recommended` |
| **kpi_rubric** | `KPI_RUBRIC_v1_3` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 同 U1 列车授权 |
| HG-AUDIT-R1 | pending | 30 | 文档向；可书面 skip |

---

## 背景与目标

绿野仓 Inform 语义设定：consumer ontology slice 模板 + ONBOARDING 顺序 + demo_checkout 样例。

## 范围

- [ ] `harness/templates/ONTOLOGY_consumer_slice_v1.md`
- [ ] ONBOARDING 一节
- [ ] `examples/demo_checkout` 最小切片
- [ ] 不改 `ontology-check` 产品本体语义

## 非范围

- G2 P1 lint WARN
- 强制业务仓复制完整 DESIGN_ONTOLOGY

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 把 consumer 并进 ontology-check | 打回 | 是 |

## 验收标准

- [ ] SPEC §2.4 / §4 G2 项勾选
- [ ] `npm test` 仍绿

### KPI（00）

（关账填）

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00 起草 |
