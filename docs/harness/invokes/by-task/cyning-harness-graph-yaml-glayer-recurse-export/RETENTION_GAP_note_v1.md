# Invoke 留档缺口说明 · cyning-harness-graph-yaml-glayer-recurse-export

| 项 | 内容 |
|----|------|
| **日期** | 2026-08-07（补记） |
| **task** | [`../../../tasks/active/task_cyning_harness_graph_yaml_glayer_recurse_export_v1.md`](../../../tasks/active/task_cyning_harness_graph_yaml_glayer_recurse_export_v1.md) |
| **结论** | 留档缺口 **确认存在**，维护者决策：**接受现状，不回溯补造** |

## 1. 缺口事实

task 元信息声明 `invoke_retention_profile: full`、`required_invoke_hats: 10,20,30,40`，但本任务 **无 invoke 快照**（对照：`cyning-harness-agent-skills-packaging` 有完整 5 份 `invoke_*.md`）。

原因：2026-07-29 执行 10→20→30→40 时，会话未按 retention profile 落 `invoke_*.md`；实现代码亦未当日 commit（仅存在于 worktree 工作区），直至 2026-08-07 才落账 rebase。

## 2. 现存过程证据（非 invoke 快照，但可审计）

| 证据 | 位置 |
|------|------|
| SPEC（已签 HG-SPEC-SIGNOFF · 2026-07-29） | `docs/spec/SPEC-graph-yaml-glayer-recurse-export_v1.md` |
| R1 审查（结论：通过 · 零内容阻塞；HG-AUDIT-R1 维护者签 approved） | `docs/harness/reviews/task_cyning_harness_graph_yaml_glayer_recurse_export_audit_R1_20260729.md` |
| task 文档（范围/验收逐项勾选 · 人工闸表） | task 文件本身 |
| 测试 | `test/graph-yaml.test.js` 16 pass；2026-08-07 rebase 后全量回归 272 pass + `skills check` PASS |

## 3. 决策与教训

- **不回溯补造** invoke 快照：事后重建的记录不是过程证据，伪造留档比缺口本身更坏。
- 缺口影响限于「帽链调用过程不可逐帽回放」；交付物正确性由测试与 R1 审查独立支撑。
- 教训（写入经验）：task 开立时若声明 `invoke_retention_profile: full`，30 实现会话**当日**落 invoke 快照与 commit，不留「worktree 未提交」状态过夜。

## 修订

| 日期 | 说明 |
|------|------|
| 2026-08-07 | 补记 · 维护者决策接受现状 |
