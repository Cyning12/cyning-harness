# Task · P0 FEEDBACK 回填（2.21.0）

> **状态**：`active`  
> **关联**：web/ops `FEEDBACK_harness_2_20_0_*_20260728.md` · [`RUNBOOK_upgrade_wiki_delta_v1_zh.md`](../../RUNBOOK_upgrade_wiki_delta_v1_zh.md)  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/p0-feedback-backfill-2-21`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-p0-feedback-2-21` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；wiki export 伪链单测 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/p0-feedback-backfill-2-21` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | docs/CLI；无业务 `_tech_graph` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 本波不改 coding_wiki 正文；SPEC 在 docs/spec |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话：「根据回馈再一起完成 P0」 |
| HG-AUDIT-R1 | approved | 30 | docs/CLI 小改 · maintainer skip_review 同会话 |

---

## 背景与目标

两仓 dogfood 升至 2.20.0 并回馈 RUNBOOK；本波合入产品 **2.21.0**：文档/CI 回填 + `wiki export` 说明性伪链降噪（原 F-218-07）。

## 范围

- [x] RUNBOOK：快速路径 · pin · overlay · cp 三法 · Python · export 旗标
- [x] CI：`lint-wiki-delta.pin.yml.example` · README 矩阵
- [x] `wiki export` illustrative skip + SPEC + 单测
- [x] package/CHANGELOG/discipline **2.21.0** · npm test · PR（不擅自 publish）

## 非范围

- 削弱 close；默认 `--allow-wiki-gap`；CI 默认强制 `--strict`；改 web/ops 业务仓；擅自 npm publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 伪链过滤吞真缺页 | 回退/收窄占位名表 | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] FEEDBACK P0/warn：F-220-01..04 · ops U2/U3/U6/Python 交叉链已落 RUNBOOK/CI
- [x] 说明性 `[[wikilink]]` 不进 warnings；真缺页仍 WARN
- [x] `npm test` 全绿 · PR URL（合入后维护者 publish）

### 自检结论（执行者）

- `npm test` → 249 pass / 0 fail
- illustrative：`[[wikilink]]` 跳过 WARN；`[[missing_real_page_xyz]]` 仍 WARN
- PR：（填 URL）

### KPI（00）

（关账填）

### 经验总结

（关账填 · Wiki: n/a）

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 2.21.0 P0 回填开做 |
