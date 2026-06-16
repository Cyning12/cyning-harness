# 接入指南

> **方法论**：产品语义与文档关系见 [`methodology/README.md`](./methodology/README.md) · 本体 [`methodology/product/DESIGN_ONTOLOGY_v1_zh.md`](./methodology/product/DESIGN_ONTOLOGY_v1_zh.md)

## 1. 前置

- Git
- 自选 IDE（推荐带 Agent 能力的编辑器）
- 业务仓已具备或计划具备：lint / test / build 之一（`ci/` 可对齐）

## 2. 安装（v0.3+ · npx 优先）

**推荐 · 目标业务仓根目录**（不要在 **cyning-harness 产品仓根** 跑 `npx @cyning/harness`，否则会 `harness: command not found`；维护者用 `npm run harness -- …` 或 `node bin/harness.js`）：

```bash
npx @cyning/harness@latest init --preset harness-only --ide cursor,agents
```

日常升级：

```bash
npx @cyning/harness upgrade
npx @cyning/harness check    # 仅检查是否有新版本
```

写入 `.cyning-harness/manifest.json`（钉版本 · preset · ide）与 `profile.json`。  
Schema：[`schema/manifest.v1.schema.json`](../schema/manifest.v1.schema.json)

**维护者 / 离线 · clone 路径：**

```bash
git clone git@github.com:Cyning12/cyning-harness.git
cd your-project
/path/to/cyning-harness/wizard/install.sh --preset harness-only --ide cursor,agents
```

`wizard/` 交互问卷与 `--ide cursor,claude,agents` 仍可用；详见 [`wizard/README.md`](../wizard/README.md) · [`wizard/ONBOARDING_wizard_v1_zh.md`](../wizard/ONBOARDING_wizard_v1_zh.md)。

**OSS 个人 fork 向上游 PR**：[`wizard/bootstrap-oss-fork-meta.sh`](../wizard/bootstrap-oss-fork-meta.sh) + [`examples/oss-fork/README.md`](../examples/oss-fork/README.md)（双 worktree · C3 思考回填 · 过程轨不进上游 PR）。选题：[`wizard/scan-upstream-issues.sh`](../wizard/scan-upstream-issues.sh)（`kimi-c3-candidate` 等 preset）。

---

## 2.2 ICVO 机械审计（v1.0+）

`npx @cyning/harness verify` 在 30 执行前聚合扫描人工闸与测试声明，确保 ICVO 公理可机械检查：

```bash
# 30 前聚合验证（gate-check + audit D5 + S5 warn + 可选 --graph）
npx @cyning/harness verify --target /path/to/your-repo
npx @cyning/harness verify --target /path/to/your-repo \
  --task docs/tasks/active/task_xxx.md

# 仅人工闸
npx @cyning/harness gate-check --target /path/to/your-repo
npx @cyning/harness gate-check --graph --target /path/to/your-repo

# 指定 task 的 ICVO 审计
npx @cyning/harness audit --target /path/to/your-repo \
  --task docs/tasks/active/task_xxx.md

# 生成 invoke 索引（只读聚合，不覆盖 S2 域）
npx @cyning/harness sync index --target /path/to/your-repo
```

| 公理 | 检查项 | 行为 |
|------|--------|------|
| **D3** | 30 前置人闸 | 复用 `gate-check.sh`，HG-AUDIT-R1 非 approved 时 verify 非 0 |
| **D5** | 改码任务测试声明 | `test_strategy=required` 但无测试/CI 引用时 verify 非 0 |
| **S5** | Git 工作区干净 | dirty 时 warn（不直接 fail verify，但 apply 须 `--force`） |

Audit **不替代** 维护者最终判断；Agent 首输出仍须人工复核。

---

## 2.1 安装向导（wizard · 存量/离线）

`wizard/` 将提供勾选问卷（规划 **v0.1**）：

| 步骤 | 选项 |
|------|------|
| 仓库类型 | 新仓 / 存量 |
| 存量档位 | S0 小 · S1 中 · S2 大 · S3 巨（见 §3） |
| 语言栈 | 前端 TS · 后端 Python · 全栈 · 其他 |
| IDE 入口 | Cursor rules · CLAUDE.md · AGENTS.md（可多选 · `--ide`） |

当前 **v0.3.0**：**npx 优先**（§2）；离线或维护者用 [`wizard/README.md`](../wizard/README.md) 脚本 + `--ide cursor,claude,agents`。亦可 **手工** 按 §4 复制模板。

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

## 6. task 关账与 done 分层索引（v0.2.1）

关账时 **勿** 将全文 task 平铺于 `done/` 根目录并拉长 `_views/done.md`。

| 步骤 | 动作 |
|------|------|
| 1 | `git mv docs/tasks/active/<file>.md docs/tasks/done/<domain>/` |
| 2 | 头部 `done（YYYY-MM-DD 验收通过）` |
| 3 | `done/README.md` 对应域表 **追加一行** |
| 4 | 可选同步 `_views/done_by_domain.md` |
| 5 | `_views/done.md` 保持薄指针 |

**域推断**：[`harness/templates/FRAGMENT_task_domain_infer_v1_zh.md`](../harness/templates/FRAGMENT_task_domain_infer_v1_zh.md)  
**模板**：`TASK_done_README.md` · `VIEW_done_by_domain.md` · `VIEW_done_thin_pointer.md`  
**install** 自动创建 `done/<domain>/` 与 Hub（文件不存在时）。

工作区 Harness 路径为 `docs/harness/tasks/`（结构相同）。

## 7. 常见问题

**Q：本产品会调 LLM 吗？**  
A：不会。LLM 在你使用的 IDE 中运行。

**Q：必须一次画完所有架构图吗？**  
A：不必。模块表人签 + 主路径即可开工；其余增量。

**Q：Harness 关账等于图谱关账吗？**  
A：不等。改 BFF/模块边界时须 **同 task 或子 task** 更新相关 flow。
