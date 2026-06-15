# ETCLOVG 映射 · cyning-harness（v1 摘要）

| 项 | 内容 |
| --- | --- |
| **状态** | `draft` · A3 首版 public |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **详评** | 工作区 [`ASSESSMENT_cyning_harness_etclovg_industry_v1_zh.md`](https://github.com/Cyning12/cyning-ai-coding-governance)（私有治理仓 POINTER · 公开叙事见 [`ai-coding-closed-loop-articles`](https://github.com/Cyning12/ai-coding-closed-loop-articles)） |

> **定位（对外）**：cyning-harness 是嵌入业务仓的 **SDD 过程纪律包**（Inform / Constrain / Verify 的仓库化落地），**非** Agent Runtime · **非** MCP 宿主全栈。

---

## 1. ETCLOVG 覆盖快照

| 维度 | 覆盖 | cyning-harness 落点 |
| --- | --- | --- |
| **E** Execution | 低（外置） | 用户 IDE / Agent 基座 · 本产品不含 LLM 调用 |
| **T** Tooling | 中 | `wizard/` · `gate-check.sh` · npx CLI |
| **C** Context | 高 | `graph/` · `coding_wiki/` · `standards/` |
| **L** Lifecycle | 高 | SDD 帽链 · `HumanGate` · task 状态机 |
| **O** Observability | 低–中 | invoke · reviews 文档追溯 · 无运行时遥测 |
| **V** Verification | 中–高 | CI 样例 · `test_strategy` · gate-check |
| **G** Governance | 高 | 规范轨 · 22 审查 · S2 不覆盖业务 task |

**综合（行业对照）**：约 **3.6 / 5** · 与 ETCLOVG 全栈 Harness **互补而非竞争**。

---

## 2. ICVO 四支柱（产品叙事）

| 支柱 | 产品映射 |
| --- | --- |
| **Inform** | GraphTrack + WikiTrack → `_tech_graph` · `coding_wiki` |
| **Constrain** | StandardsTrack + IDETrack → `standards/` · `.cursor/rules` |
| **Verify** | VerifyTrack → `ci/` · `gate-check` · `test_strategy` |
| **Orchestrate** | ProcessTrack · Epic/00 帽（Extended · 工作区 POINTER） |

公众稿使用 **ICV 三支柱**；Orchestrate 为产品化命名 · 见 [`methodology/product/README.md`](./methodology/product/README.md)。

---

## 3. 与 MCP / 国标

| 参照 | 关系 |
| --- | --- |
| **MCP** | 不替代；v1.0 后可预留只读 ctx（C1 · 后置） |
| **信通院 / AIIA** | SDD + 人工闸 + 可追溯制品 · 对齐「构建与开发 / 可靠性」方向 |
| **LangChain 等** | 纪律层 vs 编排 SDK · 见 DESIGN_ONTOLOGY §7.5 |

---

## 4. v1.0 增量（Q4 stable · 非 A3 阻塞）

- B2 量化段落写入 README
- `harness ontology-check` CLI
- ETCLOVG 映射页扩展为完整对照表

---

## 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-06-15 | A3 首版摘要 · 详评 POINTER 治理仓 |
