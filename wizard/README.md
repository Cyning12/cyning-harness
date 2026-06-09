# wizard · 安装向导

**状态**：`v0.1` · M2 文档版问卷已交付

## v0.1 已交付（T5 · M2）

| 文件 | 说明 |
|------|------|
| [`ONBOARDING_wizard_v1_zh.md`](./ONBOARDING_wizard_v1_zh.md) | 勾选问卷：新/存量 · 栈 · IDE · 五轨复制步骤 |

## 问卷输入 → 输出

| 输入 | 选项 |
|------|------|
| 仓库类型 | 新仓 / 存量 S0～S3 |
| 语言栈 | 前端 TS · 后端 Python · 全栈 · 其他 |
| IDE | Cursor（推荐）· CLAUDE.md · AGENTS.md |

| 输出 | 路径 |
|------|------|
| 目录清单 | `docs/_tech_graph/` · `coding_wiki/` · `standards/` · `harness/` · CI |
| IDE 片段 | [`../ide/adapters/`](../ide/adapters/README.md) 按勾选复制 |
| 首张 task | `harness/templates/TASK_graph_bootstrap.md` 或 `TASK_TEMPLATE.md` |

## 使用

1. 打开 [`ONBOARDING_wizard_v1_zh.md`](./ONBOARDING_wizard_v1_zh.md) 按步勾选  
2. 对照 [`docs/ONBOARDING.md`](../docs/ONBOARDING.md) 五轨检查清单验收  
3. M3 规划：交互脚本 / `harness init` CLI（**非** v0.1 范围）

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.0.1 | 2026-06-09 | 占位 · 手工 ONBOARDING |
| v0.1.0 | 2026-06-09 | T5 文档版 wizard |
