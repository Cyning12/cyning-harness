# HGM G1 · 维护者开放议题决策（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `confirmed` |
| **日期** | 2026-06-17 |
| **决策者** | 维护者 |
| **来源** | [`HGM_UPGRADE_OUTLINE_v1_zh.md`](./HGM_UPGRADE_OUTLINE_v1_zh.md) §10 开放问题 |
| **后继序列表** | [`POST_G1_SEQUENCE_v1_zh.md`](../../../../docs/harness/guides/POST_G1_SEQUENCE_v1_zh.md) |

---

## 0. 决策摘要

| # | 议题 | 决策 | 落地 |
| --- | --- | --- | --- |
| **Q1** | G1 axioms 是否含 Inform 模块闸（D4-a） | **是** · 纳入 axioms 最小集 | **G1.1** `@2.0.1` · `checkAxioms` 扩展 |
| **Q2** | v2.0 是否 optional pre-commit ingest | **是** · **可选**钩子 · 默认不强制 | **G1.1** · 示例 hook + 文档 |
| **Q3** | bench S5 与 HGM axioms 关系 | **语义对齐、实现分层**（见 §3） | G1.1 增 compliance S5 夹具 |
| **Q4** | agent 包形态 | **暂未选定** · 保留案例库（见 §4） | Track C 立项前 STRATEGY 一页 |
| Q5 | I-YAML schema 归谁 | **已闭合** · Y1 产品 canonical · 试点只读 | Y1 done |
| Q6 | agent 立项触发 | G1 **+ G1.1** dogfood 绿 + 维护者书面批 | 不变 |

---

## 1. Q1 · axioms 含 D4-a（Inform 模块闸）

### 决策

**G1.1 起**，`harness graph axioms check` 最小集 = **D2 + D3 + D4-a + rejected→draft + S2**（在 G1 已实现子集上 **增 D4-a**）。

### 定义真值

| 公理 | 含义 | 权威出处 |
| --- | --- | --- |
| **D4 / D4-a** | 改码 task 开工前 `HG-GRAPH-MODULES = approved` | [`DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) §5.3 **D4** · Onboarding [`GUIDANCE_m2_starter_onboarding_v1_zh.md`](../../../../docs/harness/guides/GUIDANCE_m2_starter_onboarding_v1_zh.md) §2 **D4-a** |
| **Inform 联结** | Task --mustRead--> InformArtifact（`01_struct` / `_tech_graph`） | [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md) §2 公理表 **D4-a** 行 |

### G1 v2.0.0 现状（2026-06-17）

[`lib/graph-hgm.js`](../../../lib/graph-hgm.js) `checkAxioms()` 已实现：**D2 · D3 · rejected→draft · S2** · **未**含 D4-a。

### G1.1 交付（草案）

- 扫描 task：`HG-GRAPH-MODULES` pending/rejected 且 task 已 `in_progress` → violation
- 可选：MUST_READ 边缺失 `01_struct.md` 或模块表 → warn
- pytest 可失败用例 + 更新 USER_GUIDE §graph axioms

---

## 2. Q2 · optional pre-commit ingest

### 决策

**提供 optional pre-commit ingest** · **不**作为 npm 默认安装步骤 · **不**替代 CI。

### 形态（G1.1 草案）

```text
.cyning-harness/hooks/pre-commit.sample   ← 产品仓示例
  └─ 调用：npx @cyning/harness graph ingest --from-repo . --incremental
  └─ 文档：USER_GUIDE「可选 · Git hooks」节
  └─ 安装：维护者手动 cp 或 `--install-hooks`（若实现）
```

### 纪律

| 项 | 说明 |
| --- | --- |
| 默认 | **不**在 `npx harness init` 自动安装 hook |
| 失败 | ingest 非 0 → hook 可配置 warn vs block（示例用 warn） |
| S2 | hook **不得**改写 task/review 正文 · 只 append events |

---

## 3. Q3 · bench S5 与 HGM axioms：定义在哪、有何区别

### 3.1 命名消歧（重要）

| 名称 | 领域 | 含义 | **不是** |
| --- | --- | --- | --- |
| **compliance-bench `S5`** | SDD micro-bench 场景 ID | **rejected→draft** 夹具 | 本体 **S5** |
| **本体公理 `S5`** | 同步公理 | sync/apply 前 **Git 工作区干净** | bench 场景 |
| **HGM `rejected→draft`** | 过程公理 | gate rejected 后 task 须回 **draft** | 本体 S5 |

下文 **bench S5** 均指 compliance-bench 场景 · 非本体 S5。

### 3.2 定义位置对照

| 机制 | 定义 / 实现位置 | 测什么 | 输入 |
| --- | --- | --- | --- |
| **compliance-bench S1–S4** | [`examples/compliance_bench/README.md`](../../../examples/compliance_bench/README.md) · [`wizard/compliance-bench.sh`](../../../wizard/compliance-bench.sh) | **静态夹具**上 `gate-check.sh` / sync 行为 | 合成 mini 仓 `S1_r1_pending/` 等 |
| **compliance-bench S5**（**待 G1.1**） | 同上 · B8 原 defer | rejected 后 gate-check 警告 + task 应 draft | 夹具 `S5_rejected_draft/`（待建） |
| **HGM `graph axioms check`** | [`lib/graph-hgm.js`](../../../lib/graph-hgm.js) `checkAxioms()` · design v0 §2 | **事件重放 snapshot** 上的公理违反 | `.cyning-harness/events/*.jsonl` |
| **gate-check（运行时）** | [`wizard/gate-check.sh`](../../../wizard/gate-check.sh) · 本体 §4.2 | 当前 task 闸表 · 30 拒开工 | 真实业务仓 task md |
| **harness audit S5** | [`lib/audit.js`](../../../lib/audit.js) · A4 task | **Git clean** 再 sync | 工作区 git status |

### 3.3 区别（一句话）

```text
compliance-bench = 「给定假仓库，wizard 命令行为对不对」· 回归测试 · 无事件流
HGM axioms       = 「给定真实事件历史，投影图是否违反过程公理」· 审计 · 有时序
gate-check       = 「此刻能不能开 30」· 运行时闸
```

### 3.4 为何要口径对齐（维护者决策 Q3）

| 层 | 关系 |
| --- | --- |
| **语义** | bench S5 与 HGM `rejected→draft` **同一规则** · 来自 [`DESIGN_ONTOLOGY`](../product/DESIGN_ONTOLOGY_v1_zh.md) §4.2 |
| **实现** | **故意分层** · bench 不读 jsonl · HGM 不跑 shell 夹具 |
| **G1.1** | 新增 S5 夹具 + 收紧 HGM rejected 检查（事件流精确匹配 draft 事件） |

### 3.5 当前 compliance-bench 覆盖

| 场景 | 公理 | G1 HGM axioms |
| --- | --- | --- |
| S1 pending→拒 30 | D2/D3 | D2 ✓ |
| S2 无 review | D2/D3 | （ingest 侧另查） |
| S3 Happy Path | D2/D3 | D3 ✓ |
| S4 sync 不碰 task | S2 | S2 ✓ |
| **S5 rejected→draft** | rejected→draft | rejected→draft ✓（待 bench 夹具） |
| **D4-a 模块闸** | D4 | **G1.1 增** |

---

## 4. Q4 · agent 包形态 · 案例库（待选）

维护者 **暂无单一偏好** · Track C 立项前从下列 **行业对照 + 本方可行形态** 中选 1–2 组合试点。

### 4.1 形态谱系

| ID | 形态 | 实际案例 | 优点 | 风险 |
| --- | --- | --- | --- | --- |
| **A** | **纪律 npm 包 + IDE/CLI**（现状） | **`@cyning/harness`** · Cursor rules · `npx harness gate-check` | 仓库真值 · 已 dogfood | 无内置 Chat · 依赖 Cursor/Kimi |
| **B** | **独立 Agent npm 包** | LangGraph `langgraph-cli` · OpenAI Agents SDK `@openai/agents` | 边界清晰 · 可 semver 独立 | 双包同步 · 用户装两个 |
| **C** | **Preset / Profile 扩展** | 现有 **`kimi-code-meta`** preset · OpenClaw **workspace skills** | 低迁移 · 复用 init/upgrade | 非通用 Agent 运行时 |
| **D** | **MCP Server 暴露 Harness** | Anthropic **MCP** 生态 · Cursor MCP tools | 工具化 ingest/query/gate-check | 需 host 进程 · 安全面 |
| **E** | **ExecutionShell 策略注入**（B9 轨） | Kimi **用户级 agent 配置** · Claude **Project Instructions** | 零 clone 演示 Orchestrate | Inform/Verify 弱 · H1 待证 |
| **F** | **GitHub Action / CI Agent** | `github-actions/agent` 类 · 本仓 **verify-tech-graph.yml** | Verify 强 · 无本地 UI | 非交互 · 非 Runtime |
| **G** | **Monorepo 子包** | OpenClaw `openclaw` 主包 + gateway 子模块 | 单 repo 版本锁 | 一人项目过重 |

### 4.2 本方已运行对照（非 hypothetic）

| 案例 | 路径 / 产品 | 与 Harness 关系 |
| --- | --- | --- |
| **repo-embedded（主路径）** | `ai-ink-brain-api-python` · `examples/demo_checkout` | 全 ICVO · gate-check + graph_query |
| **kimi-code-meta 试点** | 工作区 `kimi-code-meta/` · [`PILOT_kimi_code_fork_adoption_v1_zh.md`](../../../../docs/harness/guides/PILOT_kimi_code_fork_adoption_v1_zh.md) | B 轨证据 · preset + fork |
| **B9 shell-only（计划）** | [`task_cyning_harness_b9_agent_shell_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b9_agent_shell_v1.md) | E 轨实验 · G1.1 后 |
| **Hermes（只读对照）** | 工作区 `hermes-agent/` | Gateway + skills · **不**替代 Harness 签收 |
| **OpenClaw（只读对照）** | 工作区 `openclaw/` | workspace 注入 · sandbox |

### 4.3 维护者倾向（非最终决策 · 供立项讨论）

| 阶段 | 建议 |
| --- | --- |
| **短期** | 保持 **A** 主路径 · G1.1 把 HGM CLI 做稳 |
| **中期试点** | **C + E**：`@cyning/harness` preset + B9 shell findings · **不**先建重型 **G** |
| **若需 programmatic API** | 评估 **B** 小仓 `@cyning/harness-agent` re-export `graph ingest/axioms/gate-check` |
| **若需跨 IDE 工具** | 评估 **D** 薄 MCP：`harness_gate_check` · `harness_graph_query` 两个 tool |

**立项触发**：G1.1 dogfood 绿 + 书面批 Track C · 先写 **STRATEGY_agent_runtime_v1_zh.md** 一页再开 task。

---

## 5. 与 G1 v2.0.0 代码的关系

| 项 | G1 v2.0.0（当前） | G1.1 v2.0.1（拍板后继） |
| --- | --- | --- |
| events / ingest / snapshot | ✓ | 增量 hook |
| axioms | D2/D3/rejected/S2 | **+ D4-a** · rejected 精确化 |
| compliance-bench | S1–S4 | **+ S5** |
| pre-commit | 无 | **optional 示例** |
| agent 包 | 无 | Track C 立项 |

**不阻塞 G1 PR merge**：Q1/Q2/Q3 交付归 **G1.1** · 已在 G1 关账后序列表 P1。

---

## 6. 关联索引

| 类型 | 路径 |
| --- | --- |
| Post-G1 序列表 | [`POST_G1_SEQUENCE_v1_zh.md`](../../../../docs/harness/guides/POST_G1_SEQUENCE_v1_zh.md) |
| 本体公理 | [`DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) §5 |
| HGM design 公理表 | [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md) §2 |
| compliance-bench | [`examples/compliance_bench/README.md`](../../../examples/compliance_bench/README.md) |
| G1 task | [`task_cyning_harness_g1_hgm_v2_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_g1_hgm_v2_v1.md) |

---

## 7. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-17 | 维护者 Q1–Q4 拍板 · bench/HGM 消歧 · agent 案例库 |
