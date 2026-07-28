# Task · RUNBOOK overlay 强制操作序（2.22.1 docs）

> **状态**：`active`  
> **关联**：ops `FEEDBACK_RUNBOOK_overlay_procedure_*` · [`RUNBOOK` §1.2.1](../../RUNBOOK_upgrade_wiki_delta_v1_zh.md)  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/runbook-overlay-procedure-2-22-1`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-runbook-overlay-procedure-2-22-1` |
| **test_strategy** | `recommended` |
| **test_strategy_note** | docs patch；`npm test` 仅 as_of bump |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/runbook-overlay-procedure-2-22-1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 文档 only |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 不改 coding_wiki |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者粘贴 FEEDBACK Prompt 开工 |
| HG-AUDIT-R1 | approved | 30 | docs only · skip_review 同会话 |

---

## 范围

- [x] RUNBOOK §1.2.1 强制序 · §0b 交叉链 · §1.2 操作序/负面边界 · 示例钉 `@2.22.1`
- [x] adapters README / ONBOARDING POINTER
- [x] package/CHANGELOG **2.22.1** · PR（不改 sync · 不 publish）

## 非范围

改 sync/S5 文案（可选后续）；削弱闸；改 ops；擅自 publish

## 验收

- [x] §1.2.1 可逐步复制；§0b↔§1.2.1 互链
- [x] `npm test` 绿 · PR URL

### 自检结论（执行者）

- `npm test` → 253 pass
- PR：https://github.com/Cyning12/cyning-harness/pull/16

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · docs 回填开工 |
