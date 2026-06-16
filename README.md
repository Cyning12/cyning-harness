# cyning-harness

```bash
npx @cyning/harness@latest init --preset harness-only --ide cursor,agents
npx @cyning/harness upgrade && npx @cyning/harness check
```

可 clone、可嵌入业务仓库的 **Harness 纪律包**（无业务代码，无内置 LLM）· **MIT 开源**。

> **设计哲学**：用 **本体论** 定义「Track / Hat / Gate / Artifact」与 **ICVO 四支柱**（Inform · Constrain · Verify · Orchestrate），把 AI Coding 的上下文、规则与验收变成 **可同步、可审计、不覆盖用户 task** 的仓库真值。  
> **公众连载** 使用 **ICV 三支柱**（SDD 层）；**Orchestrate** 是对卷三过程编排的 **产品化命名**，见 [`docs/methodology/product/README.md`](docs/methodology/product/README.md) · [`docs/methodology/AUDIT_doc_consistency_2026-06-15_zh.md`](docs/methodology/AUDIT_doc_consistency_2026-06-15_zh.md)。  
> **方法论总指引**：[`docs/methodology/README.md`](docs/methodology/README.md) · 本体 [`docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md`](docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md)

---

## 是什么

**cyning-harness** 提供在任意软件项目中落地 AI 辅助研发纪律所需的 **模板、读序与过程约定**：

| 轨 | 目录 | 作用 |
|----|------|------|
| 图谱 | `graph/` | 架构地图模板（`docs/_tech_graph` 嵌入用） |
| Wiki | `coding_wiki/` | LLM 读序（stable / context / volatile） |
| 规范 | `standards/` | L1/L2 编码规范模板 |
| 过程 | `harness/` | task、prompts、invoke 约定 |
| 验证 | `ci/` | CI 门禁样例 |
| IDE | `ide/` | Cursor / Claude Code / AGENTS 入口片段 |
| 向导 | `wizard/` | 安装与勾选式初始化 |

**不提供：** 业务实现代码、LLM API、Agent 编排 SDK（与 LangChain 等互补 · 见本体 §7.5）。

**边界（S2）：** sync **不覆盖** `docs/tasks/`、`reviews/`、`invokes/by-task/` — 纪律层与业务数据分离。

---

## Quick Start（npx · v0.3+）

> 顶部三行即最小接入。须在 **目标业务仓根** 执行（勿在本产品仓根跑 `npx`，会报 `harness: command not found`）。

**维护者 · 在本仓库根验证 CLI**（npm 不会为「当前包」链接 `bin`，`npx` 会报 `harness: command not found`）：

```bash
npm run harness -- check --target /tmp/foo
# 或
node bin/harness.js check --target /tmp/foo
```

**维护者 / 离线（clone 路径）：**

```bash
git clone git@github.com:Cyning12/cyning-harness.git && cd cyning-harness
/path/to/cyning-harness/wizard/install.sh --target /path/to/your-repo --preset harness-only --ide cursor,agents
/path/to/cyning-harness/wizard/harness-sync.sh apply --target /path/to/your-repo
```

**P0 金样（10→22→30）：** [`examples/demo_checkout/README.md`](examples/demo_checkout/README.md) · [`docs/methodology/execution/P0_V0.2_GAP.md`](docs/methodology/execution/P0_V0.2_GAP.md)

**Kimi Code fork：** `--preset oss-fork-meta` 或 [`wizard/bootstrap-oss-fork-meta.sh`](wizard/bootstrap-oss-fork-meta.sh) · 过程轨不进上游 PR。

---

## 典型工作流

```text
install / adopt  →  harness-sync plan/apply  →  @ task + prompts（10→22→30）
                      ↑ 产品包 git pull 后 upgrade.sh
30 前：gate-check.sh  ·  HG-AUDIT-R1 = approved
```

1. 阅读 [`docs/ONBOARDING.md`](docs/ONBOARDING.md)  
2. [`wizard/install.sh`](wizard/install.sh) 或 [`adopt-existing.sh`](wizard/adopt-existing.sh)  
3. 产品包更新：[`wizard/upgrade.sh`](wizard/upgrade.sh) 或 [`harness-sync.sh`](wizard/harness-sync.sh) `apply`  
4. IDE `@` task + `docs/harness/prompts/`；30 前 [`gate-check.sh`](wizard/gate-check.sh)  

---

## ICVO 机械审计（v1.0+）

`harness audit` 在 30 执行前机械检查 ICVO 公理子集：

```bash
npx @cyning/harness audit --target /path/to/your-repo --task docs/tasks/active/task_xxx.md
npx @cyning/harness upgrade --gate-check       # upgrade 前自动 audit
```

- **D3**：`gate-check.sh` 真值唯一来源，HG-AUDIT-R1 / HG-GRAPH-MODULES pending 时拒 30  
- **D5**：`test_strategy=required` 任务须声明测试路径或 CI 引用  
- **S5**：dirty 工作区 warn，apply 须 `--force` 明示  

Inform 图谱闸：`wizard/gate-check.sh --graph --target /path/to/your-repo`  
Invoke 索引：`wizard/harness-sync.sh --index --target /path/to/your-repo`（不覆盖 S2 域）

详见 [`docs/ONBOARDING.md`](docs/ONBOARDING.md) §2.2。

---

## 试点证据（B2）

> **冻结状态**：2026-06-16 · 策略 A（3 字段未系统采集，标 N/A，不编造）  
> **完整证据链**：[`docs/methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md`](docs/methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md)

**真实试点 retro（kimi-code-meta preset · 2026-06-10 → 2026-06-15）**

| 指标 | 值 | 说明 |
| --- | --- | --- |
| `sample_n` | **6** | harness-only dogfood、文档修复、agent-core 改码等 |
| `upstream_pr_d6_clean` | **3/3 = 100%** | D6 双分支过程轨零泄漏（#622 / #630 / #708） |
| `ci_first_green_rate` | **3/3 = 100%** | 改码 task 首次 CI 绿（样本极小，禁止外推胜率） |
| `gate_block_count` | **3+** | 30 前 gate-check 拦截样例已记录 |
| `failure_report_count` | **1** | #94 越闸事件 → 修复 GATE_VERIFY 协议 |
| `audit_reject_rate` | **N/A** | 策略 A：样本期未系统采集 22 R1 内容阻塞 |
| `audit_rounds_mean` | **N/A** | 策略 A：同 `audit_reject_rate` |
| `wizard_adoption_days` | **N/A** | 策略 A：install 日期未落盘，无法准确计算 |

**SDD-Compliance micro-bench（可机械复现 · 不测 LLM 解题）**

| 项 | 值 |
| --- | --- |
| 覆盖 | S1–S4（D2 HumanGate · D3 gate-check · S2 sync 域） |
| 结果 | **4/4 = 100%** |
| 运行 | `./wizard/compliance-bench.sh --all` |

**免责声明**：本表为 **小样本机制证据**，非胜率承诺；Part A 与 Terminal-Bench / SWE-bench **互补、不对标**。

---

## 与通用 Agent 框架的差异（摘要）

| 维度 | cyning-harness | LangChain / Semantic Kernel 等 |
| --- | --- | --- |
| 定位 | **纪律包** · SDD 过程审计 | Agent 编排 / 工具链 SDK |
| 过程落盘 | AuditReview · InvokeSnapshot · HumanGate | 通常无一等过程制品 |
| 同步边界 | S2 · 不覆盖用户 Task | 不适用 |

完整对比：[`DESIGN_ONTOLOGY` §7.5](docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md)。

---

## 仓库结构

```text
cyning-harness/
├── README.md
├── docs/
│   ├── README.md                  # 文档索引
│   ├── methodology/               # ★ 方法论总指引
│   │   ├── README.md
│   │   ├── DOCUMENT_MAP_v1_zh.md
│   │   ├── product/               # 产品设计本体
│   │   ├── graph/                 # HGM
│   │   ├── execution/             # P0 差距
│   │   └── pointers/              # 工作区 / 治理 POINTER
│   ├── ARCHITECTURE.md
│   └── ONBOARDING.md
├── examples/demo_checkout/
├── wizard/ · harness/ · graph/ …
└── golden/
```

---

## 版本与状态

| 项 | 值 |
|----|-----|
| 当前 | **v0.4.0** — A3 public push 准备 · ontology.yaml · MIT · 脱敏金样 |
| 上一档 | v0.3.x — npx CLI · Starter 四帽 · manifest · S5 |
| 许可 | **MIT** · [`LICENSE`](LICENSE) · 战略 POINTER 见 [`methodology/pointers/STRATEGY_ONTOLOGY_v1_zh.md`](docs/methodology/pointers/STRATEGY_ONTOLOGY_v1_zh.md) |

---

## 文档索引

| 优先级 | 文档 |
| --- | --- |
| **总指引** | [`methodology/README.md`](docs/methodology/README.md) · [关系图](docs/methodology/DOCUMENT_MAP_v1_zh.md) · [路线 ROADMAP](docs/methodology/ROADMAP_v1_zh.md) |
| **本体** | [DESIGN_ONTOLOGY v1.2](docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md) |
| **落地** | [P0 差距](docs/methodology/execution/P0_V0.2_GAP.md) · [金样验收](examples/demo_checkout/ACCEPTANCE.md) · [ETCLOVG 映射](docs/ETCLOVG_MAPPING_v1_zh.md) |
| **远期** | [HGM 草案](docs/methodology/graph/HARNESS_GRAPH_MODEL_design_v0_zh.md) |
| **接入** | [ONBOARDING](docs/ONBOARDING.md) · [ARCHITECTURE](docs/ARCHITECTURE.md) |

根目录 `docs/DESIGN_ONTOLOGY_v1_zh.md` 等为 **POINTER** · 兼容旧链接。

---

## 变更与 Agent

- [CHANGELOG.md](CHANGELOG.md)
- [AGENTS.md](AGENTS.md)
