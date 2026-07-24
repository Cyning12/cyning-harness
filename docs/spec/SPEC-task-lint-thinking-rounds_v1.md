# SPEC：task lint 思考轮结构规则组（G4）（v1）

> **状态**：`signed`（维护者签收 2026-07-24 · 对话「签收，继续」）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **上游思考**：[`docs/rethink/2026-07-mechanization-rate/`](../rethink/2026-07-mechanization-rate/)（缺口 G4 · P1）  
> **前置**：v2.3.0 `task lint`（G1+G3）· 本 SPEC 为其规则组扩展  
> **下游**：00 已起草 task → 20-task-audit → HG-AUDIT-R1 → 30

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `task-lint-thinking-rounds` |
| **test_strategy** | `required` |
| **test_strategy_note** | 条件触发三形态 + 每条 E/W 规则的 fail/pass fixture；`npm test` 全绿含回归 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-task-lint-thinking-rounds/invoke_20260724_10_spec_task_lint_thinking_rounds.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

rethink 02 D3：10 帽「预置 R0–R5 思考轮槽 + 思考轮控制表」是纯 Prompt 纪律（零机械）。v2.3.0 `task lint` 落地时本项被显式推迟（SPEC R1：写法变体多 · 宽容度需独立 dogfood）——本 SPEC 即第三波。

**变体实测（2026-07-24 · SPEC 设计依据）**：

| 形态 | 实例 | 占比（active 16） |
|---|---|---|
| **A · task 内嵌**（### R0–R5 + 控制表） | hat_chain_assessment · v0_2_d3_ide · ops_desk_kimi_code_spec_10_refine | ~2-3/16 |
| **B · SPEC 承载**（task 无槽位 · 链 SPEC） | 近三波 task（lint/reviews-gate 等）· 3 份 SPEC 均有完整结构 | ~2/16 |
| **C · 无思考轮**（bugfix 轨 / Issue≈SPEC） | hat_v2_split 等 | ~12/16 |

**目标**：`task lint` 新增思考轮规则组——**条件触发**（有思考轮节才查结构完整性），只查结构不查内容质量；形态 B/C 不挡（W 级提示）。

## 2. 范围

- **D1 · `lib/task-lint.js` 规则组扩展**：
  - 触发条件：文件含思考轮节（标题含「思考轮」或存在 `### R0` 槽标题）
  - **E 级**（触发后）：E8 R0–R5 槽位标题齐全 · E9 控制表必填字段齐全（`actual_last_round` / `early_stop` / `residual_risks`）· E10 `early_stop=yes` 时 `early_stop_reason` 非空
  - **W 级**：W4 无思考轮节（提示 · 注明 SPEC 承载/bugfix 轨合法豁免）· W5 存在 `### R6`+ 但 `round_extension_note` 缺失或为空
  - 槽位内容为 `（待填）`/`（跳过 · 见思考轮控制）` **合法**（draft 期语义 · 同自检结论占位原则）
- **D2 · 测试**：三形态（A 完整 pass / A 缺槽或缺字段 fail / B·C 仅 W4）+ E10 逻辑用例 + W5 用例；`npm test` 全绿含 118 例回归
- **D3 · dogfood**：工作区 active + done tasks 全量 lint，三形态分布与规则命中落自检结论（只报告）
- **D4 · 文档**：`harness/prompts/10-task-requirements.md` 思考轮摘要节补「v2.6+ task lint 机械检查结构」；CHANGELOG + 版本 **v2.6.0**；rethink 03 G4 行 ❌→✅

## 3. 非范围

- 思考轮**内容质量**判定（是否「真思考」）—— 20 帽职责，永不在 lint
- SPEC 文件的 lint（E1 元信息字段不同 · 规则组设计为可复用，SPEC lint 下一轮）
- `verify` 接入 lint（维持 v2.3 裁定 · 独立命令）
- 强制所有 task 必须有思考轮（形态 B/C 合法 · 本闸不消灭变体）

---

## 4. 验收标准

- [ ] 形态 A 完整（R0–R5 + 三字段 + early_stop 逻辑一致）→ 无 E · exit 0
- [ ] 形态 A 缺槽（如缺 `### R3`）→ E8 exit 2；缺控制表字段 → E9；`early_stop=yes` 无 reason → E10
- [ ] 形态 B/C（无思考轮节）→ 仅 W4 · exit 0
- [ ] `### R6` 存在且 `round_extension_note` 空 → W5 · exit 0
- [ ] 槽位 `（待填）`/`（跳过 · 见思考轮控制）` 不触发任何 E
- [ ] `npm test` 全绿（新增用例 + 118 例回归）
- [ ] dogfood 三形态分布落自检结论
- [ ] 10-task Prompt + CHANGELOG（v2.6.0）；rethink G4 行 ❌→✅

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 有思考轮节但结构不全 | exit 2 · 逐条列出（E8/E9/E10）· 不改文件 | 补齐后重跑 |
| 形态 B/C | W4 提示 · exit 0 | — |
| 槽标题变体（如 `### R3 · 边界`） | 槽匹配按 `^### R\d` 前缀（形式宽容）| 误报则 dogfood 期调整 |
| 既有 task 大量 W4 | 不影响 exit · dogfood 记录分布 | — |
| 业务仓未升级 2.6.0 | 旧 lint 无本规则组 · 行为不变 | upgrade |

---

## 6. 依赖与引用

- 复用：`lib/task-lint.js`（规则组框架 · E/W 分级）· `lib/task-meta.js`（`extractSection` 行首锚定）
- 纪律原文：`harness/prompts/10-task-requirements.md`「OSS 阶段 C · 思考轮」节；工作区 `FRAGMENT_rethink_backfill_spec_v1_zh.md`（控制表字段定义）
- 变体实测：2026-07-24 扫描（§1 表）
- 缺口出处：rethink 02（D3）· 03（G4 行）· SPEC-task-lint-structure-gate R1（推迟裁定）

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：rethink 02 D3 / 03 G4 / 04 第三波定义；v2.3 SPEC 的推迟裁定；变体实测数据（§1）；10-task 新帽思考轮摘要节（v2.4.0）。约束：只查结构不查内容是 04 定下的硬边界；不消灭形态 B/C（它们是 R1 审查已接受的合法轨）。

### R1 · 范围 / 非范围 / 场景

变体实测驱动设计：active 16 个中仅 ~3 个形态 A——**无条件强制槽位 = 误伤 80% 存量**，故核心设计是**条件触发**（有节才查）。场景：① 形态 A task 的 10 产出自查（主）；② 22/20 审查时辅助核对控制表；③ 维护者批量体检。SPEC 文件的结构与本规则组同构，但 E1 元信息字段不同（spec_slug ≠ task_slug），SPEC lint 不在本波（非范围已列）。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| 触发方式 | 全员强制 / 条件触发 / 只对阶段 C 标记 task | **条件触发（有节才查）** | 变体实测：强制 = 80% 误伤；「阶段 C 标记」本身无机械标记可锚 |
| 无思考轮节 | 沉默 / W4 提示 / E 级 | **W4** | 形态 B/C 合法但值得可见（提示里也写明豁免路径，教育新用户） |
| 槽内容 | 查非占位 / 不查 | **不查**（`（待填）`/`（跳过）` 合法） | draft 期语义与自检结论占位原则一致；填没填的思考质量是 20 帽职责 |
| early_stop 逻辑 | 查 / 不查 | **查（E10）** | `yes` 必须配 reason 是控制表自身的逻辑完整性，属结构非内容 |
| R6+ | 不查 / W5 / E | **W5** | 扩展理由缺失值得提示，但 R6 使用率低，E 级过重 |
| 槽标题匹配 | 精确 `### R0` | **`^### R\d` 前缀宽容**（允许 `### R3 · 边界` 后缀） | 实测槽标题带主题后缀是惯例 |

### R3 · 边界 / 失败语义 / 安全

- **E/W 分界原则**：触发后结构残缺 = E（有节就等于承诺了结构）；未触发 = 最多 W（不承诺不查）。
- **触发条件假阳性**：文件正文提到「思考轮」三字但无槽位 → 触发条件要求「标题含思考轮 **或** 存在 `### R0` 槽标题」——纯文本提及（如本段）不触发，因为 `### R0` 必须行首锚定（extractSection 同款锚定）。「标题含思考轮」单独触发会不会误伤？一个写着「## 思考轮说明」但无槽的文件 → E8 fail。裁定：触发 = 存在 `^### R0` 槽标题 **或** `^#{2,3}.*思考轮` 标题；两者任一即按形态 A 要求。dogfood 验证误伤面（D3）。
- **安全**：纯只读；无 git 动作；不影响既有 E1–E7 行为（118 例回归兜底）。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。fixture：形态 A 完整 / 缺槽 / 缺字段 / early_stop 无 reason / R6 无扩展理由 / 形态 B / 形态 C / 槽标题带后缀宽容 / 正文提及「思考轮」不触发。dogfood 落三形态分布与 W4 计数。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：条件触发模型有三形态实测支撑，E/W 边界清晰，宽容条款逐条在案。**可交 00 起草 task**。图谱：纯工具链。版本 v2.6.0（lint 规则组扩展 · 无 verify 行为变更）。落地后 rethink 矩阵 ❌ 8 → 7；P1 队列余 SPEC 审查闸与 verify 全量模式决策。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 触发条件的假阳性（文件有「思考轮」标题但槽在别处）——dogfood D3 实测，必要时触发条件收紧为仅 `### R0`；② 历史形态 A 文件可能结构不全被 E 挡（存量仅 ~3 个 · 影响面小且可豁免豁免阀之外直接修复）；③ SPEC lint 复用需求可能提前到来（规则组已按可复用设计） |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-24 | 10-spec R0–R5 同会话回填（维护者点菜「1」）· 基于 rethink G4 + 变体实测（形态 A/B/C 分布） |
| 2026-07-24 | 维护者签收（对话「签收，继续」）· 下游 00 起草 task |
