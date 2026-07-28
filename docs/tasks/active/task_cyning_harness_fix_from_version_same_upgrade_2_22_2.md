# Task · 同版 upgrade 保留 from_version（2.22.2）

> **状态**：`active`  
> **关联**：ops-desk-web FEEDBACK U1 · `wizard/lib/manifest.sh`  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/fix-from-version-same-upgrade-2-22-2`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-fix-from-version-same-upgrade-2-22-2` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；同版二次 upgrade 集成测 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/fix-from-version-same-upgrade-2-22-2` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | wizard/manifest；无业务图 |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 不改 coding_wiki |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者粘贴 fix Prompt · 00 代签 |
| HG-AUDIT-R1 | approved | 30 | 基础设施小修 · skip_review 同会话 |

---

## 背景与目标

同钉版二次 `upgrade` 把 `manifest.from_version` 写成 `null`（ops-desk-web U1），与 schema「null 仅 init」及 RUNBOOK §1.2.1 二次 upgrade 冲突。

## 范围

- [x] `write_manifest_upgrade`：同版保留既有 from_version
- [x] 集成测钉死同版二次行为
- [x] package/CHANGELOG **2.22.2** · PR

## 非范围

改业务仓；大改 local.json（U2）；改 FRAGMENT packages/**（U4b）；削弱闸

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 同版仍写 null | 回归测红 · 修 preserve 分支 | 是 |

## 验收标准

- [x] 跨版：from_version = 升级前 version
- [x] 同版二次：from_version 不变（非 null）
- [x] `npm test` 绿 · PR URL

### 自检结论（执行者）

- `npm test` → 254 pass（含同版二次 from_version）
- PR：https://github.com/Cyning12/cyning-harness/pull/18

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 开工 |
