# Task · graph yaml G-L 递归发现 + export graph.json

> **状态**：`done` · CLOSE: PASS（2026-08-07）· **已发布 `@cyning/harness@2.24.0`**  
> **SPEC**：[`../spec/SPEC-graph-yaml-glayer-recurse-export_v1.md`](../spec/SPEC-graph-yaml-glayer-recurse-export_v1.md)  
> **R1**：[`../harness/reviews/task_cyning_harness_graph_yaml_glayer_recurse_export_audit_R1_20260729.md`](../harness/reviews/task_cyning_harness_graph_yaml_glayer_recurse_export_audit_R1_20260729.md)  
> **Open Folder**：`cyning-harness-wt-glayer-yaml/`  
> **git_branch**：`task/graph-yaml-glayer-recurse-export`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-graph-yaml-glayer-recurse-export` |
| **test_strategy** | `required` |
| **test_strategy_note** | `node --test test/graph-yaml.test.js` · 16 pass |
| **code_quality_bar** | `strict` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `full` |
| **required_invoke_hats** | `10,20,30,40` |
| **git_branch** | `task/graph-yaml-glayer-recurse-export` |
| **worktree_root** | `cyning-harness-wt-glayer-yaml/` |
| **graph_change_layer** | `none` |
| **graph_delta** | `none` |
| **graph_delta_note** | 纯机制轨（发现/export）· 无图谱内容变更 |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 教训已入 RETENTION_GAP note §3 与本 task 经验总结，不另立 wiki 条目 |
| **experience_capture** | `recommended` |
| **kpi_aggregator** | `CLOSE` |
| **suggested_npm** | **2.24.0**（发版另批 · 2.23.0 已由 agent-skills-packaging 占用） |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 开立 |
| HG-SPEC-SIGNOFF | approved | 30 | 2026-07-29 |
| HG-AUDIT-R1 | **approved** | 30 | R1 通过 · 维护者「开始任务」 |

---

## 背景与目标

物理分层下 `compile|check --all` 空跑；无官方 export。本 task 修递归发现 + `graph yaml export`。

---

## 范围

- [x] SPEC 签收  
- [x] R1 · HG-AUDIT-R1  
- [x] `lib/graph-yaml.js`：递归 · 路径型 graphId · `exportGraphJson` · `resolveGraphJsonPath`  
- [x] CLI：`export` · `--no-recursive` · check 优先 shared/graph.json  
- [x] `test/graph-yaml.test.js` 16 pass  
- [x] USER_GUIDE §10 · CHANGELOG Unreleased  
- [x] meta dogfood：compile 5 图 · export graphs=5  
- [x] CLOSE（2026-08-07 · PR #22 合并 · invoke gap 留痕放行）· 已发布 2.24.0  

## 非范围

- npx bin 链环境修复  
- meta merge main · templates 回灌  

## 验收标准

- [x] 分层根 `--all` 非空  
- [x] `export` → `shared/graph.json`（或 `--out`）  
- [x] 扁平 + `--no-recursive` 回归  
- [x] 测试绿 · 文档齐  

---

### 自检结论（执行者）

**40 自检 · 2026-08-07（rebase 至 2.23.0 后真跑）**：

| 验证命令 | 退出码 | 关键输出 |
|----------|--------|----------|
| `node --test test/graph-yaml.test.js` | 0 | **16 pass / 0 fail** |
| `npm test` | 0 | **272 pass / 0 fail**（含 sync overlay / skills 回归） |
| `node bin/harness.js skills check` | 0 | `SKILLS CHECK: PASS · skills/ 无 drift` |
| `node bin/harness.js verify --task <本 task> --allow-invoke-gap` | 0 | `VERIFY: PASS`（invoke gap WARN 留痕 · 见 RETENTION_GAP note） |

验收标准逐条：分层根 `--all` 非空 ✅ · `export` → `shared/graph.json` ✅ · 扁平 + `--no-recursive` 回归 ✅ · 测试绿 · 文档齐（USER_GUIDE §10 · CHANGELOG）✅ · meta dogfood compile 5 图 / export graphs=5（2026-07-29）✅

**结论：pass**

### KPI（00）

Task_KPI%: 73

| 维 | 分 | 说明 |
| --- | --- | --- |
| 质量 | 5 | rebase 后全量绿 · dogfood 实证 |
| 过程 | 3 | invoke 快照缺（10/20/30/40 全无）；实现滞留 worktree 未提交 8 天 |
| 纪律 | 3 | retention profile=full 未当日执行；以 RETENTION_GAP note 诚实留痕弥补，不补造 |

### 经验总结

- **invoke 快照与 commit 必须当日落**：worktree 未提交状态滞留 8 天 → rebase 基线陈旧、版本号被占（2.23.0→2.24.0）、真值双份（主仓/worktree untracked）三重成本
- **suggested_npm 是建议不是预留**：被占即顺延，task 文档与 CHANGELOG 同步改
- **缺口诚实留痕优于回溯补造**：`--allow-invoke-gap` + RETENTION_GAP note 是可审计的放行路径；假快照不是证据
- 跨目录同文件 untracked 真值须 `diff -q` 核对后单源化（本次主仓 3 文件与 worktree 逐字节一致才删）

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-07 | **已发布 `@cyning/harness@2.24.0`**（npm latest · tag v2.24.0 已推）· task 全终态 |
| 2026-08-07 | PR #22 合并 · rebase 后自检全绿（272 tests · skills check PASS）· **CLOSE: PASS**（invoke gap 留痕放行）→ 归档 done/ · 发版待人 |
| 2026-07-29 | 开立 |
| 2026-07-29 | R1 + 30 实现 · 测/dogfood 绿 |
