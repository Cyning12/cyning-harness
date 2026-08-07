# Task · graph yaml G-L 递归发现 + export graph.json

> **状态**：`active` · **30 实现完成** · 待 CLOSE / 发版  
> **SPEC**：[`../spec/SPEC-graph-yaml-glayer-recurse-export_v1.md`](../spec/SPEC-graph-yaml-glayer-recurse-export_v1.md)  
> **R1**：[`../harness/reviews/task_cyning_harness_graph_yaml_glayer_recurse_export_audit_R1_20260729.md`](../harness/reviews/task_cyning_harness_graph_yaml_glayer_recurse_export_audit_R1_20260729.md)  
> **Open Folder**：`cyning-harness-wt-glayer-yaml/`  
> **git_branch**：`task/graph-yaml-glayer-recurse-export`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-graph-yaml-glayer-recurse-export` |
| **test_strategy** | `required` |
| **test_strategy_note** | `node --test test/graph-yaml.test.js` · 16 pass |
| **code_quality_bar** | `strict` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `full` |
| **required_invoke_hats** | `10,20,30,40` |
| **git_branch** | `task/graph-yaml-glayer-recurse-export` |
| **worktree_root** | `cyning-harness-wt-glayer-yaml/` |
| **graph_change_layer** | `none` |
| **graph_delta** | `none` |
| **experience_capture** | `recommended` |
| **kpi_aggregator** | `CLOSE` |
| **suggested_npm** | **2.24.0**（发版另批 · 2.23.0 已由 agent-skills-packaging 占用） |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 开立 |
| HG-SPEC-SIGNOFF | approved | 30 | 2026-07-29 |
| HG-AUDIT-R1 | **approved** | 30 | R1 通过 · 维护者「开始任务」 |

---

## 背景与目标

物理分层下 `compile|check --all` 空跑；无官方 export。本 task 修递归发现 + `graph yaml export`。

---

## 范围

- [x] SPEC 签收  
- [x] R1 · HG-AUDIT-R1  
- [x] `lib/graph-yaml.js`：递归 · 路径型 graphId · `exportGraphJson` · `resolveGraphJsonPath`  
- [x] CLI：`export` · `--no-recursive` · check 优先 shared/graph.json  
- [x] `test/graph-yaml.test.js` 16 pass  
- [x] USER_GUIDE §10 · CHANGELOG Unreleased  
- [x] meta dogfood：compile 5 图 · export graphs=5  
- [ ] CLOSE · npm 发版  

## 非范围

- npx bin 链环境修复  
- meta merge main · templates 回灌  

## 验收标准

- [x] 分层根 `--all` 非空  
- [x] `export` → `shared/graph.json`（或 `--out`）  
- [x] 扁平 + `--no-recursive` 回归  
- [x] 测试绿 · 文档齐  

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 开立 |
| 2026-07-29 | R1 + 30 实现 · 测/dogfood 绿 |
