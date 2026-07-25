# SPEC：SPEC 审查文留档闸（20-spec-audit / HG-SPEC-SIGNOFF 存在性检查）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收」）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **上游**：[`PLAN_post_g4_next_mechanization_v1_zh.md`](../../../docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md) · N3 · G2 姊妹  
> **前置**：G2 `@cyning/harness@2.5.0`（`findReview`）· N1 `@2.7.0`（`lifecycle.yaml`）  
> **下游**：00 已起草 task → 20-task-audit → HG-AUDIT-R1 → 30（目标版本 **v2.8.0**）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `spec-reviews-retention-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | `findSpecReview` 命名变体 + `verify --spec` 三态（pass/block/豁免）+ bugfix 豁免；既有 `verify --task` 回归不改 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-spec-reviews-retention-gate/invoke_20260725_10_spec_spec_reviews_retention_gate.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

G2（v2.5.0）已把 **task** 侧「R&lt;n&gt; 审查文存在」机械化为 `verify --task` / `task close` 检查 6。功能轨上游对称缺口仍在：

- [`20-spec-audit.md`](../../harness/prompts/20-spec-audit.md) 要求落盘 `reviews/spec_<slug>_audit_R<n>_*.md`（或既有 `*_spec_ACCEPT_R*` 惯例）；
- **`HG-SPEC-SIGNOFF` 可由对话「签收」完成，签署依据（SPEC 审查文）存在性零机械**——与 G2 补闸前的 task 侧同构。

**dogfood（2026-07-25）**：产品仓 `docs/spec/SPEC-*.md` **5** 份近期 SPEC（含 G1–G4 / N1+N2）**均无**对应 `spec_*_audit_R*` / `*_spec_ACCEPT_R*` 文；工作区仅有少量历史 `spec_*_ACCEPT_*` / `*_spec_ACCEPT_*`。说明当前主流是「对话签收 + 跳过 20-spec-audit 落盘」。

**目标**：补上 SPEC→task 纸链的对称闸——机器只查**审查文存在性**；审查结论仍由人签 `HG-SPEC-SIGNOFF` 覆盖。

**职责切分（同 G2）**：机器 = 形式（文件在）；人 = 实质（通过/条件通过）。

---

## 2. 范围

### D1 · `findSpecReview`（`lib/task-meta.js` 或邻近模块）

- 输入：`specFile` + `target`（reviews 根所在仓）+ 可选 `workspaceRoot`（SPEC 在产品仓、reviews 在工作区时）
- 匹配（任一命中即 `found`；取最新轮）：
  1. **推荐**：`spec_<slug>_audit_R<n>_*.md`
  2. **兼容**：`spec_<slug>_ACCEPT_R<n>_*.md`
  3. **兼容**：`task_<slug>_spec_ACCEPT_R<n>_*.md`（工作区历史惯例）
- slug 来源：优先 SPEC 表 `spec_slug`；否则自文件名剥离 `SPEC-` / `_v\d+` / 扩展名后 `normalizeSlug`
- 文件名与 slug：**两侧**下划线/连字符等价；版本后缀 `_v\d+` 双侧剥离（复用 G2 R1-B1 思路）
- 返回：`{ found, latest, rounds[], matched_pattern? }`

### D2 · CLI 挂点：`verify --spec FILE`

- **新模式**（与 `--task` 互斥）：`npx @cyning/harness verify --spec PATH [--target PATH] [--workspace-root PATH] [--json] [--allow-no-spec-review]`
- 行为：
  - 审查文存在 → `VERIFY: PASS`（或等价摘要）· exit 0
  - 缺失 → `VERIFY: BLOCKED · missing SPEC R<n> review` · exit 2
  - `--allow-no-spec-review` → warn 放行 · 留痕
- `--json`：`may_start_00`（或 `spec_review_ok`）· `spec_review_found` · `spec_review_latest` · `blocked_reason`
- **不**改动既有 `verify --task` / 无参全量模式语义（N4 仍另议）
- **不**把本闸挂进 `verify --task`（挂点错误：30 查的是 task 审查文，不是 SPEC）

### D3 · bugfix / 跳过 10-spec 豁免

满足任一则 **不**要求 SPEC 审查文（exit 0 + 可选 info 行）：

- SPEC / 元信息显式：`track: bugfix` 或 `skip_spec_audit: true`（字段名以实现为准 · 文档冻结）
- CLI：`--allow-no-spec-review`（通用泄压，含历史对话签收存量）

### D4 · lifecycle 登记

- `harness/lifecycle.yaml` 新增转移（建议 id：`to_00` 或 `spec_signoff`）：
  - from：spec draft / signed 相关状态（可用注释说明别名；本波允许最小 states 扩展或仅在 transitions 注释）
  - to：可起草 task
  - guard：`spec_reviews_retention` · severity=`block` · `allow_flag: --allow-no-spec-review`
- **只登记 · 不实现引擎**（同 N1）

### D5 · 文档 / 版本

- `20-spec-audit.md` / ONBOARDING 或 USER_GUIDE：注明 v2.8+ `verify --spec` 机械强制存在性
- CHANGELOG **v2.8.0**（行为新增 · minor；醒目说明 + 豁免指引）
- PLAN / rethink 矩阵回链本 SPEC

### D6 · 测试

- 命名三变体命中；slug 连字符/下划线；版本后缀
- verify `--spec` 三态 + bugfix 豁免 + 与 `--task` 互斥用法
- 既有 verify/close/lifecycle 回归绿

---

## 3. 非范围

- 审查文**内容**判定（pass / conditional_pass / fail）——人/20-spec-audit 职责
- 强制给**存量** 5 份已对话签收的产品 SPEC 补审（可用豁免；另开 hygiene 可选）
- 把 SPEC 审查闸挂进 `verify --task` 或 `task close`
- N4：verify 无 `--task` 全量模式纳入 task reviews
- 自动代签 `HG-SPEC-SIGNOFF`；状态机引擎执行 `to_00`
- 统一历史所有命名为单一范式（本波只兼容读取）

---

## 4. 验收标准

- [ ] `findSpecReview`：推荐名 / `ACCEPT` / `task_*_spec_ACCEPT_*` 均可 `found`；多轮取最新
- [ ] `verify --spec`：有文 → PASS；无文 → BLOCKED exit 2；`--allow-no-spec-review` → warn 放行
- [ ] bugfix / `skip_spec_audit` → 不要求审查文
- [ ] `--json` 含 `spec_review_found`（或等价）且 **不**破坏 `--task` handoff 字段
- [ ] lifecycle.yaml 已登记 `to_00`（或等价）+ `spec_reviews_retention` guard
- [ ] `npm test` 全绿；CHANGELOG v2.8.0；文档可链到
- [ ] dogfood：对本 SPEC 走通「20-spec-audit 落盘 → `verify --spec` PASS」（实现波自检）

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 00 前无 SPEC 审查文 | `VERIFY: BLOCKED · missing SPEC R<n> review` | 跑 20-spec-audit 落盘；或 `--allow-no-spec-review` |
| SPEC 在产品仓、reviews 在工作区 | 未传 `--workspace-root` / 错 `--target` → 误报缺失 | 按文档传参后重跑 |
| 命名不在兼容列表 | 视为缺失 | 按推荐名重命名或补一份推荐名 |
| bugfix 轨被误挡 | 应走 D3 豁免；若未标 track → 用 allow 旗 | 补元信息 |
| 业务仓未升级 2.8.0 | 无 `--spec` 模式 · 行为不变 | upgrade |

---

## 6. 依赖与引用

- G2：`findReview` / `--allow-no-review` 模式；本波 **独立** flag `--allow-no-spec-review`（审计痕迹不混）
- N1：`lifecycle.yaml` 挂点登记
- 纪律：`harness/prompts/20-spec-audit.md` · `10-spec-requirements.md`（bugfix 跳过）
- PLAN N3；G2 SPEC 非范围「SPEC 审查文——下一轮」本 SPEC 关闭该句

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：PLAN N3；G2 SPEC（非范围点名本缺口）；`20-spec-audit` 命名双惯例；`findReview` 实现；lifecycle.yaml 仅有 task 转移；dogfood：5/5 产品 SPEC 无 spec 审查文。约束：挂点时刻须晚于审查文应存在时刻；不误伤 bugfix；不把闸错挂到 `--task`。

### R1 · 范围 / 非范围 / 场景

**场景**：① 维护者/Agent 在 00 起草 task 前跑 `verify --spec`，挡「对话签了但无审查文」；② 20-spec-audit 多轮 R1→R2 取最新；③ 历史 `*_ACCEPT_*` 命名仍认；④ bugfix 无 10-spec 不挡。  
**同构 G2、异挂点**：共享「存在性闸」模式，但消费者是 **SPEC→00**，不是 **task→30**。  
**非范围**：内容判定、存量强制补审、挂进 task verify/close——避免双重计费与挂点错位。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| 严格度 | warn 起步 / block+allow | **block + `--allow-no-spec-review`** | 与 G2 同构；warn 等于再留自觉层。dogfood 存量用豁免，不降级整闸 |
| CLI 形态 | 独立 `spec check` / 并入 `verify --spec` | **`verify --spec`** | 与 G2 叙事一致（「verify = 下一转移前置」）；少一个动词 |
| 挂点 | `--task` 附带查 SPEC / 仅 `--spec` / close | **仅 `--spec`** | `--task` 时 SPEC 链路可能已结束；close 查 SPEC 无审计价值 |
| 命名 | 只认推荐 / 兼容 ACCEPT | **推荐 + 两兼容** | 20-spec-audit 已写双惯例；工作区有 ACCEPT 实档 |
| reviews 根 | 仅 SPEC 所在仓 / 可 workspace-root | **支持 `--workspace-root`（或 `--target` 指 reviews 仓）** | 产品 SPEC × 工作区 reviews 是本仓常态 |
| 豁免旗 | 复用 `--allow-no-review` / 独立 | **独立 `--allow-no-spec-review`** | 与 task 审查豁免分迹 |
| 版本 | 2.7.x patch / 2.8.0 | **2.8.0** | 新 blocking 模式 · minor |

### R3 · 边界 / 失败语义 / 安全

- **存量**：5 份已对话签收 SPEC 不自动被扫；仅在有人执行 `verify --spec` 时暴露 → 豁免或补 20-spec-audit。
- **误报**：形式宽容止于「slug 匹配 + 兼容模式名」；不接受任意含 spec 字样的文件。
- **安全**：只读检查；不写盘、不代签人闸。
- **兼容**：无 `--spec` 的旧调用链行为不变。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。fixture：三命名 · 互斥参数 · block/pass/allow · bugfix 跳过；回归 verify-task / lifecycle show。实现波 dogfood：本 SPEC 的 20-spec-audit 文 + `verify --spec` PASS。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

自足：挂点、命名、豁免、lifecycle 登记、版本均已裁定。**可交 00**：建议单 task `cyning-harness-spec-reviews-retention-gate`。图谱无需 bootstrap。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 对话签收文化可能继续依赖豁免旗——须文档把「00 前 verify --spec」写成默认；② SPEC 路径与 reviews 仓分裂时 Agent 漏传 workspace-root → 误 BLOCKED；③ 是否在 00 帽 Prompt 增加「开工前 GATE_VERIFY_SPEC」句，属文档同步，实现时对照 10-spec/00 模板 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-25 | 10-spec R0–R5（维护者点菜「继续 N3」）· dogfood 5/5 无 spec 审查文 |
| 2026-07-25 | 维护者签收（对话「签收」）· → 00 起草 task |
