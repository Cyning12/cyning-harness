# 接入指南

## 1. 前置

- Git
- 自选 IDE（推荐带 Agent 能力的编辑器）
- 业务仓已具备或计划具备：lint / test / build 之一（`ci/` 可对齐）

## 2. 安装向导（wizard）

`wizard/` 将提供勾选问卷（规划 **v0.1**）：

| 步骤 | 选项 |
|------|------|
| 仓库类型 | 新仓 / 存量 |
| 存量档位 | S0 小 · S1 中 · S2 大 · S3 巨（见 §3） |
| 语言栈 | 前端 TS · 后端 Python · 全栈 · 其他 |
| IDE 入口 | Cursor rules · CLAUDE.md · AGENTS.md（可多选） |

当前 **v0.1.3**：优先 [`wizard/README.md`](../wizard/README.md) 脚本；问卷见 [`wizard/ONBOARDING_wizard_v1_zh.md`](../wizard/ONBOARDING_wizard_v1_zh.md)。亦可 **手工** 按 §4 复制模板。

**OSS 个人 fork 向上游 PR**：[`wizard/bootstrap-oss-fork-meta.sh`](../wizard/bootstrap-oss-fork-meta.sh) + [`examples/oss-fork/README.md`](../examples/oss-fork/README.md)（双 worktree · C3 思考回填 · 过程轨不进上游 PR）。选题：[`wizard/scan-upstream-issues.sh`](../wizard/scan-upstream-issues.sh)（`kimi-c3-candidate` 等 preset）。

## 3. 存量档位与图谱首次要求（D1:A + D4-a）

| 档位 | 首次 30 改码前 | flowchart |
|------|----------------|-----------|
| **S0** 小 | 模块表人签 + 1 条主 flow | 随 task 增量 |
| **S1** 中 | 模块表人签 + 主路径 flow | 每 Epic 约 1 张 |
| **S2** 大 | **仅**模块表人签 + 待补清单 | discovery 排队 |
| **S3** 巨 | 每子仓模块表 + 顶层指针 | 不合并单大图 |

**「全量」** 指 **模块登记表覆盖一级模块**，不是一次画完所有 Mermaid。

人工闸：**`HG-GRAPH-MODULES`**（approved 后允许执行改码 task）。

## 4. 手工接入（v0.0.1）

在 **你的业务仓库** 根目录：

```bash
# 1. 克隆本产品（或已 clone）
git clone git@github.com:Cyning12/cyning-harness.git

# 2. 复制模板（示例 · 按栈裁剪）
mkdir -p docs/_tech_graph docs/coding_wiki docs/standards docs/tasks docs/harness
cp -R cyning-harness/graph/templates/* docs/_tech_graph/
cp -R cyning-harness/coding_wiki/templates/* docs/coding_wiki/
# … 见各子目录 README
```

3. 填写 `01_struct.md` 模块表 → 人签 `HG-GRAPH-MODULES`  
4. 从 `harness/templates/` 创建首张 `task_*.md`  
5. IDE 中 `@` task + `harness/prompts/` 执行  

## 5. 五轨检查清单

- [ ] `docs/_tech_graph/` 骨架 + 模块表
- [ ] `docs/coding_wiki/` 读序
- [ ] `docs/standards/`（按栈）
- [ ] `docs/tasks/` + `docs/harness/invokes/` 约定
- [ ] CI 样例已适配
- [ ] IDE 入口已生成

## 6. 常见问题

**Q：本产品会调 LLM 吗？**  
A：不会。LLM 在你使用的 IDE 中运行。

**Q：必须一次画完所有架构图吗？**  
A：不必。模块表人签 + 主路径即可开工；其余增量。

**Q：Harness 关账等于图谱关账吗？**  
A：不等。改 BFF/模块边界时须 **同 task 或子 task** 更新相关 flow。
