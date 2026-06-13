# cyning-harness

可 clone、可嵌入业务仓库的 **Harness 产品包**（无业务代码，无内置 LLM）。

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

**不提供：** 业务实现代码、LLM API、自研 Chat Runtime（后续版本在同仓扩展 CLI/Worker，见 `CHANGELOG.md`）。

---

## 快速开始

```bash
git clone git@github.com:Cyning12/cyning-harness.git
cd cyning-harness
```

1. 阅读 [`docs/ONBOARDING.md`](docs/ONBOARDING.md)  
2. **推荐** [`wizard/install.sh`](wizard/install.sh) 或存量 [`wizard/adopt-existing.sh`](wizard/adopt-existing.sh)  
3. 产品包 `git pull` 后：[`wizard/upgrade.sh`](wizard/upgrade.sh) 交互升级（或 [`harness-sync.sh`](wizard/harness-sync.sh) `apply`）  
4. 用自选 IDE `@` task + prompts；30 前可跑 [`wizard/gate-check.sh`](wizard/gate-check.sh)  

---

## 仓库结构

```text
cyning-harness/
├── README.md
├── AGENTS.md
├── CHANGELOG.md
├── docs/
│   ├── ARCHITECTURE.md
│   └── ONBOARDING.md
├── wizard/
├── graph/templates/
├── coding_wiki/templates/
├── standards/
├── harness/
│   ├── templates/
│   ├── prompts/
│   └── invokes/
├── ci/samples/
├── ide/adapters/
└── golden/              # 外部金样 pointer（仅链接说明，无业务代码）
```

详见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

---

## 版本与状态

| 项 | 值 |
|----|-----|
| 当前 | **v0.2.1** — done 分层索引（Hub · 薄 `_views` · 域推断 FRAGMENT · install 嵌入） |
| 上一档 | **v0.2.0** — D3 IDE 适配（CLAUDE/AGENTS fragment + install `--ide`） |
| 许可 | 私有；公开策略待定 |

---

## 文档索引

- [架构说明](docs/ARCHITECTURE.md)
- [接入指南](docs/ONBOARDING.md)
- [变更记录](CHANGELOG.md)
- [Agent 入口](AGENTS.md)
