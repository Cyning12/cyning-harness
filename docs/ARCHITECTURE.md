# 架构说明

## 1. 产品定位

**cyning-harness** 是可分发的 **Harness 嵌入包**：

- **输入**：开发者 clone 本仓，经 `wizard/` 选型
- **输出**：在用户业务仓中生成或复制 `docs/_tech_graph`、`docs/coding_wiki`、`docs/standards`、`docs/tasks`、`docs/harness` 等约定目录
- **执行壳**：用户自备 IDE 与 LLM（Cursor、Claude Code 等）；本仓 **不调用** LLM API

## 2. 五轨模型

```text
┌─────────────┐
│  graph/     │  L0 架构地图模板 · 模块表 · flow 增量
├─────────────┤
│ coding_wiki/│  L2 读序 · invoke 互链 · 抑制上下文膨胀
├─────────────┤
│ standards/  │  L1/L2 规范模板 · 按语言栈
├─────────────┤
│ harness/    │  task · prompts · invoke 过程轨
├─────────────┤
│ ci/         │  lint / test / build 样例
└─────────────┘
       ↑
   ide/ 适配层（rules · CLAUDE.md · AGENTS 指针）
   wizard/ 安装向导（勾选生成）
```

## 3. 与用户业务仓的关系

| 本仓路径 | 嵌入目标（用户仓，示例） |
|----------|-------------------------|
| `graph/templates/*` | `docs/_tech_graph/` |
| `coding_wiki/templates/*` | `docs/coding_wiki/` |
| `standards/*` | `docs/standards/` |
| `harness/templates/*` | `docs/tasks/`、`docs/harness/` |
| `ci/samples/*` | `.github/workflows/` 等 |
| `ide/adapters/*` | `.cursor/rules/`、`CLAUDE.md`、`AGENTS.md` |

**原则：** 单源模板在本仓；用户仓为 **运行实例**，自行维护增量。

## 4. 存量项目闸门（D4-a）

改码类 task（30 帽）开工前，用户仓须：

1. `docs/_tech_graph/01_struct.md` **模块边界表** 已填
2. 人工闸 `HG-GRAPH-MODULES` = **approved**

**不要求** 首次 onboarding 画完全部 flowchart；flow 随 task **增量** 维护。

## 5. 版本演进（同仓扩展）

| 版本线 | 能力 |
|--------|------|
| **v0.1** | 五轨模板 + wizard + 文档可跟做 |
| **v0.2+** | `cli/`：`harness ctx` 读序组装（只读） |
| **v0.3+** | `worker/`：可选执行 Worker（自配 LLM） |

CLI/Worker 与模板 **同一仓库** 演进，避免多仓割裂。

## 6. 目录真值

以仓库根目录实际树为准；各子目录 `README.md` 说明该轨职责与待补模板清单。
