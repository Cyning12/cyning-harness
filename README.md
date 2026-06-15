# cyning-harness

可 clone、可嵌入业务仓库的 **Harness 纪律包**（无业务代码，无内置 LLM）。

> **设计哲学**：用 **本体论** 定义「Track / Hat / Gate / Artifact」与 **ICVO 四支柱**（Inform · Constrain · Verify · Orchestrate），把 AI Coding 的上下文、规则与验收变成 **可同步、可审计、不覆盖用户 task** 的仓库真值。详见 [`docs/DESIGN_ONTOLOGY_v1_zh.md`](docs/DESIGN_ONTOLOGY_v1_zh.md)。

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

## Quick Start（三行 + 金样）

```bash
git clone git@github.com:Cyning12/cyning-harness.git && cd cyning-harness
/path/to/cyning-harness/wizard/install.sh --target /path/to/your-repo --preset harness-only --ide cursor,agents
/path/to/cyning-harness/wizard/harness-sync.sh apply --target /path/to/your-repo
```

**P0 金样（10→22→30）：** [`examples/demo_checkout/README.md`](examples/demo_checkout/README.md) · 差距清单 [`docs/P0_V0.2_GAP.md`](docs/P0_V0.2_GAP.md)

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

## 与通用 Agent 框架的差异（摘要）

| 维度 | cyning-harness | LangChain / Semantic Kernel 等 |
| --- | --- | --- |
| 定位 | **纪律包** · SDD 过程审计 | Agent 编排 / 工具链 SDK |
| 过程落盘 | AuditReview · InvokeSnapshot · HumanGate | 通常无一等过程制品 |
| 同步边界 | S2 · 不覆盖用户 Task | 不适用 |

完整对比：[`DESIGN_ONTOLOGY_v1_zh.md` §7.5](docs/DESIGN_ONTOLOGY_v1_zh.md)。

---

## 仓库结构

```text
cyning-harness/
├── README.md
├── docs/
│   ├── DESIGN_ONTOLOGY_v1_zh.md   # 产品设计本体 v1.2
│   ├── P0_V0.2_GAP.md             # P0 差距与演示命令
│   ├── ARCHITECTURE.md
│   └── ONBOARDING.md
├── examples/demo_checkout/        # P0 金样 10→22→30
├── wizard/
├── harness/                       # prompts · templates · invokes
├── graph/ · coding_wiki/ · standards/ · ci/ · ide/
└── golden/                        # 外部金样 pointer
```

---

## 版本与状态

| 项 | 值 |
|----|-----|
| 当前 | **v0.2.1** — P0 金样与本体 v1.2 文档 |
| 下一档 | **v0.3** — npx CLI · manifest · S5 git-clean |
| 许可 | 私有；MIT public push 规划见工作区 STRATEGY_ONTOLOGY |

---

## 文档索引

- [产品设计本体 v1.2](docs/DESIGN_ONTOLOGY_v1_zh.md)
- [P0 差距清单](docs/P0_V0.2_GAP.md)
- [P0 金样验收](examples/demo_checkout/ACCEPTANCE.md)
- [架构说明](docs/ARCHITECTURE.md)
- [接入指南](docs/ONBOARDING.md)
- [变更记录](CHANGELOG.md)
- [Agent 入口](AGENTS.md)
