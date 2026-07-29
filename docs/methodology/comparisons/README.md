# 对照研究 · awesome-harness-engineering × Bench My Harness

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **外仓（只读）** | `/Users/cyning/Desktop/awesome-harness-engineering` · `/Users/cyning/Desktop/bench-my-harness` |
| **硬边界** | 不引入 Runtime 依赖；不把 BMH 并入 npm；本波不改 `wizard`/`verify` 行为码 |

## 消歧（必读）

见 [`SYNTHESIS_harness_term_disambiguation_v1_zh.md`](./SYNTHESIS_harness_term_disambiguation_v1_zh.md)。

**cyning-harness = 可嵌入的 ICVO 纪律与帽链真值包（无 Agent Runtime）；不是工具榜，也不是 Codex/Claude 跑分器。**

## 产出索引

| ID | 文件 | 优先级 |
|----|------|--------|
| M1 | [`SYNTHESIS_harness_term_disambiguation_v1_zh.md`](./SYNTHESIS_harness_term_disambiguation_v1_zh.md) | P0 |
| M2 | [`AHE_templates_vs_cyning_task_invoke_v1_zh.md`](./AHE_templates_vs_cyning_task_invoke_v1_zh.md) | P0 |
| M3 | [`SPEC-evaluation-observation_v1.md`](../../spec/SPEC-evaluation-observation_v1.md)（`draft`） | P0 |
| M4 | [`BMH_git_workspace_vs_cyning_worktree_v1_zh.md`](./BMH_git_workspace_vs_cyning_worktree_v1_zh.md) | P1 |
| M5 | [`SYNTHESIS_discipline_as_benchmark_variable_v1_zh.md`](./SYNTHESIS_discipline_as_benchmark_variable_v1_zh.md) | P1 |
| M6 | [`AHE_adjacent_and_retireability_v1_zh.md`](./AHE_adjacent_and_retireability_v1_zh.md) | P2 |

## 上游链接

- [awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering)
- [bench-my-harness](https://github.com/vinilana/bench-my-harness)

## 建议下一实现 task（签闸后）

1. TASK_TEMPLATE 验收节补 `verify:` 示例（G-M2-01）
2. 人读退役清单（G-M2-03 / M6）
3. SPEC-evaluation-observation 签闸 → 可选进版本说明（不自动实现采集）

## 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · 六模块落地 |
