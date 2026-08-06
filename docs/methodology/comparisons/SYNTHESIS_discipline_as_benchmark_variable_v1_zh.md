# 纪律配置作为测评单变量 · suite 大纲（v1）

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **来源** | AHE Evals（SWE-bench / Harness-Bench / promptfoo）· BMH SPEC-16/19 · `.bmh/specs/suite.json` |
| **观测语义** | [`SPEC-evaluation-observation_v1.md`](../../spec/SPEC-evaluation-observation_v1.md) |

## 1. 原则

1. **能力归属**：按 Harness-Bench 口径，结论写在 **model × harness(配置) × 纪律变量**，勿只归因基座模型。  
2. **单变量**：一次 suite 只改一类纪律旋钮；其余固定（模型、IDE、repo `base_ref`、test 命令）。  
3. **对象**：IDE agent（Cursor / Claude Code / Codex）在**已嵌入或未嵌入** cyning 纪律的业务仓上的表现 — **不是** `@cyning/harness` CLI 单元测。  
4. **工具**：BMH 可作外部 runner（当前偏 Codex/Claude）；Cursor 路径可用人工 trial + 同一报告字段。

## 2. AHE Evals 地图（POINTER）

| 条目 | 用途 |
|------|------|
| [SWE-bench](https://www.swebench.com) | 「改码任务是否完成」金标准参照 |
| [Harness-Bench](https://arxiv.org/abs/2605.27922) | **隔离执行层**；强制 model×harness 报告 |
| [promptfoo](https://github.com/promptfoo/promptfoo) | 输出回归 / CI 断言 DSL |
| Agent Evaluation Readiness 类清单 | deterministic 先于 LLM-judge（对齐 `test_strategy`） |

完整策展：[awesome-harness-engineering · Evals](https://github.com/ai-boost/awesome-harness-engineering)（Evals & Verification 节）。

## 3. 建议 suite 用例（纪律单变量）

| case_id | 固定 | **单变量** | 假设 | 验证 |
|---------|------|------------|------|------|
| `discipline_absent_vs_present` | 同 repo base、同模型、同 prompt | 未 init vs `harness-only` 已 sync | 有纪律降低拒开工/越界 | test_commands + 人工闸违规次数 |
| `wiki_delta_field_on_off` | 已嵌入 ≥2.18 | close 前缺 `wiki_delta` vs 已填 | 缺字段被 close/lint 挡住 | `task lint-wiki-delta` · close 退出码 |
| `overlay_local_vs_inline` | ≥2.22 | 定制在产品 marker 内 vs local 块外 | local 块二次 upgrade 零手恢复 | §1.2.1 二次 upgrade + diff |
| `pre30_invoke_gate` | verify 可用 | 仅有 30 invoke vs 10+30 | 缺 pre-30 挡 30 | `verify --task` · `may_start_30` |
| `hats_minimal_vs_default` | 同 task 文 | `minimal` vs `required_invoke_hats: 10,30,40` | 帽集合影响过程完整度 | invoke 文件存在性 + close |

## 4. 报告最小字段（对齐 SPEC）

```text
suite_id / case_id / agent_harness (codex|claude_code|cursor|…)
model_id
discipline_variant (单变量取值)
base_commit
comparability: comparable|limited|not_comparable
metrics[]: { name, value, unit, measurement_source, confidence, evidence_refs }
pass_fail (validation)
notes
```

## 5. BMH 间接用法（可选）

```text
业务仓（已/未嵌入纪律）
  → bmh add / suite（prompt = 同一改码题）
  → 隔离 checkout @ base_ref
  → 跑 Claude/Codex
  → report.html + 上表字段人工补 discipline_variant
```

无 Cursor adapter 时：Cursor trial 用同表手填；勿与 Claude trial 标 `comparable` 除非证明策略一致。

## 6. 非目标

- 不把 BMH 并入 npm 包
- 不在本波实现自动 suite runner
- 不用 SWE-bench 全量替代纪律闸测试

## 7. 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · M5 |
