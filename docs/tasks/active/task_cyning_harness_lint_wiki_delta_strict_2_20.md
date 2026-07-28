# Task · lint-wiki-delta --strict（2.20.0）+ 2.19.2 docs 澄清

> **状态**：`in_progress`  
> **关联**：[`docs/RUNBOOK_upgrade_wiki_delta_v1_zh.md`](../../RUNBOOK_upgrade_wiki_delta_v1_zh.md)  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/lint-wiki-delta-strict-2-20`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-lint-wiki-delta-strict-2-20` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；--strict 单测覆盖 note/path |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/lint-wiki-delta-strict-2-20` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | CLI/docs；无业务 `_tech_graph` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 本波不改 coding_wiki 正文 |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话授权 2.20+2.19.2 同波 |
| HG-AUDIT-R1 | approved | 30 | CLI/docs · maintainer skip_review 同会话 |

---

## 背景与目标

同波交付：`2.20.0` `--strict` 关账预检 + `2.19.2` RUNBOOK/CI「迁完再硬失败」澄清（docs 并入 2.20.0 发版，不单独 publish 2.19.2）。

## 范围

- [x] `lint-wiki-delta --strict` · 默认行为不变 · JSON issues/code
- [x] RUNBOOK §0 + CI 样例注释（2.19.2）· USER_GUIDE 链 --strict
- [x] package/CHANGELOG **2.20.0**（含 2.19.2 条目）· npm test · PR

## 非范围

- 削弱 close；默认 `--allow-wiki-gap`；CI 默认强制 `--strict`；改 web；擅自 publish；单独发 npm 2.19.2

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 默认模式误报 note/path | 回退仅缺字段 | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] 默认：仅缺字段；`--strict`：none 无 note / 坏 path 可失败
- [x] RUNBOOK 写清迁完再硬失败 / 可选 --strict
- [x] `npm test` 全绿 · PR URL

### 自检结论（执行者）

- `npm test` → 248 pass
- 默认：none 无 note / 坏 path **不**报；`--strict` 报 `wiki_delta_none_no_note` / `wiki_delta_path_missing`

### KPI（00）

Task_KPI%: 90

| 维 | 分 |
| --- | --- |
| 质量 | 5 |
| 过程 | 4 |
| 可观测 | 5 |
| 回馈 | 4 |

### 经验总结

- 默认 lint 必须保持「只缺字段」，否则 2.19 CI 样例会误伤半迁仓。
- `--strict` 直接复用 close 的 evaluateWikiDelta，避免两套语义。
- Wiki: n/a

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 2.20.0 + 2.19.2 同波 |
