# Task · CI lint-wiki-delta 样例 + 升级 runbook（2.19.1）

> **状态**：`in_progress`  
> **关联**：[`docs/RUNBOOK_upgrade_wiki_delta_v1_zh.md`](../../RUNBOOK_upgrade_wiki_delta_v1_zh.md) · [`ci/samples/lint-wiki-delta.yml.example`](../../../ci/samples/lint-wiki-delta.yml.example)  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/ci-lint-wiki-delta-sample-2-19-1`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-ci-lint-wiki-delta-2-19-1` |
| **test_strategy** | `required` |
| **test_strategy_note** | `npm test`（回归；本波无新逻辑单测义务以外的 CLI 变更） |
| **code_quality_bar** | `recommended` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `default` |
| **required_invoke_hats** | `10,30,40` |
| **git_branch** | `task/ci-lint-wiki-delta-sample-2-19-1` |
| **worktree_root** | `cyning-harness/` |
| **graph_delta** | `none` |
| **graph_delta_note** | docs/ci 样例；无业务 `_tech_graph` |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 本波不改 coding_wiki 正文；仅 runbook/CI POINTER |
| **experience_capture** | `required` |
| **kpi_aggregator** | `CLOSE` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 维护者会话授权 2.19.1 CI+runbook |
| HG-AUDIT-R1 | approved | 30 | docs/ci · maintainer skip_review 同会话 |

---

## 背景与目标

2.19.0 已有 `task lint-wiki-delta`；本波降摩擦：CI 可复制样例 + 一页升级 runbook。

## 范围

- [x] `ci/samples/lint-wiki-delta.yml.example` + samples README
- [x] `docs/RUNBOOK_upgrade_wiki_delta_v1_zh.md` · ONBOARDING / USER_GUIDE POINTER
- [x] package/CHANGELOG **2.19.1** · npm test · PR（禁直推 main · 禁擅自 publish）

## 非范围

- 改 lint CLI 语义；削弱 close；默认 `--allow-wiki-gap`；改 web；擅自 publish

## 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 样例误开 pnpm cache | 按 samples README 摩擦节改 false | 是 |
| 直推 main | 打回走 PR | 是 |

## 验收标准

- [x] CI 样例可 `cp` 且注释说明硬失败 / 迁移中 continue-on-error
- [x] runbook 含 upgrade → lint → 补字段 → 可选 CI/topics
- [x] `npm test` 全绿 · PR URL · https://github.com/Cyning12/cyning-harness/pull/12

### 自检结论（执行者）

- `npm test` → 244 pass
- 样例路径：`ci/samples/lint-wiki-delta.yml.example` · runbook 已链 ONBOARDING / USER_GUIDE / docs/README

### KPI（00）

Task_KPI%: 88

| 维 | 分 |
| --- | --- |
| 质量 | 4 |
| 过程 | 4 |
| 可观测 | 5 |
| 回馈 | 5 |

### 经验总结

- CLI 落地后下一刀应是「可复制 CI + 一页 runbook」，否则消费者仍靠聊天复述升级序。
- npx-only 样例必须默认 `package-manager-cache: false`（与 hgm-ingest / tech-graph 同坑）。
- Wiki: n/a（本波未改 coding_wiki）

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 00/30 · 2.19.1 |
