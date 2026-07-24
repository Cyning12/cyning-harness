# SPEC：task lint · task md 结构闸 + 文本规则包（v1）

> **状态**：`done`（10-spec R0–R5 已回填 · **维护者已签收 2026-07-24** · → 00 起草 task）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **上游思考**：[`docs/rethink/2026-07-mechanization-rate/`](../rethink/2026-07-mechanization-rate/)（缺口 G1 + G3 · P0/P1）  
> **下游**：SPEC 签收 → 00 起草 task → 10-task

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `task-lint-structure-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | 每条 lint 规则均可 fixture 驱动 fail/pass 路径；机械闸无测试不上线 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-task-lint-structure-gate/invoke_20260724_10_spec_task_lint_structure_gate.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

机械化率审计（rethink 02/03）发现：**task md 正文没有任何结构闸**——`task check` 只验 sidecar JSON，10 帽规定的必填节（元信息/状态行/验收标准/failure_paths/自检结论）缺失或占位时，下游所有帽（22 审、verify、close）都在消费一个未验证的输入假设。22/10 两帽合计 8 条规范全帽零机械，属「invoke 失守」同构问题，只是还没爆。

**目标**：新增 `harness task lint` —— task md 的结构与文本规则检查器（G1 + G3），让 10 产出、22 审查、维护者自查有一条机械命令可跑；每条规则有 fail 路径测试，形式宽容、实质严格。

**第一波刻意小步**：只做独立命令，不改 `verify` 聚合行为（不误伤存量在途 task，见 R2 裁定）。

## 2. 范围

- **D1 · `lib/task-lint.js`（新增）**：规则引擎 + 规则集（§4 对照表），输出结构化 `{ok, errors[], warnings[], file, slug}`。
- **D2 · CLI 路由（`lib/cli.js`）**：`task lint --file PATH [--json]`；`LINT: PASS/FAIL · <file>` 末行协议；help/usage 同步。
- **D3 · 测试**：`test/task-lint.test.js` fixture 覆盖每条规则的 fail/pass + warn 路径。
- **D4 · dogfood 报告**：对工作区 `Projects/docs/harness/tasks/active/*.md` 全量跑一遍，结果（通过/违规分布）写进 task 的自检结论——**只报告，不要求存量合规**。
- **D5 · 文档**：CHANGELOG + 版本 **v2.3.0**（minor · 新增子命令）；`harness/prompts/10-requirements.md` 交接物节补一行「产出 task 须 `task lint` PASS」。

## 3. 非范围

- **不改 `verify` 聚合**（lint 结果不接入 may_start_30；dogfood 后另议，见 R2 弃选项）
- **不做 G2**（reviews 留档闸）——第二波独立 SPEC
- **不做 G4**（思考轮槽位/控制表结构检查）——第三波，宽容度需独立 dogfood（对 04 列表的修正，见 R1）
- **不做 invoke 文件「预写 approved」grep**——误报不可控（见 R2 分析）
- 不自动修复（no autofix）；不 lint 工作区 Extended 帽模板；不改 sidecar `task check` 行为

---

## 4. 验收标准（规则集即验收表）

**E 级（error · exit 2）**：

- [ ] E1 缺 `## Harness 元信息` 节或表内无 `task_slug`
- [ ] E2 缺 `> **状态**` 行（首 token 提取规则与 task-close 一致）
- [ ] E3 缺 `## 验收标准` 节，或节内无任何 `- [ ]`/`- [x]`/`- [X]` 勾选项
- [ ] E4 缺失败路径节（接受 `## 失败路径` 或含 `failure_paths` 的标题 —— 形式宽容）
- [ ] E5 缺 `### 自检结论` 节（内容为占位符**不**算 error —— draft 期占位合法）
- [ ] E6 正文含绝对本机路径（`/Users/`、`/home/`、`/root/`、`[A-Za-z]:\Users\`），输出行号
- [ ] E7 文件名 slug ≠ 元信息 task_slug（`normalizeSlug` 双侧规范化 · 复用 task-close 同款）

**W 级（warn · 不影响 exit）**：

- [ ] W1 状态行首 token 不在已知词表（draft/pending/in_progress/active/deferred/done/completed）
- [ ] W2 缺 `### 人工闸` 节（轻量 task 可豁免，提醒而非阻塞）
- [ ] W3 `### 自检结论` 为占位符（提示：close 前须回填）

**协议与行为**：

- [ ] 全过 exit 0 + `LINT: PASS · <file basename>`；任一 E 级 exit 2 + `LINT: FAIL · <file>` + 逐条列表（含行号可得时）
- [ ] `--json` 输出统一契约 `{ok, errors[], warnings[], file, slug}`（方向三契约的首个落地实例）
- [ ] `npm test` 全绿（每条 E/W 规则有 fail/pass 用例）
- [ ] dogfood：工作区 active tasks 全量 lint 报告落 task 自检结论
- [ ] CHANGELOG 记 v2.3.0

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| --file 缺失/文件不存在 | exit 1 · usage 错误（与 task close 一致） | 修正参数 |
| 任一 E 级违规 | exit 2 · `LINT: FAIL` · 逐条列出 · 不改文件 | 修复后重跑 |
| 仅 W 级 | exit 0 · warn 行列出 | — |
| 存量 task 大量违规 | 不影响（独立命令 · 无 verify 联动） | dogfood 报告记录 |
| 标题写法变体（如 `## 失败路径表`） | E4 判定含 `失败路径`/`failure_paths` 子串即过（宽容） | 误报则 dogfood 期调正则 |
| 业务仓未升级到 2.3.0 | 旧版 CLI 无此命令 · 行为不变 | upgrade |

---

## 6. 依赖与引用

- 复用：`lib/task-meta.js`（`parseHarnessMeta` / `extractSection` / `extractTaskSlug` / `normalizeSlug`）、`lib/paths.js`
- 挂点先例：`lib/task-close.js`（状态行/占位符/勾选解析规则同源——**抽到共享层而非复制**，见 R2）
- 缺口出处：`docs/rethink/2026-07-mechanization-rate/02_discipline_inventory.md`（A9/D1–D4/E1 条目）、`03_coverage_matrix.md` §2（G1/G3 行）
- 测试模式：`node --test` + mkdtemp fixture（`test/task-close.test.js` 模式）

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：rethink 系列 02/03/04（G1+G3 缺口定义与优先级）；task-close v2.2 实现（可复用解析与已踩过的坑：slug 规范化、占位符正则、状态词表）；04 的波次划分。约束：本阶段只产 SPEC；第一波不改 verify 行为是维护者可见的保守选择。

### R1 · 范围 / 非范围 / 场景

场景：① 10 帽产出 task 后自查（主）；② 22 R1 审查时辅助（审查文可引用 lint 结果作「已核对项」）；③ 维护者批量体检存量。**对 04 的一处修正**：04 把「（阶段 C）R0–R5 槽 + 控制表字段」列入第一波必填节，但 03 把 G4 排 P1/第三波——两者张力按 **03 为准**裁定：思考轮结构检查整体归第三波。理由：工作区 task 的思考轮写法变体多（有的内嵌 §5、有的独立文件、有的只在 SPEC），宽容度设计需要独立 dogfood，不应搭上 P0 的车。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| 命令形态 | 独立 `task lint` / 并入 `task check` | **独立** | check=sidecar JSON · lint=md 正文，关注点不同；改名会 break check 现有用户 |
| verify 聚合 | 接入并阻塞 / 接入仅 warn / 不接入 | **不接入（本波）** | 存量在途 task 若不合规会被误 BLOCKED（违反不误伤存量）；dogfood 报告出来后由维护者定 warn 或 block |
| invoke 预写 approved grep | 本波做 / 缓做 | **缓做** | 误报不可控：合规的 GATE_VERIFY invoke 快照**天然含** approved 记录（本仓 30/40 invoke 即如此），机械区分「预写指令」与「事后记录」脆弱，需单独设计 |
| 解析复用 | 共享 task-meta/抽公共函数 / task-lint 自写 | **共享，必要时把 task-close 内联逻辑上提** | 状态行/占位符/勾选三条规则与 close 同源，双份必然漂移（v2.2.1 slug 教训） |
| 状态词表 | 写死 / 可配置 | **写死 + W1 降级** | 词表来自实测 13 个 task；未知 token 只 warn 不挡 |
| E4 标题匹配 | 精确 `## 失败路径` / 子串宽容 | **子串宽容**（`失败路径` 或 `failure_paths`） | 实测两种写法都在用 |

### R3 · 边界 / 失败语义 / 安全

- **E/W 分级**是第一波的核心防误报设计：结构缺失（E）挡，措辞/可选节（W）提醒；W 永不影响 exit code。
- **占位符语义分阶段**：`### 自检结论` 在 draft 期占位**合法**（W3 提醒），在 close 时刻才必须回填（M5 已挡）——同一内容在两个时刻不同判定，lint 只查存在性。
- **E6 绝对路径**：正则覆盖 macOS/Linux/Windows 三类；命中即报行号，不区分代码块内外（task 正文出现本机绝对路径无合法场景；dogfood 若发现反例再调）。
- **安全**：lint 纯只读，不写任何文件；无 git 动作。
- **存量**：dogfood 只报告不要求合规——预期工作区部分 legacy task 会 E3/E4 不过，这正是矩阵的下一批数据。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。fixture 驱动：每条 E 规则一个 fail fixture + 一个全过 fixture + W 规则各一。E4 变体（`## 失败路径` / `## failure_paths` / `## 失败路径表`）各一用例。E6 三类路径各一用例。dogfood 命令与输出落 task 自检结论（含违规计数，不要求为零）。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：规则集逐条可测、范围/非范围清晰、两处与 04 的偏差（思考轮归第三波、invoke grep 缓做、verify 不接入）均留痕。**可交 00 起草 task**。图谱：纯工具链，无需 bootstrap。版本建议 v2.3.0。dogfood 产出将直接决定第二波（G2 reviews 闸）与 verify 联动的设计输入。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 存量 task 违规面未知（dogfood 前无法预估；已通过「不接入 verify」隔离风险）；② E4/E6 正则可能有未预见误报（宽容设计 + dogfood 期可调）；③ 与 task check 的职责边界需文档说清，避免用户混淆 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-24 | 10-spec R0–R5 同会话回填（维护者委派）· 基于 rethink 系列 G1+G3；修正 04 两处（思考轮归第三波 · invoke grep 缓做 · verify 不接入） |
| 2026-07-24 | **维护者签收** · 进入 00 起草 task |
