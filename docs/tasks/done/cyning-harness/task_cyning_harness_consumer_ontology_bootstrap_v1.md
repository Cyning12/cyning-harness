# Task · Consumer ontology bootstrap（G2 P0）

> **状态**：`done`  
> **SPEC**：[`../spec/SPEC-close-loop-hard-gates_v1.md`](../spec/SPEC-close-loop-hard-gates_v1.md) §2.4  
> **依赖**：建议 U1（G1/G3/G4）合入后或同窗串行  

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-consumer-ontology-bootstrap` |
| **test_strategy** | `recommended` |
| **test_strategy_note** | 以模板/样例存在性断言为主；无强制 CLI BLOCK |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/consumer-ontology-bootstrap-v1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 产品仓无业务 wiki 轨；模板在 harness/templates |
| **graph_delta_note** | 文档/模板；无业务图谱增量 |
| **experience_capture** | `recommended` |
| **kpi_rubric** | `KPI_RUBRIC_v1_3` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 同 U1 列车授权 |
| HG-AUDIT-R1 | approved | 30 | 同 U1 列车 · maintainer skip_review 2026-07-28 |

---

## 背景与目标

绿野仓 Inform 语义设定：consumer ontology slice 模板 + ONBOARDING 顺序 + demo_checkout 样例。

## 范围

- [x] `harness/templates/ONTOLOGY_consumer_slice_v1.md`
- [x] ONBOARDING 一节
- [x] `examples/demo_checkout` 最小切片
- [x] 不改 `ontology-check` 产品本体语义

## 非范围

- G2 P1 lint WARN
- 强制业务仓复制完整 DESIGN_ONTOLOGY

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 把 consumer 并进 ontology-check | 打回 | 是 |

## 验收标准

- [x] SPEC §2.4 / §4 G2 项勾选
- [x] `npm test` 仍绿

### 自检结论（执行者）

npm test 全绿；功能已合入 main 并随 2.17.0/列车发版。

### KPI（00）

Task_KPI%: 92


---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00 起草 |

### 经验总结

- consumer slice 与产品 ontology-check 分离避免绿野误跑产品公理
- ONBOARDING 顺序比硬闸更重要
- demo_checkout 样例便于复制
