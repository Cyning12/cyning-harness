# Task · upgrade overlay 部分根治（2.22.0）

> **状态**：`active`  
> **关联**：[`SPEC-upgrade-overlay-preserve_v1.md`](../../spec/SPEC-upgrade-overlay-preserve_v1.md) · ops U2  
> **Open Folder**：`cyning-harness/`（git root）  
> **git_branch**：`task/upgrade-overlay-preserve-2-22`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-upgrade-overlay-preserve-2-22` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；sync overlay fixture（定制 / 无定制） |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/upgrade-overlay-preserve-2-22` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | wizard/docs；无业务 `_tech_graph` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 本波不改 coding_wiki 正文 |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者「签收，开始此任务」 |
| HG-AUDIT-R1 | approved | 30 | SPEC signed · skip_review 同会话 |

---

## 背景与目标

ops dogfood：每次 `upgrade` 冲 AGENTS marker 内定制与 FRAGMENT `l1/01_modules`。评估结论为**部分解决**；本波落地 A（local 块 + salvage）+ B（profile 占位）+ E（结束 hint）。

## 范围

- [x] `harness-sync`：local salvage · `graph_modules_path` 替换 · overlay hint
- [x] FRAGMENT 占位 token · adapters/RUNBOOK/SPEC
- [x] 单测 · package **2.22.0** · PR（不 publish）

## 非范围

三方合并；整文件 preserve；削弱闸；改 ops；擅自 publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 非法 graph_modules_path | WARN 跳过替换，保留 token 或默认 | 是 |
| 定制无 local 包裹 | 仍冲 + hint | 是 |

## 验收标准

- [x] 无定制：占位 → `01_struct`；local 无关
- [x] 定制：local 块保留；path=`l1/01_modules` 写入 FRAGMENT
- [x] `npm test` 全绿 · PR URL

### 自检结论（执行者）

- `npm test` → 253 pass（含 sync.overlay ×4）
- PR：（填）

### 经验总结

（关账填）

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 签收开工 |
