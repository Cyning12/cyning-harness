# Task：图谱 bootstrap · __REPO_SLUG__ fork（阶段 B）

> **状态**：in_progress  
> **关联图谱**：`docs/_tech_graph/00_main.md` · `01_struct.md`  
> **试点 POINTER**：[`docs/harness/POINTER_PILOT_adoption_workspace_v1_zh.md`](../../harness/POINTER_PILOT_adoption_workspace_v1_zh.md)

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **test_strategy** | `not_applicable` |
| **test_strategy_note** | bootstrap 无业务 30；文档与人签关账 |
| **orchestration** | Cursor Task 链 |
| **audit_profile** | `human_only` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | pending | 22-R1 | task 初稿人扫 |
| HG-GRAPH-MODULES | pending | **30** | `01_struct` 模块表维护者人签 |

---

## 背景与目标

个人 fork 上建立图谱最低交付：模块表 + 顶层图 + 待补 flow 清单（**不**一次画完全仓 flow）。

---

## 范围

- [ ] `docs/_tech_graph/` 模板落盘
- [ ] `01_struct` 一级模块表（对照仓内 `AGENTS.md` 或 README）
- [ ] `00_main` 待补 flow 清单
- [ ] 维护者签 `HG-GRAPH-MODULES` → `approved`

## 非范围

- 向上游 PR harness / 图谱过程文件
- 本 task 内 30 改产品代码

---

## 分步图谱

| 子步 | 阶段 |
|------|------|
| B1 模块表 + 00_main 清单 | **阶段 B（本 task）** |
| B2 单条 flow 骨架 | B 可选 |
| flow 终稿 | **阶段 C** 业务 task 增量 |
