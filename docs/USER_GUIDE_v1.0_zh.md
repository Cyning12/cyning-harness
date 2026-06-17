# cyning-harness v2.0 · 使用手册

> **读者**：要在 **自己的业务仓库** 里落地 AI 辅助研发纪律的开发者（非 cyning-harness 维护者）。  
> **版本**：[`@cyning/harness@2.0.0`](https://www.npmjs.com/package/@cyning/harness) · MIT  
> **仓库**：<https://github.com/Cyning12/cyning-harness>  
> **更短入口**：[`README.md`](../README.md) Quick Start · [`ONBOARDING.md`](./ONBOARDING.md) 接入细节  
> **Release**：[`RELEASE_v1.0.1.md`](./RELEASE_v1.0.1.md) · [`CHANGELOG.md`](../CHANGELOG.md)

---

## 1. 这是什么 · 不是什么

**cyning-harness** 是一套可嵌入任意 Git 仓库的 **SDD 过程纪律包**：

- 提供：task 模板、审核 prompt、人工闸约定、同步脚本、CI 样例、架构图谱模板
- **不提供**：业务代码、LLM API、Agent 编排 SDK（与 LangChain 等 **互补**）

**v1.0 解决什么问题**：陌生人不仅能在空仓库 `npx init`，还能用 **`audit` / `gate-check` / `sync --index`** 机械检查「Inform / Constrain / Verify / Orchestrate（ICVO）」是否在仓库里就绪，而不是只靠口头约定。

---

## 2. 前置条件

| 项 | 要求 |
| --- | --- |
| Git | 目标业务仓已是 Git 仓库（或 `git init` 后使用） |
| Node.js | 能运行 `npx`（仅安装/升级 CLI 时需要） |
| IDE | 推荐带 Agent 的编辑器（Cursor、Claude Code 等） |
| 工程习惯 | 至少有 lint、test 或 build 之一（便于对齐 `ci/` 样例） |

---

## 3. 五分钟上手（推荐路径）

在 **你的业务仓库根目录** 执行（**不要**在 clone 下来的 `cyning-harness` 产品仓根跑 `npx`，会报 `harness: command not found`）：

```bash
# 1. 首次安装（钉 preset 与 IDE 入口）
npx @cyning/harness@1.0.1 init --preset harness-only --ide cursor,agents --yes

# 2. 30 前验证（gate-check + audit D5 + S5 warn）
npx @cyning/harness verify --target . --task docs/tasks/active/task_xxx.md

# 3. 产品包升级时（拉取模板更新）
npx @cyning/harness upgrade --yes
```

**安装后你会得到**（典型）：

```text
your-repo/
├── .cyning-harness/
│   ├── manifest.json      # 钉住的 harness 版本与 preset
│   └── profile.json       # 同步轨道配置
├── docs/
│   ├── tasks/active/      # 你的 task 单（Agent 不覆盖）
│   ├── tasks/done/        # 关账归档
│   ├── harness/prompts/   # Starter 四帽 10/22/30/40
│   ├── harness/invokes/   # 执行快照约定
│   ├── _tech_graph/       # 架构图谱（按需填写）
│   ├── coding_wiki/       # LLM 读序
│   └── standards/         # 编码规范模板
└── AGENTS.md 等 IDE 入口片段
```

---

## 4. 典型 SDD 工作流（Starter 四帽）

```text
10 需求/任务分析  →  22 任务审核  →  gate-check  →  30 执行编码  →  40 自检  →  关账
     ↑                    ↑              ↑
  prompts/10        落盘 reviews/    HG-AUDIT-R1 = approved
```

### 4.1 新建一张 task

1. 复制 [`docs/harness/templates/`](../harness/templates/) 或金样 [`task_demo_p0_golden_v1.md`](../examples/demo_checkout/task_demo_p0_golden_v1.md) 到 `docs/tasks/active/task_xxx.md`
2. 填写：背景、范围、验收标准、`test_strategy`（`required` / `recommended` / `not_applicable`）
3. 在 task 表填写 **人工闸**（至少 `HG-TASK-DRAFT`、`HG-AUDIT-R1`）

### 4.2 在 IDE 里执行

1. `@` 你的 task 文件 + `@docs/harness/prompts/10-requirements.md` → 产出需求/范围（帽说明见 [`harness/prompts/README.md`](../harness/prompts/README.md)）
2. `@` [`22-task-audit.md`](../harness/prompts/22-task-audit.md) → 审核员落盘 `docs/harness/reviews/` · 维护者签 **`HG-AUDIT-R1 = approved`**
3. **30 之前** 跑 gate-check（见 §5）
4. `@` [`30-execute-code.md`](../harness/prompts/30-execute-code.md) → 改代码
5. `@` [`40-self-check.md`](../harness/prompts/40-self-check.md) → 命令证据 · 回填 task
6. 关账：`git mv` task → `docs/tasks/done/<domain>/`（见 [`ONBOARDING.md`](./ONBOARDING.md) §6 · [`FRAGMENT_task_domain_infer`](../harness/templates/FRAGMENT_task_domain_infer_v1_zh.md)）

### 4.3 练手金样（零风险）

不碰生产仓库时，在 `/tmp` 跑通一遍：

```bash
mkdir -p /tmp/harness-demo && cd /tmp/harness-demo && git init -q
npx @cyning/harness@1.0.1 init --preset harness-only --ide cursor,agents --yes
# 30 前验证：npx @cyning/harness verify --target . --task docs/tasks/active/task_demo_p0_golden_v1.md
# 金样 task（二选一）：
# · 已 clone 产品仓：cp /path/to/cyning-harness/examples/demo_checkout/task_demo_p0_golden_v1.md docs/tasks/active/
# · 仅 npx：从 GitHub 浏览 examples/demo_checkout/ 复制 task 内容
# 逐步验收：examples/demo_checkout/ACCEPTANCE.md（见下方链接）
```

分步勾选：[`examples/demo_checkout/README.md`](../examples/demo_checkout/README.md) · [`ACCEPTANCE.md`](../examples/demo_checkout/ACCEPTANCE.md) · 差距说明 [`P0_V0.2_GAP.md`](./methodology/execution/P0_V0.2_GAP.md)

---

## 5. 人工闸与 gate-check（30 前必做）

**原则**：Agent 可以写 task 和 review，**人工闸只有维护者能签**。

```bash
# 30 前聚合验证（gate-check + audit D5 + S5 warn + 可选 --graph）
npx @cyning/harness verify --target . --task docs/tasks/active/task_xxx.md

# 仅人工闸
npx @cyning/harness gate-check --target . --task docs/tasks/active/task_xxx.md
npx @cyning/harness gate-check --graph --target .    # Inform 图谱闸

# 等价底层脚本（离线 clone 产品仓路径 · 见 wizard/README）
/path/to/cyning-harness/wizard/gate-check.sh --target .
```

脚本说明：[`wizard/README.md`](../wizard/README.md) · [`wizard/gate-check.sh`](../wizard/gate-check.sh)

| 闸 ID | 含义 | 30 影响 |
| --- | --- | --- |
| `HG-AUDIT-R1` | 22 审核通过 | **非 approved → 拒 30** |
| `HG-TASK-DRAFT` | task 初稿维护者签 | pending 且 blocks 含 30 → 拒 30 |
| `HG-GRAPH-MODULES` | 架构模块表人签 | pending → 拒改码 30 |
| `HG-RELEASE` | 发版闸（产品仓） | 一般业务仓不涉及 |

**Inform 图谱闸（v1.0）**：改码类 task 前，确保 `docs/_tech_graph/` 模块表已维护者签 `HG-GRAPH-MODULES = approved`。存量大仓可按 [`ONBOARDING.md`](./ONBOARDING.md) §3 选 S0–S3 档位，**不必一次画完所有 Mermaid**。

---

## 6. v1.0 CLI 命令速查

| 命令 | 用途 |
| --- | --- |
| `npx @cyning/harness init` | 首次安装模板与 manifest（可选 `--with-scripts`） |
| `npx @cyning/harness upgrade` | 同步产品包更新（可加 `--gate-check` 先 audit） |
| `npx @cyning/harness check` | 检查是否有新版本 |
| `npx @cyning/harness verify` | 30 前聚合：gate-check + audit D5 + S5 warn + 可选 `--graph` |
| `npx @cyning/harness gate-check` | 仅人工闸（`--graph` / `--json`） |
| `npx @cyning/harness audit` | ICVO 机械审计（D3/D5/S5） |
| `npx @cyning/harness sync index` | 生成 `.cyning-harness/invoke_index.json` |
| [`harness-sync.sh`](../wizard/harness-sync.sh) `plan/apply` | 预览/应用模板同步 |

**ICVO audit 检查什么**：

| 公理 | 行为 |
| --- | --- |
| **D3** | 30 前人闸 · 同 gate-check |
| **D5** | `test_strategy=required` 须有测试路径或 CI 引用 |
| **S5** | 工作区 dirty 时 warn；`sync apply` 须 `--force` 明示 |

Audit **不替代** 维护者判断；22 内容质量仍须人读 review。详见 [`ONBOARDING.md`](./ONBOARDING.md) §2.2。

### 6.1 SDD-Compliance bench（维护者 · 可选）

> **业务仓日常不必跑**；用于验证 `gate-check` / `sync` 公理行为，或对照 README「试点证据」中的 bench 数字。

仅在 **clone 下来的 cyning-harness 产品仓根** 执行：

```bash
cd /path/to/cyning-harness
./wizard/compliance-bench.sh --all          # 逐项解释 + 摘要（推荐人工看）
./wizard/compliance-bench.sh --quiet --all  # stdout 仅合规率数字；说明在 stderr
```

| 输出 | 含义 |
| --- | --- |
| **`100`** | S1–S4 四个合成场景全 PASS · **不是** LLM 解题分数 |
| **`< 100`** | 有场景 FAIL · 见 `--all` 输出或 stderr 摘要表 |

场景与公理解读：[`examples/compliance_bench/README.md`](../examples/compliance_bench/README.md) · 脚本 [`wizard/compliance-bench.sh`](../wizard/compliance-bench.sh)

---

## 7. 同步边界（重要 · S2）

`harness-sync` **不会覆盖** 你的业务数据：

- `docs/tasks/**`
- `docs/harness/reviews/**`
- `docs/harness/invokes/by-task/**`（按 task 域的执行快照）

纪律层（prompts 模板、wizard 脚本引用）与业务 task **分离**。升级产品包前建议：

```bash
git status          # 应干净，或知晓 S5 warn
npx @cyning/harness upgrade --yes
```

---

## 8. Preset 怎么选

| preset | 适合 |
| --- | --- |
| **`harness-only`**（默认） | 任意栈 · 只要 SDD 过程轨 + IDE 入口 |
| `fullstack-node-py` | Node 前端 + Python 后端全栈五轨 |
| `oss-fork-meta` | 个人 OSS fork · 过程轨与 upstream 双分支（见 [`examples/oss-fork/README.md`](../examples/oss-fork/README.md)） |

交互式问卷：`wizard/install.sh`（离线 clone 路径）。

---

## 9. 离线 / 无 npx 环境

```bash
git clone https://github.com/Cyning12/cyning-harness.git
cd your-project
/path/to/cyning-harness/wizard/install.sh --target . --preset harness-only --ide cursor,agents
/path/to/cyning-harness/wizard/harness-sync.sh apply --target .
```

维护者在 **产品仓根** 验证 CLI：

```bash
npm run harness -- check --target /tmp/foo
# 或 node bin/harness.js audit --target /path/to/your-repo
```

---

## 10. Inform-YAML 图谱编辑源（v1.1+）

从 `@cyning/harness@1.1.0` 起，业务仓可选择用 **`docs/_tech_graph/*.graph.yaml`** 作为 Inform 架构图谱的编辑源，再编译为 `.md`（人类可读）与 `graph.json`（机器可读）。

### 10.1 三轨边界

| 轨 | 文件 | 用途 | 版本 |
| --- | --- | --- | --- |
| **MD 人类轨** | `docs/_tech_graph/*.md` | 代码审阅、README 引用、Mermaid 渲染 | v1.0+ |
| **YAML 编辑源** | `docs/_tech_graph/*.graph.yaml` | 结构化编辑、diff、CI 校验 | **v1.1+** |
| **HGM 过程轨** | `.cyning-harness/events/*.jsonl` | Task / Gate / Review 实例与事件史 | **v2.0+** |

**原则**：YAML 为 Inform 编辑源，HGM 为过程事件图；YAML **不替代** task/review 真值，HGM **不替代** YAML/MD Inform 正文。

### 10.2 最小工作流

```bash
# 1. 在业务仓编辑 docs/_tech_graph/00_main.graph.yaml
# 2. 编译为 Markdown（人类可读）
npx @cyning/harness graph yaml compile --graph-id 00_main --input docs/_tech_graph

# 3. 校验 YAML 与 graph.json 切片是否一致
npx @cyning/harness graph yaml check --graph-id 00_main --input docs/_tech_graph

# 4. 一次性编译/校验全部 *.graph.yaml
npx @cyning/harness graph yaml compile --all --input docs/_tech_graph
npx @cyning/harness graph yaml check --all --input docs/_tech_graph
```

### 10.3 schema 与迁移

- **产品 schema**：[`schema/inform_graph.v3.schema.json`](../../schema/inform_graph.v3.schema.json)
- **迁移对照表**：[`docs/methodology/graph/INFORM_YAML_MIGRATION_v1_zh.md`](./methodology/graph/INFORM_YAML_MIGRATION_v1_zh.md)
- **试点真值**：Ink 后端 `ai-ink-brain-api-python/docs/_tech_graph/*.graph.yaml`

### 10.4 与 gate-check --graph 的关系

`gate-check --graph` 语义不变：仍扫描 `docs/_tech_graph/` 下所有模块/流程文件，输出 `HG-GRAPH-MODULES` 状态摘要。新增 `.graph.yaml` 文件会 **友好列出**，不改变通过/失败规则。

### 10.5 金样

`examples/demo_checkout/00_main.graph.yaml` 提供零风险 Inform-YAML 切片，可对照其生成的 `00_main.md` 与 `graph.json`。

---

## 11. 局限与诚实边界（v1.1）

| 项 | 说明 |
| --- | --- |
| 不是胜率工具 | [`README` 试点证据 B2](../README.md) · 完整表 [`PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md) · **小样本机制证据**，不可外推 |
| bench `100` | [SDD-Compliance](../examples/compliance_bench/README.md) 四场景合规率 · 见上文 §6.1 |
| Extended 帽 | 00/50/链式 PROMPT 不在 Starter 默认包 · 见 [`harness/prompts/README.md`](../harness/prompts/README.md) |
| Inform-YAML | **v1.1+** · 可选编辑源 · 须 `graph yaml check` 与 `graph.json` 一致 |
| HGM / 图数据库 | **v2.0+ 已实现** `graph ingest|snapshot|axioms` · 本地 JSONL + snapshot；Neo4j / 远端同步 **仍提案** |
| Agent-shell | 研究轨 #9，非 npm 功能 |
| rejected→draft | bench S5 场景 v1 未纳入；gate-check 对非 approved 拒 30 |

---

## 12. 常见问题

**Q：Harness 会调用我的 LLM 吗？**  
A：不会。LLM 在你使用的 IDE 里；Harness 只提供文件、脚本与约定。

**Q：必须用完 10→22→30→40 才能提交代码吗？**  
A：团队自定。Starter 设计是 **改码前 22 审核 + gate-check**；小修可标 `test_strategy=not_applicable` 并写理由。

**Q：和 `.cursor/rules` 什么关系？**  
A：`init --ide cursor` 会生成入口片段；Harness task + prompts 是 **任务级 SDD**，rules 是 **编辑器级约束**，可同时用。

**Q：升级后 task 会被覆盖吗？**  
A：不会（S2 域）。若 prompts 模板有更新，apply 会更新 **模板侧**，不删你的 active task。

**Q：如何编辑 Inform 架构图？**  
A：v1.1+ 可选 `docs/_tech_graph/*.graph.yaml` 作为编辑源，运行 `npx @cyning/harness graph yaml compile|check` 生成 MD / 校验 graph.json。

**Q：HGM 与 Inform-YAML 是什么关系？**  
A：Inform-YAML 是 **架构图谱** 的编辑源；HGM（v2.0+）是 **过程协作** 的事件图。二者并列，HGM 通过 `InformArtifact` 节点引用 Inform 产物，但不覆盖其正文。

**Q：如何贡献或报 issue？**  
A：GitHub [Cyning12/cyning-harness](https://github.com/Cyning12/cyning-harness) · MIT。

---

## 13. HGM 过程轨（v2.0+）

Harness Graph Model（HGM）把 task、gate、review、invoke、sync 等过程实例变成 **append-only 事件流** 与 **可重放图快照**，用于机械检查 SDD 公理。

### 13.1 事件文件

HGM 事件写入 `.cyning-harness/events/YYYY-MM.jsonl`，修正 = 追加 `CorrectionEvent`，**禁止删改历史**。

### 13.2 CLI

```bash
# 扫描业务仓 → 追加事件（幂等）
npx @cyning/harness graph ingest --target /path/to/your-repo

# 事件重放 → .cyning-harness/graph/snapshot.json
npx @cyning/harness graph snapshot --target /path/to/your-repo

# 公理检查（D2 · D3 · S2 · rejected→draft）
npx @cyning/harness graph axioms check --target /path/to/your-repo
npx @cyning/harness graph axioms check --target /path/to/your-repo --json
```

### 13.3 与 Inform-YAML 的接口

- `InformArtifact` 节点 ID：`inform:{repo_rel_path}`
- Task → InformArtifact 边：`MUST_READ`
- HGM **不存储** Inform 正文，只存路径指针与 schema 版本

### 13.4 局限

- v2.0 默认本地 JSONL + snapshot；**不含** Neo4j / SQLite / 远端同步
- 多仓聚合、时光机重建任意时点图：v2.1+ 提案

---

## 14. 进一步阅读

| 优先级 | 文档 |
| --- | --- |
| **本手册** | 你正在读 · 对外入口 [`docs/README.md`](./README.md) |
| **接入** | [`ONBOARDING.md`](./ONBOARDING.md) · [`wizard/README.md`](../wizard/README.md) · [`wizard/ONBOARDING_wizard_v1_zh.md`](../wizard/ONBOARDING_wizard_v1_zh.md) |
| **练手** | [`demo_checkout/README.md`](../examples/demo_checkout/README.md) · [`ACCEPTANCE.md`](../examples/demo_checkout/ACCEPTANCE.md) |
| **合规 bench** | [`examples/compliance_bench/README.md`](../examples/compliance_bench/README.md) |
| **理论** | [`methodology/README.md`](./methodology/README.md) · [`DESIGN_ONTOLOGY_v1_zh.md`](./methodology/product/DESIGN_ONTOLOGY_v1_zh.md) |
| **路线** | [`methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md) |
| **试点证据** | [`PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md) |
| **ETCLOVG** | [`ETCLOVG_MAPPING_v1_zh.md`](./ETCLOVG_MAPPING_v1_zh.md) |
| **架构** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| **变更** | [`CHANGELOG.md`](../CHANGELOG.md) · [`RELEASE_v1.0.0.md`](./RELEASE_v1.0.0.md) |

---

**修订记录**

| 日期 | 说明 |
| --- | --- |
| 2026-06-16 | v1.0 stable 首版使用手册 |
| 2026-06-16 | 补全相对链接 · §6.1 compliance-bench · §12 阅读索引 |
| 2026-06-16 | v1.0.1：verify / gate-check / sync index CLI · `--with-scripts` · QUICKREF |
| 2026-06-17 | v1.1.0：新增 §10 Inform-YAML · `graph yaml compile|check` · 三轨边界说明 |
| 2026-06-17 | v2.0.0：新增 §13 HGM 过程轨 · `graph ingest|snapshot|axioms` · InformArtifact 与 MUST_READ 边 |
