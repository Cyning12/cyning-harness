# 安装向导 · Onboarding 问卷（v1 · 文档版）

> **状态**：`active`（M2 v0.1）  
> **形态**：**脚本优先**（[`wizard/README.md`](./README.md)）；本文档为 preset 说明备查  
> **关联**：[`docs/ONBOARDING.md`](../docs/ONBOARDING.md) · GUIDANCE D3 IDE 轨

---

## 使用方式

**推荐**：在业务仓根执行脚本（见 [`README.md`](./README.md)）：

```bash
/path/to/cyning-harness/wizard/install.sh --preset ios-cursor
# 日后 git pull 产品包后：
CYNING_HARNESS=/path/to/cyning-harness wizard/harness-sync.sh apply
```

下文为 **preset 含义** 与手工备查。默认不全选 IDE 入口。

---

## 步骤 1 · 仓库类型

| 选项 | 说明 | 下一步 |
|------|------|--------|
| **A 新仓** | 空仓或刚初始化 | → 步骤 2 · 必做图谱骨架 + 模块表 + 1 主 flow |
| **B 存量** | 已有代码 | → 步骤 1b 选档位 |

### 1b · 存量档位（仅 B）

| 档位 | 特征 | 首次 30 改码前 |
|------|------|----------------|
| **S0** 小 | &lt;5 万行、边界清 | 模块表人签 + 1 主 flow |
| **S1** 中 | 多 BFF/路由 | 模块表 + 主路径 flow |
| **S2** 大 | 技术债重 | **仅**模块表 + 待补清单 |
| **S3** 巨 / monorepo | 多子仓 | 每子仓模块表 + 顶层 pointer |

---

## 步骤 2 · 语言栈（可多选）

| 勾选 | 复制来源 | 目标路径 |
|------|----------|----------|
| ☐ 前端 TS/Next | `graph/templates/` · `standards/TEMPLATE_*_L2_frontend*` · `ci/samples/quality.yml.example` | `docs/_tech_graph/` · `docs/standards/` · `.github/workflows/` |
| ☐ 后端 Python | `graph/templates/` · `standards/TEMPLATE_*_L2_backend*` · `ci/samples/pytest.yml.example` | 同上 |
| ☐ 全栈 | 两项均勾选 | 前后端均复制并按仓裁剪 |
| ☐ 其他 | 仅 L1 + 过程轨 | `standards/TEMPLATE_CODING_BASELINE_L1*` · `harness/` |

```bash
# 示例：克隆本产品后（路径按本地调整）
CYNING_HARNESS=/path/to/cyning-harness
mkdir -p docs/_tech_graph docs/coding_wiki docs/standards docs/tasks/active docs/harness/prompts docs/harness/invokes/by-task
cp -R "$CYNING_HARNESS/graph/templates/"* docs/_tech_graph/
cp -R "$CYNING_HARNESS/coding_wiki/templates/"* docs/coding_wiki/
cp "$CYNING_HARNESS/harness/templates/TASK_graph_bootstrap.md" docs/tasks/active/task_graph_bootstrap.md
```

---

## 步骤 3 · IDE 入口（按实际 IDE 勾选 · 默认不全选）

| 勾选 | 脚本 / 复制 | 写入位置 |
|------|-------------|----------|
| ☑ **Cursor**（推荐） | `install.sh --ide cursor` 或 sync | `.cursor/rules/05-harness-starter.mdc` |
| ☐ Claude Code | `install.sh --ide claude` | 仓根 `CLAUDE.md`（marker merge） |
| ☐ 通用 Agent | `install.sh --ide agents` | 仓根 `AGENTS.md`（marker merge） |

```bash
# 推荐：脚本勾选（v0.2+）
/path/to/cyning-harness/wizard/install.sh --preset harness-only --ide cursor,claude,agents

# 手工备查
mkdir -p .cursor/rules
cp "$CYNING_HARNESS/ide/adapters/cursor-harness-starter.mdc.example" .cursor/rules/05-harness-starter.mdc
```

---

## 步骤 4 · 过程轨与 Verify

| 项 | 操作 |
|----|------|
| Harness prompts | `cp harness/prompts/*.md docs/harness/prompts/` |
| invoke 模板 | `cp harness/invokes/TEMPLATE_invoke.md docs/harness/invokes/` |
| CI | 见步骤 2 栈勾选 · 复制 `ci/samples/*.example` → `.github/workflows/` |

---

## 步骤 5 · 人签与首张 task

1. 填写 `docs/_tech_graph/01_struct.md` 模块表  
2. 维护者签 **`HG-GRAPH-MODULES`** → `approved`（见 `TASK_graph_bootstrap.md`）  
3. 新建业务 task：从 `harness/templates/TASK_TEMPLATE.md` 复制  
4. IDE 中 `@` task + `docs/harness/prompts/30-execute-code.md` 开 30 帽  

---

## 完成检查清单

- [ ] 五轨目录存在（图谱 / wiki / standards / harness / CI）
- [ ] 至少 **一种** IDE 入口已生成
- [ ] `HG-GRAPH-MODULES` approved（存量/新仓按档位）
- [ ] 本地或 CI 跑通一门禁命令

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-06-09 | M2 T5 文档版问卷 · 替代 v0.0.1 纯手工说明 |
