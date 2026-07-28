# Task · coding_wiki 目录规划约定（2.18.2）

> **状态**：`in_progress`  
> **关联**：[`coding_wiki/templates/README.md`](../../../coding_wiki/templates/README.md) · USER_GUIDE「Wiki 目录 vs 关系图」  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/wiki-dir-convention-2-18-2`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-wiki-dir-convention-2-18-2` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`；`wiki export --json --root coding_wiki/templates` 须 edges≥1 |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/wiki-dir-convention-2-18-2` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | 仅 docs/templates；无业务 `_tech_graph` |
| **wiki_delta** | `coding_wiki/templates` |
| **wiki_delta_note** | 两层目录约定 + topics 示例薄页 |
| **wiki_promotion** | `context` |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话授权 2.18.2 目录约定 |
| HG-AUDIT-R1 | approved | 30 | docs/templates · maintainer skip_review 同会话 |

---

## 背景与目标

web dogfood：图靠链接可用，文件夹平铺易爆。把 **两层起步 + 加深阈值** 写入纪律包默认约定（recommended，**非** close/`wiki_delta` 硬闸）。

## 范围

- [x] `coding_wiki/templates/README`：树 / 原则 / 频率 / 清单；`topics/` 示例薄页
- [x] USER_GUIDE：专节「Wiki 目录 vs 关系图」（不重复写烂 §6.0b）
- [x] ONBOARDING 一句 POINTER · CHANGELOG + package **2.18.2**
- [x] （可选）CHECKLIST 知悉两层约定勾选
- [x] npm test 绿 · PR（禁直推 main · 禁擅自 publish）

## 非范围

- 改 cyning-harness-web（消费者后迁 `topics/`）
- CLI lint 缺 `wiki_delta`（→ 2.19.0）
- 削弱 close 闸；默认 `--allow-wiki-gap`；擅自 npm publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| templates export 边仍 < 1 | 补互链再验 | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] templates README 含两层树 + ≥15 加深指引 + 操作清单
- [x] USER_GUIDE 有「目录 vs 图」并链 templates README
- [x] `package.json` / CHANGELOG = **2.18.2**
- [x] `npm test` 全绿 · PR URL

### 自检结论（执行者）

- `npm test` → 238 pass
- `wiki export --json --root coding_wiki/templates` → nodes=7 edges=22 · warnings=[] · schema=harness.wiki_graph.v1

### KPI（00）

Task_KPI%: 90

| 维 | 分 |
| --- | --- |
| 质量 | 5 |
| 过程 | 4 |
| 可观测 | 4 |
| 回馈 | 5 |

### 经验总结

- 目录约定必须写清 recommended≠硬闸，否则消费者误以为缺 topics/ 会 BLOCK close。
- 文档里勿写字面 `[[`+`wikilink`+`]]` 作术语，会被 export 当成未解析边。
- Wiki: coding_wiki/templates

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00 起草 · 目录约定 2.18.2 |
| 2026-07-28 | 30 落地 · test 绿 · 待 PR |
