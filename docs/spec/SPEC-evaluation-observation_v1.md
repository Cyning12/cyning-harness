# SPEC：测评观测模型（evaluation observation）v1

| 项 | 内容 |
|----|------|
| **状态** | `signed` · 维护者签闸 2026-08-07（语义约定即时生效 · **不**含实现义务） |
| **日期** | 2026-07-29 |
| **建议版本** | 签闸后另开实现 task；本波**不** bump npm |
| **来源** | Bench My Harness `docs/specs/05-metrics-and-evaluation.md` · `03-canonical-event-contract.md` · ADR 可比性实践 |
| **范围** | 字段与语义约定；**不**实现 Agent Runtime / hooks 采集 |

## 1. 目标

为 cyning-harness / 工作区「纪律配置对比测评」提供**可审计的观测语义**：任何汇总分须带来源与置信度，并声明可比性，避免「静默混加 native+estimated」或「不可比却硬排名」。

## 2. measurement_source（测量来源）

| 值 | 含义 | 示例 |
|----|------|------|
| `native` | Provider / harness 自报 | Claude `costUSD`；Codex session token_count |
| `observed` | 测评器外测 | 进程 wall-clock `duration_ms` |
| `estimated` | 价表/分词器/启发式 | 按价表估成本 |
| `derived` | 由规范化事件计算 | tool_calls 计数汇总 |
| `unavailable` | 不可得 | 未知模型拒估 |

**规则**：`native` 与 `estimated` **不得**在未标注的情况下相加后宣称「总成本」。

## 3. confidence（置信度）

建议枚举：`high` | `medium` | `low` | `unknown`。

| 条件 | 建议 |
|------|------|
| native + 有 evidence_ref | `high` |
| observed 墙钟 | `high`（时间）/ 视场景 |
| estimated 价表匹配已知模型 | `medium` |
| unavailable 或启发式过粗 | `low` / 禁止强结论 |

每条 `MetricObservation` 建议字段：`name` · `value` · `unit` · `measurement_source` · `confidence` · `evidence_refs[]`（可选）。

## 4. comparability（可比性）

| 值 | 含义 |
|----|------|
| `comparable` | 同 prompt、同 repo `base_ref` 初态、同验证命令、观测源策略一致 |
| `limited` | 部分维度可比（须列出不可比维） |
| `not_comparable` | 禁止用于「谁更好」强排名 |

触发 `not_comparable` / `limited` 的典型因素（摘自 BMH 实践）：

- 模型 / 权限 / 网络策略不一致
- 工作区不是隔离 checkout（见 M4）
- token 源一类 native、一类 unavailable 却比「更省」
- 验证套件（test_commands）不同

## 5. 与 cyning 现有闸的关系

| cyning 已有 | 本 SPEC |
|-------------|---------|
| `verify` / `task close` / `test_strategy` | **过程正确性与纪律**；不替代本观测模型 |
| KPI / experience | 关账人评；可引用本模型的 evidence，但非同一 schema |
| 本 SPEC | 用于 **A/B 纪律配置 × IDE agent** 的外部或旁路测评报告 |

## 6. 非范围

- 不实现 BMH hooks / transcript 解析
- 不把 LangGraph 等列入产品依赖
- 不要求 `@cyning/harness` CLI 输出 token 成本

## 7. 验收（SPEC 级）

- [x] 一词：报告中出现成本/token 必带 `measurement_source` + `confidence`（签闸生效口径 · 首个消费者 = 未来 eval 报告）
- [x] 对比结论必带 `comparability`（同上）
- [x] 与 [`SYNTHESIS_discipline_as_benchmark_variable_v1_zh.md`](../methodology/comparisons/SYNTHESIS_discipline_as_benchmark_variable_v1_zh.md) suite 大纲可互链（双向链接已在）

## 8. 修订

| 日期 | 说明 |
|------|------|
| 2026-08-07 | **维护者签闸** → `signed` · 字段语义成 eval 报告真值（B2/BMH 对齐依据）· 本波不 bump npm、无实现义务 |
| 2026-07-29 | draft · M3 对照 BMH |
