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

**`upgrade` 不代写业务 task**：只更新纪律层模板 / wizard / 帽文等（S2 保护 `docs/tasks/`、`reviews/`、`invokes/by-task/`）。  
自 **2.18.0** 起 close 要求 `wiki_delta`——升级后须 **自行迁移** 存量 task 元信息；步骤与决策树见 [`USER_GUIDE` §6.0b](./USER_GUIDE_v1.0_zh.md)；缺字段清单：`npx @cyning/harness task lint-wiki-delta`（v2.19+）。  
一页操作序（升级 → 扫描 → 补字段 → 可选 CI / topics）：[`RUNBOOK_upgrade_wiki_delta_v1_zh.md`](./RUNBOOK_upgrade_wiki_delta_v1_zh.md)（v2.19.1+；**v2.21+** 快速路径/pin；**v2.22+** overlay local 块与 `graph_modules_path`）。  
建议将 `.cyning-harness/local.json` 列入 `.gitignore`（常含本机路径）。
自 **2.18.2** 起纪律包推荐 **coding_wiki 两层目录**（根三件套 + `topics/`；recommended，非硬闸）——见 [`coding_wiki/templates/README`](../coding_wiki/templates/README.md) · USER_GUIDE「Wiki 目录 vs 关系图」。  
**`upgrade` 也不自动改业务仓已有 `docs/coding_wiki/` 目录形状**（例如平铺主题 → `topics/`）：须消费者自行 `git mv` 并修链，再 `wiki export` 校验。

写入 `.cyning-harness/manifest.json`（钉版本 · preset · ide）与 `profile.json`。  
Schema：[`schema/manifest.v1.schema.json`](../schema/manifest.v1.schema.json)

**manifest（2.3+）仅五字段**：`version` / `preset` / `ide` / `from_version` / `upgraded_at`（`additionalProperties: false`）。  
旧字段 `name` / `harness_version` / `tech_graph_dir` / `tasks_dir` / `hooks` 已废弃且无消费方；`upgrade` 会整体重写并（v2.11.1+）对将被移除的字段打 WARN，**不会**合并保留。  
`upgrade` 的 `local.json` 簿记在 sync apply **成功之后**写入（v2.11.1+），避免自绊 S5 git-clean。

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
# 30 前聚合验证（gate-check + reviews + S5 warn + 可选 --graph）
# 无 --task：双路径 active（docs/tasks/active ∪ docs/harness/tasks/active）+ 全量 reviews（v2.9+）
npx @cyning/harness verify --target /path/to/your-repo
# 缺审查文豁免：--allow-no-review
npx @cyning/harness verify --target /path/to/your-repo \
  --task docs/tasks/active/task_xxx.md
# --task 另跑 audit D5 + task lint（v2.7+ · E 级仅 WARN，不挡 may_start_30）
# 抑制 lint WARN：加 --allow-lint-fail

# SPEC→00 前：审查文存在性（v2.8+ · 与 --task 互斥）
npx @cyning/harness verify --spec docs/spec/SPEC-xxx_v1.md \
  --workspace-root /path/to/Projects
# 豁免：--allow-no-spec-review · 或 SPEC track=bugfix / skip_spec_audit

# 只读生命周期登记（方向二 · harness/lifecycle.yaml · 非引擎）
npx @cyning/harness lifecycle show
npx @cyning/harness lifecycle show --json
# 转移资格 dry-run（v2.10+ · 旁路报告 · 不替代 verify / task close）
# v2.11+ to_30 已接线：HG-* · reviews · audit_D5 · task_lint
# v2.13+ close_* 已接线（与 task close 同语义 · 仍无 --apply）
npx @cyning/harness lifecycle dry-run --transition to_30 --from draft \
  --task docs/tasks/active/task_xxx.md
npx @cyning/harness lifecycle dry-run --transition close --from done \
  --task docs/tasks/active/task_xxx.md
# 无 --task：仅结构 + 守卫清单 unevaluated
npx @cyning/harness lifecycle dry-run --transition to_30 --from draft

# 受闸归档（v2.12+ 多帽 invoke 集合 · 缺省 10,30,40 · 见 USER_GUIDE §6.0）
npx @cyning/harness task close --file docs/tasks/active/task_xxx.md
# 豁免示例：--allow-invoke-gap · --allow-unchecked · --allow-no-review · --allow-kpi-gap · --allow-experience-gap · --allow-wiki-gap
# （勿把 --allow-*-gap 当默认绿路径）

# 机械化率资产只读（v2.11+ · SoT=discipline-coverage.yaml）
npx @cyning/harness discipline show
npx @cyning/harness discipline show --json

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
| **D5** | 改码任务测试声明 | 仅 `--task`：`test_strategy=required` 但无测试/CI 引用时 verify 非 0 |
| **reviews** | R&lt;n&gt; 审查文存在 | `--task` 与全量（v2.9+）· 缺文 BLOCKED · `--allow-no-review` |
| **invoke hats** | 多帽 invoke 集合 | `task close` 硬闸（v2.12+）· `verify --task` **pre-30** 硬闸（v2.17+；缺 40 仍 WARN）· `lifecycle dry-run close` 旁路（v2.13） |
| **graph_delta / KPI / experience / wiki** | 闭环硬闸 | `task close`：graph_delta / KPI / experience（v2.17+）· **wiki_delta / 晋升指针（v2.18+ · 缺字段 BLOCK）** · verify 对 graph/wiki_delta 默认 WARN（`--strict-graph-delta` / `--strict-wiki-delta` 可 BLOCK） |
| **active** | 任务发现 | 双路径 `docs/tasks/active` ∪ `docs/harness/tasks/active`（v2.9+） |
| **S5** | Git 工作区干净 | dirty 时 warn（不直接 fail verify，但 apply 须 `--force`） |
| **lint** | task 结构（仅 `--task`） | v2.7+ E 级 → `WARN: task lint`（不改 exit / `may_start_30`） |

生命周期真值：[`harness/lifecycle.yaml`](../harness/lifecycle.yaml)（`lifecycle show` 只读 · `lifecycle dry-run` 资格判定 v2.10+）。
机械化率资产：[`harness/discipline-coverage.yaml`](../harness/discipline-coverage.yaml)（`discipline show` 只读 · v2.11+）。

机械化率覆盖资产（Starter）：[`harness/discipline-coverage.yaml`](../harness/discipline-coverage.yaml)（SoT · 随版本改 statements/gaps；**无** audit UI）。

Audit **不替代** 维护者最终判断；Agent 首输出仍须人工复核。

---

## 2.0a 绿野推荐顺序（Consumer Ontology · v2.17+）

新业务仓（绿野）建议按序完成 **Inform 语义设定**，再开涉码 30：

1. `npx @cyning/harness init --preset harness-only --ide …`
2. 复制 [`harness/templates/ONTOLOGY_consumer_slice_v1.md`](../harness/templates/ONTOLOGY_consumer_slice_v1.md) → 业务仓 `docs/meta/ONTOLOGY_<domain>_v1.md` 并填术语 / 核心类
3. 填 `docs/_tech_graph/01_struct.md`（及必要 `10_flow_*.md`）
4. 签 task 闸表 **`HG-GRAPH-MODULES`**（若启用）后再 `verify --task` / 开 30

样例：[`examples/demo_checkout/ONTOLOGY_consumer_slice_demo_v1.md`](../examples/demo_checkout/ONTOLOGY_consumer_slice_demo_v1.md)。  
**注意**：consumer slice **不**并入 `harness ontology-check`（产品本体与业务语义分离）。

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
