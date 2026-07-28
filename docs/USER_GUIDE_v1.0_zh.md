# cyning-harness v2.0 · 使用手册

> **读者**：要在 **自己的业务仓库** 里落地 AI 辅助研发纪律的开发者（非 cyning-harness 维护者）。  
> **版本**：[`@cyning/harness@2.0.0`](https://www.npmjs.com/package/@cyning/harness) · MIT  
> **仓库**：<https://github.com/Cyning12/cyning-harness>  
> **更短入口**：[`README.md`](../README.md) Quick Start · [`ONBOARDING.md`](./ONBOARDING.md) 接入细节  
> **Release**：[`RELEASE_v1.0.1.md`](./RELEASE_v1.0.1.md) · [`CHANGELOG.md`](../CHANGELOG.md)

---

## 1. 这是什么 · 不是什么

**cyning-harness** 是一套可嵌入任意 Git 仓库的 **SDD 过程纪律包**：

- 提供：task 模板、审核 prompt、人工闸约定、同步脚本、CI 样例、架构图谱模板
- **不提供**：业务代码、LLM API、Agent 编排 SDK（与 LangChain 等 **互补**）

**v1.0 解决什么问题**：陌生人不仅能在空仓库 `npx init`，还能用 **`audit` / `gate-check` / `sync --index`** 机械检查「Inform / Constrain / Verify / Orchestrate（ICVO）」是否在仓库里就绪，而不是只靠口头约定。

---

## 2. 前置条件

| 项 | 要求 |
| --- | --- |
| Git | 目标业务仓已是 Git 仓库（或 `git init` 后使用） |
| Node.js | 能运行 `npx`（仅安装/升级 CLI 时需要） |
| IDE | 推荐带 Agent 的编辑器（Cursor、Claude Code 等） |
| 工程习惯 | 至少有 lint、test 或 build 之一（便于对齐 `ci/` 样例） |

---

## 3. 五分钟上手（推荐路径）

在 **你的业务仓库根目录** 执行（**不要**在 clone 下来的 `cyning-harness` 产品仓根跑 `npx`，会报 `harness: command not found`）：

```bash
# 1. 首次安装（钉 preset 与 IDE 入口）
npx @cyning/harness@1.0.1 init --preset harness-only --ide cursor,agents --yes

# 2. 30 前验证（gate-check + audit D5 + S5 warn）
npx @cyning/harness verify --target . --task docs/tasks/active/task_xxx.md

# 3. 产品包升级时（拉取模板更新）
npx @cyning/harness upgrade --yes
```

**安装后你会得到**（典型）：

```text
your-repo/
├── .cyning-harness/
│   ├── manifest.json      # 钉住的 harness 版本与 preset
│   └── profile.json       # 同步轨道配置
├── docs/
│   ├── tasks/active/      # 你的 task 单（Agent 不覆盖）
│   ├── tasks/done/        # 关账归档
│   ├── harness/prompts/   # Starter 四帽 10/22/30/40
│   ├── harness/invokes/   # 执行快照约定
│   ├── _tech_graph/       # 架构图谱（按需填写）
│   ├── coding_wiki/       # LLM 读序
│   └── standards/         # 编码规范模板
└── AGENTS.md 等 IDE 入口片段
```

---

## 4. 典型 SDD 工作流（Starter 四帽）

```text
10 需求/任务分析  →  22 任务审核  →  gate-check  →  30 执行编码  →  40 自检  →  关账
     ↑                    ↑              ↑
  prompts/10        落盘 reviews/    HG-AUDIT-R1 = approved
```

### 4.1 新建一张 task

1. 复制 [`docs/harness/templates/`](../harness/templates/) 或金样 [`task_demo_p0_golden_v1.md`](../examples/demo_checkout/task_demo_p0_golden_v1.md) 到 `docs/tasks/active/task_xxx.md`
2. 填写：背景、范围、验收标准、`test_strategy`（`required` / `recommended` / `not_applicable`）
3. 在 task 表填写 **人工闸**（至少 `HG-TASK-DRAFT`、`HG-AUDIT-R1`）

### 4.2 在 IDE 里执行

1. `@` 你的 task 文件 + `@docs/harness/prompts/10-requirements.md` → 产出需求/范围（帽说明见 [`harness/prompts/README.md`](../harness/prompts/README.md)）
2. `@` [`22-task-audit.md`](../harness/prompts/22-task-audit.md) → 审核员落盘 `docs/harness/reviews/` · 维护者签 **`HG-AUDIT-R1 = approved`**
3. **30 之前** 跑 gate-check（见 §5）
4. `@` [`30-execute-code.md`](../harness/prompts/30-execute-code.md) → 改代码
5. `@` [`40-self-check.md`](../harness/prompts/40-self-check.md) → 命令证据 · 回填 task
6. 关账：`git mv` task → `docs/tasks/done/<domain>/`（见 [`ONBOARDING.md`](./ONBOARDING.md) §6 · [`FRAGMENT_task_domain_infer`](../harness/templates/FRAGMENT_task_domain_infer_v1_zh.md)）

### 4.3 练手金样（零风险）

不碰生产仓库时，在 `/tmp` 跑通一遍：

```bash
mkdir -p /tmp/harness-demo && cd /tmp/harness-demo && git init -q
npx @cyning/harness@1.0.1 init --preset harness-only --ide cursor,agents --yes
# 30 前验证：npx @cyning/harness verify --target . --task docs/tasks/active/task_demo_p0_golden_v1.md
# 金样 task（二选一）：
# · 已 clone 产品仓：cp /path/to/cyning-harness/examples/demo_checkout/task_demo_p0_golden_v1.md docs/tasks/active/
# · 仅 npx：从 GitHub 浏览 examples/demo_checkout/ 复制 task 内容
# 逐步验收：examples/demo_checkout/ACCEPTANCE.md（见下方链接）
```

分步勾选：[`examples/demo_checkout/README.md`](../examples/demo_checkout/README.md) · [`ACCEPTANCE.md`](../examples/demo_checkout/ACCEPTANCE.md) · 差距说明 [`P0_V0.2_GAP.md`](./methodology/execution/P0_V0.2_GAP.md)

---

## 5. 人工闸与 gate-check（30 前必做）

**原则**：Agent 可以写 task 和 review，**人工闸只有维护者能签**。

```bash
# 全量（无 --task）：双路径 active + 闸表 + reviews（v2.9+ · 不跑 lint/D5）
npx @cyning/harness verify --target .
# 缺审查文豁免：--allow-no-review

# 单 task：gate-check + audit D5 + reviews + task lint WARN + S5 · 可选 --graph
npx @cyning/harness verify --target . --task docs/tasks/active/task_xxx.md
# lint FAIL 仅 WARN（v2.7+ · 不挡 30）；抑制：--allow-lint-fail

# SPEC→00：审查文存在性（v2.8+ · 与 --task 互斥）
npx @cyning/harness verify --spec docs/spec/SPEC-xxx_v1.md \
  --workspace-root /path/to/Projects
# 豁免：--allow-no-spec-review

# Agent handoff（v2.0.2+）：JSON 路由 + 下一帽提示
npx @cyning/harness verify --target . \
  --task docs/tasks/active/task_xxx.md \
  [--json] [--agent-hint] \
  [--workspace-root /path/to/Projects]

# 只读生命周期登记（方向二 · harness/lifecycle.yaml · 登记真值）
npx @cyning/harness lifecycle show [--json]
# 转移资格 dry-run（v2.10+ · 引擎消费 yaml · 旁路报告 · 非 runner / 非 G7）
# v2.11+ to_30 已接线 HG-* / reviews / audit_D5 / task_lint（close_* 仍可 unevaluated）
npx @cyning/harness lifecycle dry-run --transition to_30 --from draft \
  [--task docs/tasks/active/task_xxx.md] [--json] [--allow-no-review]

# 仅人工闸
npx @cyning/harness gate-check --target . --task docs/tasks/active/task_xxx.md
npx @cyning/harness gate-check --graph --target .    # Inform 图谱闸

# 等价底层脚本（离线 clone 产品仓路径 · 见 wizard/README）
/path/to/cyning-harness/wizard/gate-check.sh --target .
```

脚本说明：[`wizard/README.md`](../wizard/README.md) · [`wizard/gate-check.sh`](../wizard/gate-check.sh)

| 闸 ID | 含义 | 30 影响 |
| --- | --- | --- |
| `HG-AUDIT-R1` | 22 审核通过 | **非 approved → 拒 30** |
| `HG-TASK-DRAFT` | task 初稿维护者签 | pending 且 blocks 含 30 → 拒 30 |
| `HG-GRAPH-MODULES` | 架构模块表人签 | pending → 拒改码 30 |
| `HG-RELEASE` | 发版闸（产品仓） | 一般业务仓不涉及 |
| `task_lint`（v2.7+） | `verify --task` 结构检查 | **仅 WARN** · 不改 `may_start_30` |
| `reviews`（全量 v2.9+） | 裸 verify 亦查 R&lt;n&gt; 文 | 缺文 → BLOCKED · `--allow-no-review` |

### 5.1 Agent handoff（v2.0.2+）

`verify --json` 从 task Harness 表解析 `entry_invoke_30` 等字段，输出 Agent 可消费的机械路由（不读取 Projects 文件正文）：

| JSON 字段 | 含义 |
| --- | --- |
| `may_start_30` | 闸表可 30 **且** `review_found`（或豁免） |
| `review_found` | R&lt;n&gt; 审查文是否存在（全量与 `--task` 同构 · v2.9+） |
| `blocked_reason` | 阻塞时 D2/D3 文案 |
| `review_path` | 最新 `*_audit_R1_*.md`（相对 target） |
| `entry_invoke_30` | task 表原始路径 |
| `entry_invoke_30_resolved` | 绝对路径（`Projects/` 前缀须 `--workspace-root`） |
| `next_hat` | `"30"` 或 `null` |
| `agent_preamble` | 短句提醒首输出 GATE_VERIFY |
| `lint`（v2.7+ · 仅 `--task`） | `{ ok, errors, warnings, suppressed? }` · 不参与 `may_start_30` |

Schema：[`schema/verify_result.v1.schema.json`](../schema/verify_result.v1.schema.json)

---

**Inform 图谱闸（v1.0）**：改码类 task 前，确保 `docs/_tech_graph/` 模块表已维护者签 `HG-GRAPH-MODULES = approved`。存量大仓可按 [`ONBOARDING.md`](./ONBOARDING.md) §3 选 S0–S3 档位，**不必一次画完所有 Mermaid**。

---

## 6. v1.0 CLI 命令速查

| 命令 | 用途 |
| --- | --- |
| `npx @cyning/harness init` | 首次安装模板与 manifest（可选 `--with-scripts`） |
| `npx @cyning/harness upgrade` | 同步产品包更新（可加 `--gate-check`）；v2.11.1+：`local.json` 在 apply 后写入；manifest 重写前 WARN 非标准字段（2.3+ 仅五字段） |
| `npx @cyning/harness check` | 检查是否有新版本 |
| `npx @cyning/harness verify` | 全量：双路径 + reviews（v2.9+）；`--task`：30 前聚合 + **pre-30 invoke 硬闸**（v2.17+；缺 40 仍 WARN）+ **graph_delta / wiki_delta WARN**（`--strict-graph-delta` / `--strict-wiki-delta` 可 BLOCK）；`--spec`：SPEC→00（v2.8+ · 互斥） |
| `npx @cyning/harness status` | 过程可观测一屏投影（v2.14+ · 闸/invoke/review/`verify_preview`；**不替代** verify） |
| `npx @cyning/harness wiki export --json` | 导出 `coding_wiki` 关系图 JSON（v2.18+ · schema `harness.wiki_graph.v1`；本包不渲染） |
| `npx @cyning/harness task lint-wiki-delta` | 列出缺 `wiki_delta` 字段的 task（v2.19+ · 升级迁移清单；有缺失 exit 2） |
| `npx @cyning/harness timeline` | 过程时间线（v2.15+ · HGM 事件投影；默认不 ingest；可选 `--ingest`） |
| `npx @cyning/harness task close` | 受闸归档；v2.12+ invoke hats；**v2.17+** graph_delta / KPI / experience；**v2.18+** wiki_delta / 晋升指针；豁免 `--allow-invoke-gap` / `--allow-kpi-gap` / `--allow-experience-gap` / `--allow-wiki-gap`（勿当默认绿路径） |
| `npx @cyning/harness lifecycle show` | 只读展示 `harness/lifecycle.yaml`（登记 · v2.7+） |
| `npx @cyning/harness lifecycle dry-run` | 转移资格判定（v2.10+ · `to_30` v2.11 · **`close_*` v2.13** · 旁路 · 非 G7） |
| `npx @cyning/harness discipline show` | 只读展示 `harness/discipline-coverage.yaml`（v2.11+ · 非 audit UI） |
| `npx @cyning/harness gate-check` | 仅人工闸（`--graph` / `--json`） |
| `npx @cyning/harness audit` | ICVO 机械审计（D3/D5/S5） |
| `npx @cyning/harness sync index` | 生成 `.cyning-harness/invoke_index.json` |
| [`harness-sync.sh`](../wizard/harness-sync.sh) `plan/apply` | 预览/应用模板同步 |

**ICVO audit 检查什么**：

| 公理 | 行为 |
| --- | --- |
| **D3** | 30 前人闸 · 同 gate-check |
| **D5** | `test_strategy=required` 须有测试路径或 CI 引用 |
| **S5** | 工作区 dirty 时 warn；`sync apply` 须 `--force` 明示 |

Audit **不替代** 维护者判断；22 内容质量仍须人读 review。详见 [`ONBOARDING.md`](./ONBOARDING.md) §2.2。

### 6.0a 过程可观测 · `status` / `timeline`（v2.14+ / v2.15+）

#### status（一屏）

一屏回答「这个 task 现在能不能进 30？卡在哪？」——聚合闸表、invoke/review 存在性、以及 **`verify` 只读预览**。

```bash
# 列出 active 摘要
npx @cyning/harness status --target /path/to/repo

# 单 task 详表（人读）
npx @cyning/harness status --target /path/to/repo --task docs/harness/tasks/active/task_xxx.md

# 机读（obs_status.v1）
npx @cyning/harness status --target /path/to/repo --task docs/harness/tasks/active/task_xxx.md --json
```

| 要点 | 说明 |
| --- | --- |
| **≠ verify** | `verify_preview` 仅为投影；**30 前仍须**正式 `harness verify --task …` |
| `--check` | 须 `--task`。缺 R1 或 `may_start_30=false` → **exit 2**（v2.16+）；**仍 ≠** 替代 verify |
| HGM | 只读事件计数；无匹配事件时 `event_count=null`；**不会**自动 `ingest` |
| JSON | 字段只加不删语义（`schema_version: obs_status.v1`） |

#### timeline（时间线 · v2.15+）

按时间升序列出与该 task 相关的 HGM 事件（与 `status.hgm` **同一匹配规则**）。

```bash
npx @cyning/harness timeline --target /path/to/repo --task docs/harness/tasks/active/task_xxx.md
npx @cyning/harness timeline --target /path/to/repo --task docs/…/task_xxx.md --json --limit 20
# 显式写盘后再投影（默认不会偷偷 ingest）
npx @cyning/harness timeline --target /path/to/repo --task docs/…/task_xxx.md --ingest
```

| 要点 | 说明 |
| --- | --- |
| 无事件 | exit 0 · stderr WARN · 提示先 `graph ingest` 或加 `--ingest` |
| `--ingest` | **显式**调用 ingest；非默认 |
| JSON | `obs_timeline.v1` · 每行含 `occurred_at` / `type` / `subject` / `summary` |

完整字段见产品 SPEC：`docs/spec/SPEC-process-observability_status_timeline_v1.md`。

#### 可选 · commit 后 ingest hook（v2.16+ / 既有 §13.3）

`init` **默认不安装** hook。随包样例：

```bash
# 从 npm 包 / clone
cp node_modules/@cyning/harness/examples/hooks/pre-commit.graph-ingest.sample \
  .cyning-harness/hooks/pre-commit.sample
cp .cyning-harness/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

失败默认 **WARN 不挡 commit**。CI 可选步骤见 [`ci/samples/hgm-ingest.yml.example`](../ci/samples/hgm-ingest.yml.example)。

#### 跨壳边界（工作区 GUIDANCE · P3a）

结束态认**落盘**；飞行中属各 ExecutionShell，**禁止**升格为签收真值。完整边界表：

- 工作区（Open `Projects/`）：`docs/harness/guides/GUIDANCE_harness_process_observability_shell_boundary_v1_zh.md`
- Kimi 壳专章（链）：同目录 `GUIDANCE_kimi_code_00_observability_v1_zh.md`
- Ops Desk 只读 JSON 消费者：**P3b**（可选 · 不阻塞 Epic）

### 6.0 多帽 invoke 留档（v2.12+ · verify pre-30 硬闸 · 目标 v2.17+）

`task close` 按 task 元信息校验 `by-task/<slug>/` 下 invoke 文件名所覆盖的 **hat 集合**（缺省要求 `10,30,40`）。

| 字段 / 手段 | 说明 |
| --- | --- |
| `invoke_retention_profile` | `default`=`10,30,40` · `minimal`=`30` · `full`=`00,10,20,30,40,CLOSE` |
| `required_invoke_hats` | 显式列表，**优先于** profile |
| 命名 | `invoke_YYYYMMDD_<hat>[_<hat>...]_<slug>.md`；hat 只在日期后连续前缀（例 `30_40` 可双计）；**slug 段勿夹** `10`/`40` 等（v2.12.1 起不误计） |
| `--allow-invoke-gap` | close / `verify --task` 缺帽豁免并留痕（verify 对 **pre-30** 硬闸亦适用） |
| 存量仅 30 | upgrade 后：补 `10`/`40` 档、或改 `minimal`、或显式 `--allow-invoke-gap` |

**verify `--task`（v2.17+）**：`required ∩ {10,20,00}`（**pre-30**）缺失 → **VERIFY BLOCKED** · `may_start_30=false`（用户口头「开工」≠ 闸）。缺 **40** / 缺 30 文件本身 **不挡** 30（仍可 WARN）；`minimal`（无 preRequired）不挡。硬闸 close 仍覆盖全量 required（含 40）。

**闭环硬闸（v2.17+ · close）**：

| 字段 / 手段 | close | verify `--task` |
| --- | --- | --- |
| `graph_delta` / `graph_delta_note` | 缺字段 WARN；`none` 无 note → BLOCK；路径须相对仓根存在 | 同规则默认 WARN；`--strict-graph-delta` → fail 级 BLOCK |
| `kpi_aggregator=CLOSE`（默认） | `### KPI` 内须可解析分数（`Task_KPI%` / D1–D5 / 四维 1–5）；`--allow-kpi-gap` 豁免留痕 | **不**挡 30 |
| `experience_capture` | `required` 须经验节非空；`recommended` WARN；`not_applicable` 须 note；`--allow-experience-gap` 豁免留痕 | **不**挡 30 |
| `wiki_delta` / `wiki_delta_note` | **缺字段 close BLOCK**；`none`/`n/a` 无 note → BLOCK；path 须存在；`--allow-wiki-gap` 豁免留痕 | 同规则默认 WARN；`--strict-wiki-delta` → BLOCK |
| wiki 晋升指针 | `experience=required` 且 `wiki_delta=path` 时经验节须含 `coding_wiki` / `Wiki:` / `wiki_promoted:` | **不**挡 30 |

改码 task 推荐：填 `graph_delta` / `wiki_delta` → 必要时改图与 wiki → `verify --graph` / `--task` → 开 30；关账前补 KPI、经验节与（path 时）wiki 晋升指针。

### Wiki 目录 vs 关系图（v2.18.2+ · recommended）

> **人看文件夹，图看链接。** 目录约定真值在产品包 [`coding_wiki/templates/README.md`](../coding_wiki/templates/README.md)（拷贝后即业务仓 `docs/coding_wiki/README.md`）。此处只定边界，**不**重复 §6.0b 决策树。

| | 目录树（两层起步） | 关系图（`wiki export`） |
|--|-------------------|-------------------------|
| 目的 | 避免根目录主题长文平铺爆炸 | Agent / Web / Obsidian 消费边 |
| 形状 | `stable`/`context`/`volatile` 留根 · 主题进 `topics/` | **不**依赖目录深度 |
| 加深 | md≥15 / 难扫 / 单页>~80 行 / 连续 3 task 同前缀 → 子域第 3 层 | `git mv` 后修好双括号 wikilink 即可 |
| 闸 | **recommended 仅**；缺两层 **不**挡 close | `wiki_delta` 字段闸见上表与 §6.0b |

升级后字段迁移、`n/a`/`none`/path：见 **§6.0b**。CLI 缺字段 lint 仍规划 **2.19+**。

### 6.0b 升级后 · `wiki_delta` 存量迁移（v2.18.1+）

> **破坏性（2.18.0）**：`task close` **缺 `wiki_delta` 字段 → BLOCK**。`verify --task` 仅 **WARN**（文案会提示 close 将 BLOCK）——**易漏迁**。升级后请主动扫 task，勿等关账才发现。  
> **一页 runbook（v2.19.1+）**：[`RUNBOOK_upgrade_wiki_delta_v1_zh.md`](./RUNBOOK_upgrade_wiki_delta_v1_zh.md)（升级 → `lint-wiki-delta` → 补字段 → 可选 CI / `topics/`）。CI 样例：[`ci/samples/lint-wiki-delta.yml.example`](../ci/samples/lint-wiki-delta.yml.example)。

**`upgrade` 不会改写业务 task 元信息**（S2：不覆盖 `docs/tasks/`）。须人工或脚本补字段。

#### 决策树：`n/a` vs `none` vs `path`

| 条件 | 填 | note |
|------|----|------|
| 本仓 **未启用** WikiTrack（无 `docs/coding_wiki/`，或 profile `wiki: false` / harness-only） | **`n/a`** | 一行理由，如「harness-only · 未启用 WikiTrack」 |
| 已有 `docs/coding_wiki/`，**本 task 未改** wiki | **`none`** | 一行理由，如「本轮无 wiki 增量」 |
| 本 task **改了** wiki（或新建/晋升条目） | **相对仓根 path**（文件或目录） | path 存在即可；`experience_capture=required` 时经验节须含晋升指针 |

#### 扫描建议（升级后立刻做）

```bash
# 列出缺 wiki_delta 字段的 task（v2.19+ · 有缺失 exit 2；可进 CI）
npx @cyning/harness task lint-wiki-delta [--target .] [--scope all|active|done] [--json]

# 抽查单文件：缺字段时 verify 会 WARN（不挡 30）并提示上列命令；close 才会 BLOCK
npx @cyning/harness verify --target . --task docs/tasks/active/<task>.md
```

批量补字段：在 Harness 元信息表、`graph_delta_note` 行后插入两行（示例）：

```markdown
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | harness-only · 未启用 WikiTrack |
```

#### `wiki export` schema

输出含 `"schema": "harness.wiki_graph.v1"`（**无**单独 `schema_version` 字段）。消费者应用全等校验该字符串；破坏性变更将升 schema 名（如 `v2`），而非另加数字字段。

产品包模板互链样例（拷贝后边非空）：

```bash
npx @cyning/harness wiki export --json --root coding_wiki/templates
# 业务仓若已 cp 到 docs/coding_wiki：--root docs/coding_wiki
```

**防踩坑（F-218-07）**：文档/README **叙述**里不要写裸双括号字面（会把「说明用的伪链」解析成边 → `未解析 wikilink` warn）。正文举例请写「双括号 wikilink」，真实互链再用指向存在页的 `[[stable]]` 等。

归档前可用旁路资格报告（**不** mv、**不**替代 `task close`）：

```bash
npx @cyning/harness lifecycle dry-run --transition close --from done --task docs/tasks/active/task_xxx.md
# 可选：--allow-invoke-gap · --allow-unchecked · --allow-no-review · --allow-kpi-gap · --allow-experience-gap · --allow-wiki-gap
```

### 6.1 SDD-Compliance bench（维护者 · 可选）

> **业务仓日常不必跑**；用于验证 `gate-check` / `sync` 公理行为，或对照 README「试点证据」中的 bench 数字。

仅在 **clone 下来的 cyning-harness 产品仓根** 执行：

```bash
cd /path/to/cyning-harness
./wizard/compliance-bench.sh --all          # 逐项解释 + 摘要（推荐人工看）
./wizard/compliance-bench.sh --quiet --all  # stdout 仅合规率数字；说明在 stderr
```

| 输出 | 含义 |
| --- | --- |
| **`100`** | S1–S4 四个合成场景全 PASS · **不是** LLM 解题分数 |
| **`< 100`** | 有场景 FAIL · 见 `--all` 输出或 stderr 摘要表 |

场景与公理解读：[`examples/compliance_bench/README.md`](../examples/compliance_bench/README.md) · 脚本 [`wizard/compliance-bench.sh`](../wizard/compliance-bench.sh)

---

## 7. 同步边界（重要 · S2）

`harness-sync` **不会覆盖** 你的业务数据：

- `docs/tasks/**`
- `docs/harness/reviews/**`
- `docs/harness/invokes/by-task/**`（按 task 域的执行快照）

纪律层（prompts 模板、wizard 脚本引用）与业务 task **分离**。升级产品包前建议：

```bash
git status          # 应干净，或知晓 S5 warn
npx @cyning/harness upgrade --yes
```

---

## 8. Preset 怎么选

| preset | 适合 |
| --- | --- |
| **`harness-only`**（默认） | 任意栈 · 只要 SDD 过程轨 + IDE 入口 |
| `fullstack-node-py` | Node 前端 + Python 后端全栈五轨 |
| `oss-fork-meta` | 个人 OSS fork · 过程轨与 upstream 双分支（见 [`examples/oss-fork/README.md`](../examples/oss-fork/README.md)） |

交互式问卷：`wizard/install.sh`（离线 clone 路径）。

---

## 9. 离线 / 无 npx 环境

```bash
git clone https://github.com/Cyning12/cyning-harness.git
cd your-project
/path/to/cyning-harness/wizard/install.sh --target . --preset harness-only --ide cursor,agents
/path/to/cyning-harness/wizard/harness-sync.sh apply --target .
```

维护者在 **产品仓根** 验证 CLI：

```bash
npm run harness -- check --target /tmp/foo
# 或 node bin/harness.js audit --target /path/to/your-repo
```

---

## 10. Inform-YAML 图谱编辑源（v1.1+）

从 `@cyning/harness@1.1.0` 起，业务仓可选择用 **`docs/_tech_graph/*.graph.yaml`** 作为 Inform 架构图谱的编辑源，再编译为 `.md`（人类可读）与 `graph.json`（机器可读）。

### 10.1 三轨边界

| 轨 | 文件 | 用途 | 版本 |
| --- | --- | --- | --- |
| **MD 人类轨** | `docs/_tech_graph/*.md` | 代码审阅、README 引用、Mermaid 渲染 | v1.0+ |
| **YAML 编辑源** | `docs/_tech_graph/*.graph.yaml` | 结构化编辑、diff、CI 校验 | **v1.1+** |
| **PIP（过程实例投影）过程轨** | `.cyning-harness/events/*.jsonl` | Task / Gate / Review 实例与事件史 | **v2.0+** |

**原则**：YAML 为 Inform 编辑源，PIP（过程实例投影）为过程事件图；YAML **不替代** task/review 真值，PIP（过程实例投影）**不替代** YAML/MD Inform 正文。

### 10.2 最小工作流

```bash
# 1. 在业务仓编辑 docs/_tech_graph/00_main.graph.yaml
# 2. 编译为 Markdown（人类可读）
npx @cyning/harness graph yaml compile --graph-id 00_main --input docs/_tech_graph

# 3. 校验 YAML 与 graph.json 切片是否一致
npx @cyning/harness graph yaml check --graph-id 00_main --input docs/_tech_graph

# 4. 一次性编译/校验全部 *.graph.yaml
npx @cyning/harness graph yaml compile --all --input docs/_tech_graph
npx @cyning/harness graph yaml check --all --input docs/_tech_graph
```

### 10.3 schema 与迁移

- **产品 schema**：[`schema/inform_graph.v3.schema.json`](../../schema/inform_graph.v3.schema.json)
- **迁移对照表**：[`docs/methodology/graph/INFORM_YAML_MIGRATION_v1_zh.md`](./methodology/graph/INFORM_YAML_MIGRATION_v1_zh.md)
- **试点真值**：Ink 后端 `ai-ink-brain-api-python/docs/_tech_graph/*.graph.yaml`

### 10.4 与 gate-check --graph 的关系

`gate-check --graph` 语义不变：仍扫描 `docs/_tech_graph/` 下所有模块/流程文件，输出 `HG-GRAPH-MODULES` 状态摘要。新增 `.graph.yaml` 文件会 **友好列出**，不改变通过/失败规则。

### 10.5 金样

`examples/demo_checkout/00_main.graph.yaml` 提供零风险 Inform-YAML 切片，可对照其生成的 `00_main.md` 与 `graph.json`。

---

## 11. 局限与诚实边界（v1.1）

| 项 | 说明 |
| --- | --- |
| 不是胜率工具 | [`README` 试点证据 B2](../README.md) · 完整表 [`PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md) · **小样本机制证据**，不可外推 |
| bench `100` | [SDD-Compliance](../examples/compliance_bench/README.md) 五场景合规率 · 见上文 §6.1 |
| Extended 帽 | 00/50/链式 PROMPT 不在 Starter 默认包 · 见 [`harness/prompts/README.md`](../harness/prompts/README.md) |
| Inform-YAML | **v1.1+** · 可选编辑源 · 须 `graph yaml check` 与 `graph.json` 一致 |
| PIP（过程实例投影）/ 图数据库 | **v2.0+ 已实现** `graph ingest|snapshot|axioms` · 本地 JSONL + snapshot；Neo4j / 远端同步 **仍提案** |
| Agent-shell | 研究轨 #9，非 npm 功能 |
| rejected→draft | **v2.0.1+** bench S5 + PIP（过程实例投影）axioms 事件流精确匹配 |

---

## 12. 常见问题

**Q：Harness 会调用我的 LLM 吗？**  
A：不会。LLM 在你使用的 IDE 里；Harness 只提供文件、脚本与约定。

**Q：必须用完 10→22→30→40 才能提交代码吗？**  
A：团队自定。Starter 设计是 **改码前 22 审核 + gate-check**；小修可标 `test_strategy=not_applicable` 并写理由。

**Q：和 `.cursor/rules` 什么关系？**  
A：`init --ide cursor` 会生成入口片段；Harness task + prompts 是 **任务级 SDD**，rules 是 **编辑器级约束**，可同时用。

**Q：升级后 task 会被覆盖吗？**  
A：不会（S2 域）。若 prompts 模板有更新，apply 会更新 **模板侧**，不删你的 active task。**也不会**自动给旧 task 补 `wiki_delta` 等新字段——见 §6.0b。

**Q：`wiki_delta` 填 `n/a` 还是 `none`？**  
A：无 WikiTrack → `n/a`；有轨但本 task 未改 wiki → `none`；改了 → path。见 §6.0b 决策树。

**Q：如何编辑 Inform 架构图？**  
A：v1.1+ 可选 `docs/_tech_graph/*.graph.yaml` 作为编辑源，运行 `npx @cyning/harness graph yaml compile|check` 生成 MD / 校验 graph.json。

**Q：PIP（过程实例投影）与 Inform-YAML 是什么关系？**  
A：Inform-YAML 是 **架构图谱** 的编辑源；PIP（过程实例投影，v2.0+）是 **过程协作** 的事件图。二者并列，PIP（过程实例投影）通过 `InformArtifact` 节点引用 Inform 产物，但不覆盖其正文。

**Q：如何贡献或报 issue？**  
A：GitHub [Cyning12/cyning-harness](https://github.com/Cyning12/cyning-harness) · MIT。

---

## 13. PIP（过程实例投影）过程轨（v2.0+）

PIP（过程实例投影；Process Instance Projection）把 task、gate、review、invoke、sync 等过程实例变成 **append-only 事件流** 与 **可重放图快照**，用于机械检查 SDD 公理。

### 13.1 事件文件

PIP（过程实例投影） 事件写入 `.cyning-harness/events/YYYY-MM.jsonl`，修正 = 追加 `CorrectionEvent`，**禁止删改历史**。

### 13.2 CLI

```bash
# 扫描业务仓 → 追加事件（幂等）
npx @cyning/harness graph ingest --target /path/to/your-repo

# 事件重放 → .cyning-harness/graph/snapshot.json
npx @cyning/harness graph snapshot --target /path/to/your-repo

# 公理检查（D2 · D3 · D4-a · S2 · rejected→draft）
npx @cyning/harness graph axioms check --target /path/to/your-repo
npx @cyning/harness graph axioms check --target /path/to/your-repo --json
```

**公理最小集（v2.0.1）**：D2 · D3 · **D4-a**（`HG-GRAPH-MODULES` pending/rejected + in_progress）· rejected→draft（事件流精确匹配）· S2。

### 13.3 可选 · Git hooks

`init` **默认不安装** pre-commit。维护者可手动复制（随包样例优先）：

```bash
cp node_modules/@cyning/harness/examples/hooks/pre-commit.graph-ingest.sample \
  .cyning-harness/hooks/pre-commit.sample
# 或本地 clone：examples/hooks/pre-commit.graph-ingest.sample
cp .cyning-harness/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

示例 hook 调用 `graph ingest --target`（幂等增量）· 失败默认 **warn** 不阻断 commit（可改 `exit 1`）。

### 13.4 与 Inform-YAML 的接口

- `InformArtifact` 节点 ID：`inform:{repo_rel_path}`
- Task → InformArtifact 边：`MUST_READ`
- PIP（过程实例投影）**不存储** Inform 正文，只存路径指针与 schema 版本

### 13.5 局限

- v2.0 默认本地 JSONL + snapshot；**不含** Neo4j / SQLite / 远端同步
- 多仓聚合、时光机重建任意时点图：v2.1+ 提案

---

## 14. 进一步阅读

| 优先级 | 文档 |
| --- | --- |
| **本手册** | 你正在读 · 对外入口 [`docs/README.md`](./README.md) |
| **接入** | [`ONBOARDING.md`](./ONBOARDING.md) · [`wizard/README.md`](../wizard/README.md) · [`wizard/ONBOARDING_wizard_v1_zh.md`](../wizard/ONBOARDING_wizard_v1_zh.md) |
| **练手** | [`demo_checkout/README.md`](../examples/demo_checkout/README.md) · [`ACCEPTANCE.md`](../examples/demo_checkout/ACCEPTANCE.md) |
| **合规 bench** | [`examples/compliance_bench/README.md`](../examples/compliance_bench/README.md) |
| **理论** | [`methodology/README.md`](./methodology/README.md) · [`DESIGN_ONTOLOGY_v1_zh.md`](./methodology/product/DESIGN_ONTOLOGY_v1_zh.md) |
| **路线** | [`methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md) |
| **试点证据** | [`PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md) |
| **ETCLOVG** | [`ETCLOVG_MAPPING_v1_zh.md`](./ETCLOVG_MAPPING_v1_zh.md) |
| **架构** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| **变更** | [`CHANGELOG.md`](../CHANGELOG.md) · [`RELEASE_v1.0.0.md`](./RELEASE_v1.0.0.md) |

---

**修订记录**

| 日期 | 说明 |
| --- | --- |
| 2026-06-16 | v1.0 stable 首版使用手册 |
| 2026-06-16 | 补全相对链接 · §6.1 compliance-bench · §12 阅读索引 |
| 2026-06-16 | v1.0.1：verify / gate-check / sync index CLI · `--with-scripts` · QUICKREF |
| 2026-06-17 | v1.1.0：新增 §10 Inform-YAML · `graph yaml compile|check` · 三轨边界说明 |
| 2026-06-17 | v2.0.1：D4-a axioms · rejected→draft 精确化 · S5 bench · optional pre-commit hook |
| 2026-06-17 | v2.0.0：新增 §13 PIP（过程实例投影）过程轨 · `graph ingest|snapshot|axioms` · InformArtifact 与 MUST_READ 边 |
