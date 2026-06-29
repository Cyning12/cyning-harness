# GUIDE · 新建项目 Harness 引导（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **版本** | v1 |
| **日期** | 2026-06-29 |
| **触发** | harness-probe bootstrapping 实录 → 抽象为通用模式 |
| **读者** | 维护者在新项目中接入 Harness 时的操作手册 |

> **用途**：从零开始给一个新项目（单仓、Python、无前端）接入 cyning-harness 纪律体系。存量项目见 [`ONBOARDING_wizard_v1_zh.md`](../ONBOARDING_wizard_v1_zh.md)。

---

## 1. 判断：你的项目需要什么

| 条件 | 推荐 profile | 说明 |
| --- | --- | --- |
| 纯文档/小工具 | `harness-only` | 只给 prompts + invoke 模板 |
| 有业务代码 + CI | `harness-only` + 手动补图谱和 CI | **本指南覆盖** |
| 全栈 Ink 类（前端+后端） | `fullstack-node-py` | 带 Wiki、standards、task bootstrap |

**关键原则**：宁可先用 `harness-only` 打底，再按需补。fullstack profile 多出来的 Wiki + standards 对小项目是噪音。

---

## 2. 引导 6 步（通用模板）

### Step 1：种子 prompts + invoke 模板

```bash
cd <project-root>
npx @cyning/harness init --preset harness-only --ide cursor
```

产物：
- `docs/harness/prompts/`：10/22/30/40 + FRAGMENT + TEMPLATE
- `docs/harness/invokes/TEMPLATE_invoke.md`
- `.cursor/rules/06-harness-pointer.mdc`

**注意**：`.cyning-harness/` 加到 `.gitignore`。

### Step 2：AGENTS.md + CLAUDE.md

模板源：`cyning-harness/ide/adapters/`

```bash
cp <path-to-cyning-harness>/ide/adapters/CLAUDE.md.fragment.example <project-root>/CLAUDE.md
cp <path-to-cyning-harness>/ide/adapters/AGENTS.md.fragment.example <project-root>/AGENTS.md
```

**CLAUDE.md**：薄层，基本不用改。替换 Verify 表里的技术栈（前端→删掉、后端→`pytest tests/ -q`）。

**AGENTS.md**：片段末尾追加项目专属段（~20 行）：
- **读序**：README → 架构文档 → 图谱
- **命令**：项目专属 vitest/pytest/build 命令
- **边界**：不改什么、不碰什么
- **关键词**：项目专属关键词

### Step 3：Agent 定义 + 权限

创建 `.claude/agents/<project>-agent.md`：

```markdown
---
name: <project>
description: <项目描述> · spawn by Lead
tools: Read, Write, Edit, Grep, Glob, Bash
---

你是 **<project> agent**。

## 必读
- `docs/harness/prompts/30-execute-code.md`
- `docs/harness/prompts/40-self-check.md`
- `docs/_tech_graph/graph.json`
- 当前 task：`docs/harness/tasks/active/task_*.md`

## Open Folder
- **`<project>/`**

## 边界
- 列出项目专属禁止项

## Verify
- `pytest tests/ -q`

## 回报（≤10 行）
Status / Deliverables / Blockers / Judgment
```

`.claude/settings.json`：最小权限基线（Read/Bash 白名单）。

### Step 4：技术图谱

**模块 ≤ 10 个 → 手写 graph.json**。模块多了再引入导出工具链。

1. 创建 `docs/_tech_graph/` 目录
2. 为每个模块写一个 `.ai.md`（node id + label + depends_on + entry_points）
3. 手写 `graph.json`（`schema_version: graph_v2`）
4. `README.md` + `99_mermaid_protocol.md`

**验证**：

```bash
python -m src.probe graph-query --graph docs/_tech_graph/graph.json --node <entry> --depth 2
```

### Step 5：CI 门禁

复制 `task_validate.py` 并定制：

```bash
cp <source-repo>/tools/harness_task_validate.py <project-root>/tools/
```

修改：
- `ACTIVE_TASKS` 路径 → `<project>/docs/harness/tasks/active/`
- `_section_body` 用子串匹配（`title not in ...`），不精确匹配

CI workflow（`.github/workflows/tech-graph.yml`）：
- `task_validate` job：扫描 PR diff 中的 `docs/harness/tasks/` 变更
- `pytest` job：跑全量测试

### Step 6：验证链路

```bash
pytest tests/ -q                                      # 单测全绿
python -m src.probe verify --task <path>              # probe 自带 verify
npx @cyning/harness verify --target . --task <path>   # cyning-harness verify
python tools/harness_task_validate.py <path>           # task 门禁
```

全部 exit 0 则引导完成。

---

## 3. 常见问题

### Q: 为什么不直接用 fullstack profile？

fullstack 带了 Wiki、standards L1/L2、task bootstrap——小项目用不上，反而增加 Agent 读取负担。

### Q: task_validate.py 的 `_section_body` 为什么要子串匹配？

因为 task 文件常用编号标题（`## 3. 失败路径`），精确匹配会遗漏。用 `title in heading` 替代 `title == heading`。

### Q: GATE_ROW regex 为什么要接受反引号？

因为 human_gate 表的状态列可能写 `approved` 或 `` `approved` ``，正则加 `?` 做可选反引号匹配。

---

## 4. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1 | 2026-06-29 | 初版 · 从 harness-probe 引导实录抽象 |
