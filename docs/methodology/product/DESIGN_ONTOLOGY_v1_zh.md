# 产品设计本体 · cyning-harness（v1.2）


| 项       | 内容                                                                                                                    |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| **状态**  | `draft`                                                                                                               |
| **版本**  | v1.2                                                                                                                  |
| **日期**  | 2026-06-15                                                                                                            |
| **范围**  | **产品内部**概念模型 · 指导模板 / wizard / sync / SDD 链实现                                                                         |
| **非范围** | 商业战略、ETCLOVG 行业对标（见 [`../pointers/STRATEGY_ONTOLOGY_v1_zh.md`](../pointers/STRATEGY_ONTOLOGY_v1_zh.md)） |
| **真值**  | 本文件 + [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) + [`../../../harness/templates/`](../../../harness/templates/) + `ontology.yaml`（机器可读抽取 · v0.4+ · 与本文件同目录） |


> **用途**：把 Harness **是什么、由哪些实体组成、如何允许状态转移** 说清，供实现 npx CLI、schema、新轨扩展时 **不破坏边界**。  
> **读者**：维护者、未来协作者、实现 Agent。

---

## 0. 与战略本体的分层

```text
战略本体（STRATEGY_ONTOLOGY）     产品设计本体（本文件）
────────────────────────────     ────────────────────────
DisciplinePackage 对外定位        Track / Template / Preset 产品结构
Public push / MIT                 Install · Sync · Marker 机制
Stakeholder                       Hat · Task · Gate · Review 运行时
```

### 0.1 元本体（本文件如何维护）

| 维度 | 规则 |
| --- | --- |
| **版本语义** | `v1.x` = 产品设计本体；与产品包 semver（`0.3.0`）**解耦** · 本体 major 变更须写迁移附录 |
| **变更原则** | 新增类/公理 → 须同步 §6 映射表 + §7.3 扩展规则 +（若影响 sync 域）S2 列表 · **禁止** silent 改基数约束 |
| **评审流程** | 维护者自审 +（重大变更）对照 `STRATEGY_ONTOLOGY` 战略约束 · 修订记入 §12 · **外部 PR**（v1.0 后）须按 §0.3 最小变更清单自检 |
| **机器可读双轨** | Markdown（人类真值）+ `ontology.yaml`（§0.4 骨架 · **v0.4+** 供 `harness ontology-check`） |
| **v1→v2 迁移（预案）** | ① 保留 v1 只读 POINTER 6 个月 ② 公理 ID（P/S/D）**不重编号** ③ 新增类用子命名空间（如 `DecisionArtifact`）④ breaking 变更须 CLI `harness migrate --dry-run` |

### 0.2 当前实现范围（防过度设计）

| 产品版本 | 本体类/能力 **须实现** | **文档-only / 延后** |
| --- | --- | --- |
| **v0.2** | ProcessTrack · StarterHat · Sync S1–S4 · GateCheckRun 基础 | VersionManifest · rollback · ontology.yaml |
| **v0.3** | VersionManifest · npx upgrade · S5 git-clean | Sync rollback · 三路合并 |
| **v0.4** | ExtendedHat POINTER · `ontology.yaml` · D7 HG-RELEASE | 热插拔 Track（Q5） |
| **v1.0** | ICVO 四支柱 CLI 审计 · invoke_index · gate-check --graph | Epic 一等类升格 |

### 0.3 外部贡献与最小变更清单（v1.0 public push 后）

> v1.0 前 **一人维护** · 本节为 public 后预备；PR 须更新本体对应节 + 通过 `harness ontology-check`（v0.4+）。

| 变更类型 | 须同步修改（自检） |
| --- | --- |
| **新 Hat** | §3.2 帽链 · §8 编号表 · `harness/prompts/` 模板 · invoke §3 · `gate-check.sh` · §7.3 |
| **新 HumanGate** | Task 模板闸表 · `blocks_hats` HatRef · gate-check 解析 · §2.3 基数 · §5.3 若影响 D* |
| **新 Track** | §3.1 + `track.yaml`（§3.1.1）· profile `tracks.*` · install/sync 分支 · §6 映射 |
| **新 Artifact 类型** | §1.2 类表 · §2.1 关系 · **S2 禁止覆盖列表** · §6 映射 · sync plan 显示 |
| **新公理 P/S/D** | §5 公理表 · §0.1 变更原则 · `ontology.yaml` axioms · §12 修订记录 |
| **改状态机** | §4 全节 · 相关 Hat 模板 · gate-check 行为 |

**PR 描述模板（建议）**：`Ontology impact: [无 | Hat | Gate | Track | Axiom | State]` + 勾选上表行。

### 0.4 `ontology.yaml` 骨架（v0.4+ · 与 §0.1 双轨）

```yaml
# docs/ontology.yaml · 从本 Markdown 抽取 · 非第二真值
version: "1.2"
classes:
  - id: Track
    domain: Package
  - id: HumanGate
    domain: Instance
properties:
  - id: blocks
    subject: HumanGate
    object: Hat
    cardinality: "1..*"
axioms:
  - id: S2
    text: "禁止 sync 覆盖 docs/tasks, reviews, invokes/by-task"
schemas:
  track: "./track-schema.json"   # TrackManifest · 见 §3.1.1
```

完整抽取由 `harness ontology-check --emit` 生成；**Markdown 冲突时以本文件为准**。

---

## 1. 核心类（Core Classes）

### 1.1 产品包侧（Package Domain）


| 类               | 定义                  | 物理落点                       | 示例                   |
| --------------- | ------------------- | -------------------------- | -------------------- |
| **Track**       | 可独立勾选安装的一轨能力        | `graph/`、`harness/`、`ci/`… | `ProcessTrack`       |
| **TrackManifest** | Track 的机器可读声明（v0.4+） | 产品仓 `*/track.yaml` · 实例 `.cyning-harness/tracks/*.yaml` | `process.track.yaml` |
| **Template**    | 产品仓内可复制的骨架文件        | `*/templates/`、`prompts/`  | `TASK_TEMPLATE.md`   |
| **Preset**      | 轨道勾选的组合配置           | `wizard/profiles/*.json`   | `harness-only`       |
| **WizardTool**  | 安装 / 同步 / 闸检查脚本     | `wizard/*.sh`              | `harness-sync.sh`    |
| **IDEFragment** | 带 marker 的 IDE 入口片段 | `ide/adapters/`            | `CLAUDE.md.fragment` |


### 1.2 业务仓侧（Instance Domain · 嵌入后）


| 类                     | 定义                   | 典型路径                               | 示例                         |
| --------------------- | -------------------- | ---------------------------------- | -------------------------- |
| **AdoptedProfile**    | 安装时生成的轨道真值           | `.cyning-harness/profile.json`     | `harness_prompts: true`    |
| **VersionManifest**   | 钉住产品包版本（v0.3+）       | `.cyning-harness/manifest.json`    | `{ "version": "0.3.0" }`   |
| **Task**              | 可验收工作项文档             | `docs/tasks/active/task_*.md`      | 改码 task                    |
| **Epic**              | 多 Task 总纲（**v1 暂为 Task 特化** · 见 §1.4） | `docs/tasks/active/TASK_epic_*.md` | Epic 编排                    |
| **Hat**               | SDD 角色帽（行为约束）        | `docs/harness/prompts/N-*.md`      | `22-task-audit`            |
| **InvokeSnapshot**    | 新帽开局时的调用体落盘          | `docs/harness/invokes/`            | `invoke_*_30_*.md`         |
| **AuditReview**       | 任务审核书面产出             | `docs/harness/reviews/`            | `*_audit_R1_*.md`          |
| **FailureReport**     | 30 执行失败时的结构化产出（v0.3+） | `docs/harness/reviews/` 或 task 附录 | `*_30_failure_*.md`        |
| **HumanGate**         | 人工审批闸                | task 内表格行                          | `HG-AUDIT-R1`              |
| **InformArtifact**    | 告知层真值                | `docs/_tech_graph/`、`coding_wiki/` | `01_struct.md`             |
| **ConstrainArtifact** | 约束层真值                | `docs/standards/`、`.cursor/rules/` | L2 规范                      |
| **VerifyArtifact**    | 验证层真值                | `.github/workflows/`               | `quality.yml`              |
| **MarkerBlock**       | IDE 文件中可 merge 的纪律区段 | `CLAUDE.md`、`AGENTS.md`            | `cyning-harness:begin/end` |


### 1.3 跨包关系类


| 类                 | 定义                                    |
| ----------------- | ------------------------------------- |
| **SyncOperation** | `plan` / `apply` / `rollback` 一次同步事务 |
| **GateCheckRun**  | `gate-check.sh` 对 active task 闸表的机械扫描 |


### 1.4 Epic 编排规则（v1 · Task 特化期）

Epic **暂不**独立 schema；通过 EpicTask 模板字段表达编排语义：

```yaml
EpicTask:
  depends_on: string[]           # 子 Task slug · 手动声明 · v1.1+
  completion_policy: must_complete_all | any_completes   # 默认 must_complete_all
  child_tasks: string[]          # 显式子 Task 列表
```

| 策略 | 含义 | 30 门禁 |
| --- | --- | --- |
| `must_complete_all` | 全部子 Task `done` 后 Epic 可 CLOSE | Epic **不**直接 30 |
| `any_completes` | 任一子 Task `done` 即 Epic 可签收（文档类 Epic） | 同上 |

**升格条件（backlog）**：需 Epic 看板 / 自动推进子 Task 时，Epic 升为 **一等类** + 独立 `epic.harness.v1.json`。

**依赖约束（v1.2+）**：

- `depends_on` / `child_tasks` 引用 **须** 指向已存在 task slug。
- **禁止循环依赖** · CLI：`harness task check --no-circular`（v0.3+ · A2 与 schema 同批）。
- 检测到环 → exit 非 0 · 列出环路径 · Epic CLOSE 阻塞。

### 1.5 VersionManifest 跨版本迁移（v0.3+ 设计）

```text
upgrade vX → vY
  1. manifest.json 记录 { version, upgraded_at, from_version }
  2. AdoptedProfile：schema 字段 **只增不删** · CLI migrate 补默认值 · 未知字段保留在 _legacy
  3. InvokeSnapshot / AuditReview：**永不**因 upgrade 改写（S2）
  4. Template 实例（prompts 等）：三路合并（见 §4.3 · **base 取自产品仓**）
  5. rollback：SyncOperation.rollback(target_version) 读 manifest 快照 diff（v0.4+）
```

---

## 2. 属性与关系

### 2.1 对象属性

```yaml
# 产品 → 实例（安装 / 同步）
Preset --configures--> AdoptedProfile              [1:1]
Track --declaredIn--> TrackManifest                [1:1]   # v0.4+
Track --materializesVia--> Template                [1..*]
Template --copiedTo--> InstanceArtifact            [0..*]   # 按 Track 类型映射

WizardTool --installs--> AdoptedProfile            [1:1]
WizardTool --executes--> SyncOperation               [0..*]
SyncOperation --updates--> Template-derived files    [subset] # 非全量
SyncOperation --mayRollbackTo--> VersionManifest     [0..1]   # v0.4+

# SDD 过程链（业务仓内）
Epic --decomposesInto--> Task                      [1..*]
Task --dependsOn--> Task                           [0..*]   # task.depends_on · v1.1+
Epic --aggregatesStatusFrom--> Task                [1..*]   # 按 completion_policy
Task --governedBy--> Hat                           [1..*]
Task --hasGate--> HumanGate                        [0..*]
HumanGate --blocks--> Hat                          [1..*]   # 每 Gate ≥1 Hat · 同 Gate 内 hat_id 不重复
Hat --mayBeBlockedBy--> HumanGate                  [0..*]   # 同一 Hat 可被同 Task 多 Gate 阻塞（如 30 被 HG-AUDIT-R1 + HG-GRAPH-MODULES）
Hat --mayProduce--> InvokeSnapshot                 [0..1 per 新局]
Hat --mayProduce--> AuditReview                    [0..1 per 22 轮]
Hat --mayProduce--> FailureReport                  [0..1 per 30 失败]
Task --mustRead--> InformArtifact                  [1..*]
Task --constrainedBy--> ConstrainArtifact          [0..*]
Task --verifiedBy--> VerifyArtifact                [0..1]

# ICVO 与五轨映射
InformArtifact  ← GraphTrack + WikiTrack
ConstrainArtifact ← StandardsTrack + IDETrack
ProcessTrack → Task, Hat, Invoke, Review, FailureReport
VerifyTrack → VerifyArtifact
OrchestrateTrack → OrchestratorHat, Epic 编排（Extended · 工作区）

# 执行壳（外置 · 仅引用）
Task --executedIn--> ExecutionShell                [external]  # Cursor / Kimi Code · 插件解耦
```

### 2.2 数据属性（节选）

```yaml
Hat:
  hat_id: string                 # 稳定 ID · 如 "22-task-audit" · gate-check 解析用

Task:
  task_slug: string
  status: draft | pending | in_progress | blocked | failed | done
  test_strategy: required | recommended | not_applicable
  audit_profile: full | post_close | human_only
  git_branch: string
  depends_on: string[]           # v1.1+ · 可选

HumanGate:
  human_gate_id: string
  status: pending | approved | rejected
  blocks_hats: HatRef[]          # [{ hat_id: "30-execute" }] · 禁止重复 hat_id

AuditReview:
  audit_round: R1 | R2 | ... | CLOSE
  invoke_snapshot: path

AdoptedProfile:
  preset: string
  tracks.*: boolean
  _legacy: object                # migrate 保留的未知字段

VersionManifest:
  version: semver
  from_version: semver | null
  upgraded_at: iso8601
  sync_snapshot_id: string       # rollback 用 · v0.4+

SyncOperation:
  mode: plan | apply | rollback
  force_tracks: boolean          # FORCE_TRACKS=1
  require_clean_git: boolean     # 默认 true · 见 S5
  target_version: semver         # rollback 专用
```

### 2.3 基数约束（设计 invariant 预览）


| 关系                          | 基数             | 含义            |
| --------------------------- | -------------- | ------------- |
| Task → HumanGate            | **0..***       | 一 Task 可有多个 Gate |
| HumanGate → blocks_hats     | **1..*** · **无重复 hat_id** | 同一 Gate 内不可重复阻塞同一帽 |
| Hat → blocked_by_gates      | **0..***（同 Task 内） | 多 Gate 可叠阻塞同一 Hat（如 30） |
| Task → HG-AUDIT-R1          | 改码类 **1:1 必须** | 30 前须存在且可解析   |
| 22 每轮 → AuditReview         | **1:1 必须**     | 零阻塞也落盘        |
| InvokeSnapshot → 新帽开局       | **0..1**       | 每帽首次 §3 替换后落盘 |
| Sync → Task/Reviews/by-task | **禁止覆盖**       | 业务数据与纪律层分离    |


---

## 3. 层次结构（Hierarchies）

### 3.1 五轨（Track 特化）

```text
Track（抽象）
├── GraphTrack        → _tech_graph 模板
├── WikiTrack         → coding_wiki 模板
├── StandardsTrack    → standards 模板
├── ProcessTrack      → harness/templates + prompts + invokes
├── VerifyTrack       → ci/samples
└── IDETrack          → cursor / claude / agents fragments
```

每轨产品仓可含 `track.yaml`（**v0.4+**）：

```yaml
# 示例：harness/track.yaml
track_id: process
templates_root: harness/
sync_policy: discipline_only      # 见 S1
depends_on: []                    # 可选轨间依赖
instance_marker: .cyning-harness/tracks/process.yaml
```

#### 3.1.1 `track.yaml` / `track-schema.json`（TrackManifest · v0.4+）

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `track_id` | string | ✅ | 与 profile `tracks.<id>` 键一致 |
| `templates_root` | string | ✅ | 相对产品仓根 |
| `sync_policy` | enum | ✅ | `discipline_only` \| `install_only` \| `never` |
| `depends_on` | string[] | | 其他 `track_id` · 安装顺序 |
| `instance_marker` | string | | 业务仓实例声明路径 |
| `sync_globs` | string[] | | 覆盖默认 S1 域时的显式 glob（须 PR 审） |

JSON Schema 真值：`docs/schemas/track-schema.json`（v0.4+ · 与 `ontology.yaml` 的 `schemas.track` 互链）。

### 3.2 帽链（Hat 特化 · Starter vs Extended）

```text
Hat（抽象）
├── OrchestratorHat（00 · 工作区 Extended · 非 Starter 默认）
├── StarterHat
│   ├── RequirementsHat（10）
│   ├── TaskAuditHat（22）
│   └── ExecuteHat（30）
└── ExtendedHat（工作区 POINTER · 20/40/50/链式 PROMPT）
```

**设计决策**：

- 产品包默认闭包 = **StarterHat 子集 + ProcessTrack**。
- **ExtendedHat 仅供内部 / 签约伙伴** · 工作区 POINTER · **不**复制进用户仓 · README 须明确声明，避免社区误以为功能缺失。
- `blocks_hats` **必须**引用 `Hat.hat_id` · gate-check 动态解析 · **禁止**硬编码裸编号字符串作为唯一真值。

### 3.3 Preset 特化

```text
Preset
├── harness-only           # Process + IDE（最小）
├── fullstack-node-py      # 五轨 + quality + pytest
├── oss-fork-meta          # harness-only + 上游 PR task 模板（通用 OSS fork）
└── kimi-code-meta         # oss-fork-meta 的 Kimi Code 特化 · 见 §3.3.1
```

#### 3.3.1 `meta` 与 `bootstrap` 用语（与试点仓 kimi-code-meta 对齐）

| 用语 | 层级 | 含义 | 示例 |
| --- | --- | --- | --- |
| **meta**（过程轨 / 元层） | **实例 · 分支纪律** | 与 **main 产品轨** 分离的 Harness 过程层；承载 task / invoke / review · **不进上游 PR** | Git 分支 `cyning/meta` · 文档所称业务仓 **`kimi-code-meta`** |
| **bootstrap**（引导初始化） | **动作 · 一次性** | 在空 fork 上 **首次** 装入 Harness 纪律包的那一步 | `adopt-existing.sh --preset kimi-code-meta` · commit msg「过程轨 bootstrap」 |
| **kimi-code-meta**（Preset） | **产品 · 配置** | 面向 Kimi Code fork 的 preset：**等价于** 你对试点仓「kimi-code-meta」所期望的一键接入配置 | `wizard/profiles/kimi-code-meta.json` |

```text
kimi-code-meta（业务仓实例名）
  └── 由 preset kimi-code-meta bootstrap 一次
  └── 过程轨常驻分支 cyning/meta（meta 轨）
  └── 产品 PR 从 main → feature/*（D6 · 双分支）
```

- **`kimi-code-meta` Preset ≈ 试点里的 `kimi-code-meta` 仓**：同一意图 · 前者是产品侧可分发配置 · 后者是已运行的 BusinessRepository 实例（本地路径或 `kimi-code/` + `cyning/meta` 分支）。
- **与 `oss-fork-meta` 关系**：`kimi-code-meta` **extends** `oss-fork-meta`（继承上游 PR 模板 + 双分支纪律）+ Kimi 目录约定 + 可选 ExecutionShell 插件。
- **核心 Harness 与 Kimi Code 解耦** · Kimi 适配为可选插件（`examples/kimi-code-integration/`）· 不绑定单一 AI 后端。

**发布节奏**：**v0.3** `examples/kimi-code-integration/` 文档化手动 bootstrap · **v0.4** 正式 `wizard/profiles/kimi-code-meta.json` 内置 preset。

### 3.4 Task 特化

```text
Task（抽象）
├── CodeChangeTask    # 须 HG-GRAPH-MODULES + HG-AUDIT-R1 + test_strategy
├── DocsOnlyTask      # test_strategy 常 not_applicable
├── EpicTask          # 编排子 Task · 不直接 30 · 见 §1.4
└── UpstreamPrTask    # oss-fork 模板 · 双分支纪律
```

---

## 4. 状态机与生命周期

### 4.1 SDD 帽链（ProcessTrack 核心）

```text
[00] ──► 10 ◄──────────────────────────────────────────────┐
          │ draft/pending/in_progress                        │
          ▼                                                  │
        [20?] ──► 22(R*) ──[HG approved]──► 30 ──► 40 ──► 22(CLOSE) ──► done
          │         │                         │
          │         ├── HG pending ──► blocked ──► (approve) ──► 继续
          │         ├── HG rejected ──► task.status=draft ──► 10（强制）
          │         └── 30 失败 ──► FailureReport ──► failed ──► 22 或 10
          └── 否决 ──► 10
```

**FailureReport 联动（模板级 · v0.3+）**：10 / 22 Prompt **须**检查 task 是否关联 `FailureReport`；若存在，`failed` 原因与退回路径须在 Review / 需求节 **显式引用** 该 Artifact 路径。

| 转移      | 条件                                              |
| ------- | ----------------------------------------------- |
| → 30    | `HG-AUDIT-R1 = approved` **且** 22 无内容阻塞         |
| 30 拒开工  | 任一 blocking gate = pending · 或 failure_paths 缺失 → **blocked** |
| 30 执行失败 | 产出 **FailureReport** · task.status → **failed** · 维护者选择退回 22 或 10 |
| HG rejected | 记录否决理由 · task.status → **draft** · **强制** 回 10 | 
| → CLOSE | 22 终轮「签收/关闭」节 + task status → done              |
| 10 重入   | 来自 20 否决 · HG **rejected** · 30 **failed**（含 FailureReport） |


| Task.status | 含义 | 恢复路径 |
| --- | --- | --- |
| `blocked` | Gate pending 或 30 拒开工 | Gate approved → 继续 30 |
| `failed` | 30 执行失败已落 FailureReport | 退回 22 修复 或 退回 10 重定范围 |

### 4.2 HumanGate

```text
pending ──(maintainer approve)──► approved
pending ──(maintainer reject)──► rejected
         │                              │
         │                              ├── 记录 reject_reason（gate-check / task 表格）
         │                              ├── task.status → draft
         │                              └── **强制退回 10**
pending ──(Agent 30 扫描)──► BLOCKED（运行时 · 非持久 status）──► TEMPLATE_30_gate_stop
```

| status | 22 行为 | 30 行为 | 后续 |
| --- | --- | --- | --- |
| `pending` | 可产出 Review · **禁止**附 30 Prompt（D2） | **BLOCKED** | — |
| `approved` | 正常 | 允许开工 | — |
| `rejected` | 须记录 `reject_reason` | **禁止** | **强制退回 10** · task.status → `draft` |

**gate-check 行为（v0.3+）**：解析到 `rejected` 时写入 `.cyning-harness/gate-check.log` · 若 task.status 仍为 `in_progress` 则 **警告** 并建议改 `draft`。

### 4.3 安装与同步（AdoptedProfile）

```text
Uninstalled
    │ install.sh + preset
    ▼
Installed（profile.json + 首次 copy）
    │ harness-sync apply（S5 git-clean 检查）
    ▼
Synced（纪律层文件 = 产品包选定版本）
    │ upgrade / npx harness upgrade（v0.3+）
    ▼
Synced(vY)（manifest.version 更新 · 三路合并）
    │ SyncOperation.rollback(target_version)（v0.4+）
    ▼
Synced(vX)（纪律层回滚 · Task/Reviews 仍受 S2 保护）
```

**不变式**：`Synced → Synced` **never** 覆盖 Task / AuditReview / invokes/by-task / 已填 Inform 正文。

**三路合并（upgrade 时 · v0.3+ 设计 · v0.4 实现）**：

```text
base     = 产品仓 DisciplinePackage@from_version 的原始 Template（ tarball / npm 包内 · **非** 业务仓旧实例）
ours     = 业务仓当前实例（用户 sync 后改写的 prompts/22-*.md 等）
theirs   = 产品仓 DisciplinePackage@target_version 的原始 Template

冲突 → 写 *.merge 文件 + 冲突清单 · **必须人工 resolve** 后方可 continue apply · **禁止** auto-skip 或静默覆盖
无冲突 → 自动合并 · 仍须 plan 可见 diff（S4）
```

**plan 预检（v0.3+）**：`harness sync plan` / `upgrade plan` 对 S1 域文件比较 **ours vs theirs** 哈希或 diff · **提前** 列出「将冲突」清单 · 不必等到 apply 才失败。

用户改写过的 Template 实例：**默认保留用户修改** · 非强制覆盖 · **冲突一律人工介入**（无「渐进简化」分支 · 见 v1.1 设计讨论）。

### 4.4 AuditReview 轮次

```text
R1 ──(内容阻塞)──► task 回填 ──► R2 ── … ──► CLOSE
R1 ──(零阻塞 + 人签)──► 30 允许
30 failed ──► FailureReport ──► 22(R*) 追加轮次
```

---

## 5. 关键规则与公理（Axioms）

### 5.1 产品结构公理


| ID     | 公理                                                          |
| ------ | ----------------------------------------------------------- |
| **P1** | 产品包 **不含** 业务代码、LLM Runtime、MCP Host                        |
| **P2** | 单源模板在产品仓；业务仓为 **实例**，自行维护增量                                 |
| **P3** | `refuse_if_product_root`：禁止对 `cyning-harness` 自身 apply sync · CLI **硬检查** + 友好提示 |
| **P4** | IDE 合并仅用 `<!-- cyning-harness:begin/end -->` marker 区       |


### 5.2 同步公理


| ID     | 公理                                                               |
| ------ | ---------------------------------------------------------------- |
| **S1** | 默认 sync 域：`harness/prompts`、`invokes/TEMPLATE`、IDE 规则/fragment   |
| **S2** | **禁止** sync 覆盖：`docs/tasks/`**、`reviews/**`、`invokes/by-task/**` · **新 Artifact 类型入 sync 域前须更新本列表** |
| **S3** | 图谱/wiki **仅** install 或 `FORCE_TRACKS=1` 重拷                      |
| **S4** | sync 前须 `plan` 可见 diff（人机信任）                                     |
| **S5** | sync/apply 前检测 Git 工作区干净 · 否则 **警告** 或要求 `--force`（v0.3+）        |
| **S6** | rollback **不得** 触及 S2 保护域 · 仅恢复纪律层 Template 实例（v0.4+）          |


### 5.3 SDD 过程公理


| ID     | 公理                                                  |
| ------ | --------------------------------------------------- |
| **D1** | 每次 22 **必须** 产出 `AuditReview`（零阻塞须写明）               |
| **D2** | `HG-AUDIT-R1 = pending` 时 22 **禁止** 附 30 Prompt     |
| **D3** | 30 首输出 **必须** 扫描 task 闸表（见 `TEMPLATE_30_gate_stop`） · 目标 CLI：`gate-check` |
| **D4** | 改码 task 开工前 `HG-GRAPH-MODULES = approved`（D4-a）     |
| **D5** | `test_strategy=required` → 须先失败测试再实现（或同 PR 可见红过）    |
| **D6** | 上游 OSS PR **不得** 含 ProcessTrack / Harness 纪律层实例（双分支 · 见 **D6-a**） |
| **D7** | `git_branch ∈ {main, master}` 的 Task 须 `HG-RELEASE = approved` 方可合并/发布（v0.4+ · HumanGate） |

**D6-a · 上游 PR 禁止路径（机械检查）**：

```text
docs/harness/**          # prompts · invokes · reviews · POINTER
docs/tasks/**
.cyning-harness/**
.cursor/rules/*harness*    # 含 06-harness-pointer 等
AGENTS.md / CLAUDE.md 内 cyning-harness marker 区段（整文件若仅含 marker 亦禁止）
```

试点自检命令（与 PILOT 一致）：`git diff upstream/main --name-only` 不得命中上列路径。


### 5.4 ICVO 映射公理


| 支柱            | 产品轨                | 实例类                                 |
| ------------- | ------------------ | ----------------------------------- |
| **Inform**    | Graph + Wiki       | InformArtifact                      |
| **Constrain** | Standards + IDE    | ConstrainArtifact                   |
| **Verify**    | CI samples + 22/40 | VerifyArtifact + AuditReview + 自检结论 |
| **Orchestrate** | ProcessTrack（Extended） | OrchestratorHat · Epic 编排 · Invoke 索引 · Handoff |


**Guides（Hat）** 叠加于 ICV 之上；**Orchestrate** 管过程编排与 Extended 帽 · **不替代** Verify（CI）。

**CLI 审计目标（v1.0）**：`harness audit` / `harness check` 机械执行 D3、D5、S5 子集。

---

## 6. 物理映射表（类 → 路径）


| 类                      | 产品包路径                                | 业务仓实例路径                                  |
| ---------------------- | ------------------------------------ | ---------------------------------------- |
| GraphTrack 模板          | `graph/templates/` · `graph/track.yaml` | `docs/_tech_graph/`                      |
| WikiTrack 模板           | `coding_wiki/templates/` · `track.yaml` | `docs/coding_wiki/`                      |
| StandardsTrack         | `standards/` · `track.yaml`          | `docs/standards/`                        |
| ProcessTrack · Task 模板 | `harness/templates/` · `track.yaml`  | `docs/tasks/`                            |
| ProcessTrack · Hat     | `harness/prompts/`                   | `docs/harness/prompts/`                  |
| InvokeSnapshot 模板      | `harness/invokes/TEMPLATE_invoke.md` | `docs/harness/invokes/`                  |
| InvokeSnapshot 索引      | —                                    | `.cyning-harness/invoke_index.json`（sync --index · v0.4+） |
| VerifyTrack            | `ci/samples/` · `track.yaml`         | `.github/workflows/`                     |
| IDETrack               | `ide/adapters/` · `track.yaml`       | `.cursor/rules/`、`CLAUDE.md`、`AGENTS.md` |
| AdoptedProfile         | —                                    | `.cyning-harness/profile.json`           |
| VersionManifest        | —                                    | `.cyning-harness/manifest.json`（v0.3+）   |
| GateCheckRun 日志        | —                                    | `.cyning-harness/gate-check.log`（追加 · 审计） |
| TrackManifest（实例）      | —                                    | `.cyning-harness/tracks/*.yaml`          |


---

## 7. 基于本体的产品设计含义

### 7.1 核心枢纽（实现优先级）


| 枢纽                                               | 说明                                  |
| ------------------------------------------------ | ----------------------------------- |
| **ProcessTrack × Hat × HumanGate × AuditReview** | 产品差异化核心 · Starter 须闭环               |
| **SyncOperation 边界（S1–S6）**                      | wizard 正确性的根本 · npx CLI 须复用同一 apply |
| **Preset → AdoptedProfile**                      | 安装 UX 的单一配置真值                       |
| **MarkerBlock**                                  | 多 IDE 不分裂 AGENTS/CLAUDE 真值          |
| **ICVO 四支柱**                                   | 对外叙事 · Inform/Constrain/Verify/Orchestrate |


### 7.2 当前薄弱类（v0.2 缺口）


| 类 / 关系                  | 缺口            | 设计 backlog · 建议 Issue 标签        |
| ----------------------- | ------------- | ------------------------------ |
| **VersionManifest**     | 未实现           | A1 · npx upgrade · `enhancement` |
| **SyncOperation.rollback** | 未实现        | A1-b · manifest 快照 · v0.4    |
| **Hat · 40-self-check** | Starter 未含    | A2 闭包 · `enhancement`            |
| **Task × JSON Schema**  | 仅 Markdown 约定 | `task.harness.v1.json` · A2      |
| **InvokeSnapshot 索引**   | 无机器索引         | `invoke_index.json` · sync --index |
| **gate-check --graph**  | 部分实现          | Q3 产品化 · D4-a 可视化            |
| **ExtendedHat**         | 与 Starter 双真值 | POINTER 文档化 · 不开源全文 · README 声明 |
| **ontology.yaml**       | 未抽取           | v0.4 · `harness ontology-check`  |
| **FailureReport**       | 未模板化           | v0.3 · 30 失败路径                 |
| **kimi-code-meta** preset | examples v0.3 · profiles v0.4 | `examples/kimi-code-integration/` · `enhancement` |
| **Harness Graph Model** | 未实现 · 对话已归档 | [`../graph/HARNESS_GRAPH_MODEL_design_v0_zh.md`](../graph/HARNESS_GRAPH_MODEL_design_v0_zh.md) · v0.5+ |


### 7.3 扩展规则（加新功能时）


| 若要加…        | 须先…                                                                  |
| ----------- | -------------------------------------------------------------------- |
| 新 Track     | 定义 Track 类 → `track.yaml` → Template 路径 → profile.json `tracks.*` → install/sync 分支 |
| 新 Hat       | 定义 Hat 子类 + **hat_id** → 是否入 Starter → invoke 模板 §3 → SDD_HAT_FLOW 编号 |
| 新 HumanGate | 定义 blocks_hats（HatRef）→ gate-check.sh 解析 → 30/22 联动文案                       |
| 新 Preset    | 新建 profiles JSON → ONBOARDING 菜单 → 不破坏 S1–S6                         |
| 新 Artifact 类型 | 定义与 Task/Hat 关系 → **更新 S2 禁止覆盖列表** → sync plan 须显示该类路径 · 更新 §6 映射 |


### 7.4 v0.3 设计约束（来自本体）

```text
npx CLI  ≡  WizardTool 新实例
         → 读 VersionManifest
         → 下载 DisciplinePackage@version
         → 调用同一 harness-sync.sh apply（S5 · S4 plan）
         → 不得新增「绕过 S2 的写路径」
```

### 7.5 与同类工具的差异（对外简述）

| 维度 | cyning-harness | LangChain / Semantic Kernel 等 |
| --- | --- | --- |
| 定位 | **纪律包** · SDD 过程审计 | Agent 编排 / 工具链 SDK |
| 过程落盘 | AuditReview · InvokeSnapshot · HumanGate | 通常无一等过程制品 |
| ICVO 分离 | Inform / Constrain / Verify / Orchestrate 显式映射 | 上下文与工具混编 |
| 同步边界 | S2 铁律 · 不覆盖用户 Task | 不适用 |
| AI 后端 | ExecutionShell 外置 · 插件可选 | 常绑定模型/provider |

---

## 8. 与 SDD 编号对照（快速查）


| 编号  | Hat 类           | 必落盘类             |
| --- | --------------- | ---------------- |
| 00  | OrchestratorHat | —（Handoff / KPI · Extended） |
| 10  | RequirementsHat | Task（更新）         |
| 20  | SpecReviewHat   | —（对话 · Extended） |
| 22  | TaskAuditHat    | **AuditReview**  |
| 30  | ExecuteHat      | 代码 diff · **FailureReport**（失败时） |
| 40  | SelfCheckHat    | Task.自检结论 · Extended Starter 待 A2 |
| 50  | ReinspectHat    | 可选 Review · Extended |


---

## 9. 开放问题（初稿待收敛）


| #   | 问题                                              | 建议决策方向                     |
| --- | ----------------------------------------------- | -------------------------- |
| Q1  | Epic 是否升格为一等类（独立 schema）？                       | **v1 暂为 Task 特化** · 模板增 `depends_on` · 看板需求再升格 |
| Q2  | `invokes/by-task/<slug>/` 是否纳入本体索引？             | **是** · InvokeSnapshot 聚合容器 · `invoke_index.json` 由 sync --index 生成 |
| Q3  | graph 模块表 `HG-GRAPH-MODULES` 是否产品化进 gate-check？ | **是** · `gate-check --graph` 输出依赖模块图 + 审核状态 |
| Q4  | KPI（00）是否进 Starter？                             | **否** · 保持 Extended            |
| Q5  | 是否支持热插拔 Track（动态启停轨而不 reinstall）？              | **v0.5+ 再议** · 须改 profile + 部分 sync · 复杂度高 |


---

## 10. 对 v1.0 评审意见的采纳说明（2026-06-15）

| 评审点 | 采纳 | 落点 |
| --- | --- | --- |
| 元本体 / 维护规则 | ✅ | §0.1 |
| 实现分阶段（防过度设计） | ✅ | §0.2 |
| VersionManifest 迁移 | ✅ | §1.5 |
| Epic 编排 / depends_on | ✅ | §1.4 · Task.depends_on |
| Sync rollback + 三路合并 | ✅ 设计 · v0.4 实现 | §1.3 · §4.3 · S6 |
| HumanGate rejected + HatRef | ✅ | §2.2 · §4.2 |
| SDD 异常态 / FailureReport | ✅ | §4.1 · Task.status |
| S5 git-clean · D7 HG-RELEASE | ✅ | §5.2 · §5.3 |
| ICVO 第四支柱 Orchestrate | ✅ | §5.4 |
| track.yaml · gate-check.log | ✅ | §3.1 · §6 |
| kimi-code-meta preset | ✅ 更名 · 与试点仓对齐 | §3.3.1 |
| HumanGate rejected → 10 | ✅ **已锁定** | §4.2 |
| 三路合并冲突 | ✅ **人工介入 · 禁止 auto-skip** | §4.3 |
| ExtendedHat README 声明 | ✅ | §3.2 |
| ontology.yaml 机器可读 | ✅ v0.4+ | §0.1 · §7.2 |
| Q5 热插拔 Track | ✅ 延后 | §9 Q5 |
| README 设计哲学 / 对比表 | ⏳ 实现期 | §7.5 摘要 · 完整版进 README（A3 前） |
| examples/kimi-code-integration | ⏳ v0.4 | §3.3 · §7.2 backlog |

---

## 11. 对 v1.2 评审意见的采纳说明（2026-06-15）

| 评审点 | 采纳 | 落点 |
| --- | --- | --- |
| 外部贡献 / 最小变更清单 | ✅ v1.0 后 | §0.3 |
| `ontology.yaml` 骨架 | ✅ v0.4 实现 | §0.4 |
| `track.yaml` schema | ✅ | §3.1.1 · track-schema.json |
| depends_on 禁环 | ✅ v0.3 CLI | §1.4 |
| 三路合并 base 澄清 | ✅ | §4.3（产品仓原始 Template） |
| plan 预检冲突 | ✅ v0.3 | §4.3 |
| HumanGate 基数细化 | ✅ | §2.1 · §2.3 |
| 状态图 draft/rejected | ✅ | §4.1 · §4.2 |
| FailureReport → 10/22 引用 | ✅ 模板级 | §4.1 |
| gate-check rejected → draft | ✅ v0.3 | §4.2 |
| D6 路径枚举 D6-a | ✅ | §5.3 |
| kimi-code-meta v0.3 examples | ✅ | §3.3.1 · §7.2 |
| GitHub Issues 预建 | ⏳ push 前 | §7.2 标签 · 非本体 |
| README / 博客 / 最小闭环 | ⏳ **优先实现** | 见下节 §11.1 |

### 11.1 下一步优先级（评审共识 · 非本体变更）

```text
P0  最小 v0.2 闭环（harness-only · sync plan/apply · 10→22→30 金样）
P1  gate-check 基础 · README Quick Start + §7.5 展开
P2  examples/kimi-code-integration（v0.3）· 第一篇对外博客
P3  v0.2.0 tag · Kimi 社区触达 · 简历链 GitHub
```

**原则**：v1.2 本体 **冻结至 v0.2 闭环跑通**；实现中发现的缺口走 §12 小版本修订，不再做大改。

---

## 12. 修订记录


| 版本   | 日期         | 说明                                 |
| ---- | ---------- | ---------------------------------- |
| v1.0 | 2026-06-13 | 初稿：产品包/实例域 · 五轨 · SDD 公理 · v0.3 约束 |
| v1.1 | 2026-06-15 | 吸收外部评审：元本体 · ICVO · 异常态 · 迁移/rollback · Epic 编排 · S5/S6/D7 · track.yaml · Q5 |
| v1.1.1 | 2026-06-15 | Preset 更名 `kimi-code-meta` · §3.3.1 meta/bootstrap 用语 · 锁定 rejected→10 · 合并冲突强制人工 |
| v1.2 | 2026-06-15 | v1.2 评审：§0.3 贡献清单 · §0.4 ontology.yaml · track-schema · D6-a · 合并 base 澄清 · plan 预检 · 状态图细化 · depends_on 禁环 |

