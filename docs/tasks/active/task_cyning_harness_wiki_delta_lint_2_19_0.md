# Task · task lint-wiki-delta（2.19.0）+ docs 防踩坑回填

> **状态**：`in_progress`  
> **消费者证据**：`cyning-harness-web/docs/evidence/FEEDBACK_…` · `BACKFILL_DRAFT_…`（剩余 open）  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/wiki-delta-lint-2-19`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-wiki-delta-lint-2-19-0` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；CLI lint-wiki-delta 单测 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/wiki-delta-lint-2-19` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | CLI/docs；无业务 `_tech_graph` |
| **wiki_delta** | `coding_wiki/templates` |
| **wiki_delta_note** | README 防踩坑措辞（F-218-07） |
| **wiki_promotion** | `context` |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话授权 2.19 回填 |
| HG-AUDIT-R1 | approved | 30 | CLI/docs · maintainer skip_review 同会话 |

---

## 背景与目标

吸收 web dogfood 剩余 open：F-218-01 CLI 扫缺 `wiki_delta`；F-218-07 / 经验 #9 docs 防踩坑与 upgrade≠迁 topics。

## 范围

- [x] `task lint-wiki-delta` + verify WARN 链命令 + USER_GUIDE §6.0b 扫描节
- [x] templates/USER_GUIDE 防踩坑；ONBOARDING upgrade≠迁 topics
- [x] package/CHANGELOG **2.19.0** · npm test · PR（禁直推 main · 禁擅自 publish）

## 非范围

- 削弱 close 闸；默认 `--allow-wiki-gap`；改 cyning-harness-web；重复 2.18.1/2.18.2 已落地内容；擅自 npm publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 误把 note/path 校验塞进本 lint | 回退仅缺字段 | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] 可跑命令列出缺 `wiki_delta` 文件（exit 2）
- [x] docs 防踩坑 + upgrade≠迁目录
- [x] `npm test` 全绿 · PR URL · https://github.com/Cyning12/cyning-harness/pull/11

### 自检结论（执行者）

- `npm test` → 244 pass
- `task lint-wiki-delta` 单测覆盖 PASS/FAIL/--json

### KPI（00）

Task_KPI%: 90

| 维 | 分 |
| --- | --- |
| 质量 | 5 |
| 过程 | 4 |
| 可观测 | 5 |
| 回馈 | 5 |

### 经验总结

- 升级迁移清单应是可 exit 2 的 CLI，而不是文档里的 `rg -L` 启发式（F-218-01）。
- verify WARN 链到同一命令，减少「看到 WARN 仍不知怎么扫全仓」。
- Wiki: coding_wiki/templates

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 2.19.0 剩余回填 |
