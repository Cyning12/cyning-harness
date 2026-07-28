# Task · wiki_delta 升级迁移文档 + templates 互链（2.18.1）

> **状态**：`in_progress`  
> **关联 SPEC**：[`../spec/SPEC-experience-wiki-feedback_loop_v1.md`](../spec/SPEC-experience-wiki-feedback_loop_v1.md)  
> **消费者证据**：`cyning-harness-web/docs/evidence/FEEDBACK_harness_2_18_0_from_web_obs_20260728.md` · `BACKFILL_DRAFT_…`  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/cyning-harness-wiki-delta-migrate-docs-2-18-1`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-wiki-delta-migrate-docs-2-18-1` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；`wiki export --json --root coding_wiki/templates` 须 edges≥1 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/cyning-harness-wiki-delta-migrate-docs-2-18-1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 仅 docs/templates；无业务 `_tech_graph` |
| **wiki_delta** | `coding_wiki/templates` |
| **wiki_delta_note** | 模板互链样例（F-218-05） |
| **wiki_promotion** | `context` |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话授权 2.18.1 docs 回填 |
| HG-AUDIT-R1 | approved | 30 | docs/templates · maintainer skip_review 同会话 |

---

## 背景与目标

吸收 web dogfood F-218-01..05：2.18.1 **文档/模板**补强；CLI 缺字段 lint **延期 2.19.0**。

## 范围

- [x] USER_GUIDE：升级后 wiki_delta 存量迁移专节（决策树 + 扫描建议）
- [x] ONBOARDING + CHANGELOG：upgrade 不代写业务 task；破坏性链迁移节
- [x] coding_wiki/templates 互链；export 对 templates 根 edges≥1
- [x] CHECKLIST 批注（对照 FEEDBACK；人签仍交维护者）
- [x] npm test 绿 · PR（禁直推 main）· CHANGELOG 2.18.1

## 非范围

- CLI lint/list 缺 wiki_delta（→ 2.19.0）
- 削弱 close 硬闸；改 cyning-harness-web；擅自 npm publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| templates export 仍无边 | 补 [[wikilink]] 再验 | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] F-218-02/03/05 关闭；F-218-01 文档侧缓解、CLI 延期；F-218-04 维持 schema 字符串说明
- [x] `npm test` 全绿
- [x] PR URL · https://github.com/Cyning12/cyning-harness/pull/9

### 自检结论（执行者）

- `npm test` → 238 pass
- `wiki export --json --root coding_wiki/templates` → nodes=4 edges=11 · schema=harness.wiki_graph.v1

### KPI（00）

Task_KPI%: 90

| 维 | 分 |
| --- | --- |
| 质量 | 5 |
| 过程 | 4 |
| 可观测 | 4 |
| 回馈 | 5 |

### 经验总结

- verify WARN ≠ 已迁移：升级专节必须把「扫缺字段」写在 close 之前（F-218-01）。
- n/a vs none 用一页决策树即可消歧（F-218-02）。
- templates 加 2～3 条 [[wikilink]] 后 export 边立刻非空，Web 金样更稳（F-218-05）。
- Wiki: coding_wiki/templates

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00 起草 · 吸收 FEEDBACK/BACKFILL |
