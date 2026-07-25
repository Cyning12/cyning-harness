# SPEC：lifecycle 转移引擎最小骨架（Post-G4 Epic T2）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收」）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链 / 过程轨）  
> **上游**：工作区 Epic [`EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md`](../../../docs/harness/guides/EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md) · RETRO [`RETRO_post_g4_n1n4_debt_v1_zh.md`](../../../docs/harness/guides/RETRO_post_g4_n1n4_debt_v1_zh.md) §4 点菜 **#2** · PLAN 方向二  
> **前置**：N1 `@cyning/harness@2.7.0`（`lifecycle.yaml` + `lifecycle show` 只读）· 当前产品仓 **2.9.0** · Epic **T1 CLOSE ✅**  
> **下游**：00 已起草 task（HG-TASK-DRAFT pending）→ 10-task（可选）→ 20-task-audit → HG-AUDIT-R1 → 30（Epic：T1 已 CLOSE，闸链仍须人签）  
> **目标版本**：Epic 统一发版建议 **`@cyning/harness@2.10.0`**（与 T3 同波复检后 publish；本 SPEC 可写目标版本，不代发）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `lifecycle-engine-min` |
| **invoke_slug** | `cyning-harness-lifecycle-engine-min` |
| **test_strategy** | `required` |
| **test_strategy_note** | 引擎：结构合法/非法 · 守卫 adapter 通过/block/unevaluated · CLI dry-run exit 码；既有 `lifecycle show` / verify / close 回归 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-lifecycle-engine-min/invoke_20260725_10_spec_lifecycle_engine_min.md` |
| **entry_invoke_00_draft** | `Projects/docs/harness/invokes/by-task/cyning-harness-lifecycle-engine-min/invoke_20260725_00_draft_lifecycle_engine_min.md` |
| **Open Folder（实现）** | `cyning-harness/`（产品仓改码） |
| **epic_serial** | T2（T1 dogfood 卫生 → **本棒** → T3 discipline-coverage） |

---

## 1. 背景与目标

N1（v2.7）已落地 **`harness/lifecycle.yaml`** 与 **`lifecycle show [--json]`**：状态 / 转移 / 守卫的**登记真值**可校验、可展示。yaml 文件头与 schema 均明示「只读登记 · 不由引擎执行」。

方向二下一台阶（RETRO #2 / Epic T2）：在登记之上增加 **转移引擎最小骨架**——能对指定转移做 **dry-run 资格判定**（结构 + 部分守卫求值报告），让「补闸 / 开工前检查」从临场拼 CLI 变为**消费 lifecycle 真值**。

**一句话目标**：YAML 仍是登记；**引擎是消费方**。禁止把 N1「已有 yaml」说成「已是引擎」。

**消费者（本波）**：维护者 / Agent 在 30 前或联调时跑 `lifecycle dry-run`，得到可机读的转移资格报告（非 spawn Agent、非 G7 执行证据）。

---

## 2. 范围

### D1 · 引擎库（最小 API）

- 新增（或扩展）`lib/lifecycle*.js` 导出至少：
  - `dryRunTransition({ transitionId, fromState, taskPath?, harnessRoot?, flags? })`
  - 返回稳定结构（人读与 `--json` 同源字段），至少含：
    - `transition_id` · `from` · `to` · `hat?`
    - `structure_ok`（transition 存在且 `fromState ∈ from[]`）
    - `guards[]`：`{ id, severity, status: pass|fail|warn|unevaluated, detail?, allow_flag? }`
    - `blocked`（任一 `severity=block` 且 `status=fail` → true）
    - `unevaluated_count`
    - `engine: "lifecycle-dry-run"` · `lifecycle_doc_version`（yaml `version`）
- **默认不写盘**；本波 **无** `--apply` / 无改 task `status` / 无写 invoke。

### D2 · CLI · `lifecycle dry-run`

- `npx @cyning/harness lifecycle dry-run --transition <id> --from <state> [--task PATH] [--json] [--allow-no-review] [--allow-lint-fail] …`
- 复用既有 allow 旗名（与 verify/close 对齐）；未知旗 → 明确错误
- **exit**：
  - `0`：结构合法且无 block 级 `fail`（允许存在 `unevaluated` / warn；stdout 须标明 unevaluated）
  - `2`：结构非法或存在 block 级 `fail`
  - `1`：用法 / yaml 损坏等（与 `lifecycle show` 一致风格）
- `lifecycle show` **行为不变**；help 文案区分：show=登记只读 · dry-run=引擎资格判定

### D3 · 守卫 adapter（薄 · 可扩展表）

- 维护 `GUARD_ADAPTERS`（或等价）：`guard.id → evaluator`
- **本波必须接线**（当 `--task` 给出且 transition=`to_30` 时）：
  - `HG-AUDIT-R1`（复用 gate-check / 既有 human_gate 读取）
  - `reviews_retention`（复用 `findReview` / verify 同语义）
- **本波允许 `unevaluated`**（须在报告中显式列出，禁止静默当 pass）：
  - `HG-TASK-DRAFT` · `audit_D5` · `task_lint` · `close_*` · `spec_reviews_retention` 等未接线守卫
  - 无 `--task` 时：除结构外，全部守卫 → `unevaluated`（仍可 exit 0，但人读/JSON 醒目提示「未求值」）
- **禁止**本波实现「spawn 子进程跑完整 verify 再盲映射」作为唯一路径；优先 **库内复用** 既有函数。允许 30 实现时微调接线细节，但验收须可测。

### D4 · 文档与登记语义护栏

- `harness/lifecycle.yaml` 文件头注释修订：明确「登记真值 · **由 `lifecycle dry-run` 引擎消费** · yaml 本身不是引擎」
- `schema/lifecycle.v1.schema.json` description 同步（仍不强制改字段；本波 **不**为引擎扩 schema 必填项，除非 30 发现缺字段阻塞）
- USER_GUIDE / ONBOARDING / README 短节：dry-run 用法 · 与 show 对比 · **非** G7 / **非** runner
- CHANGELOG：**2.10.0**（或 Epic 复检时实际版本号）条目

### D5 · 测试

- 单元：结构 pass/fail；`to_30` + fixture task 下 HG-AUDIT-R1 / reviews adapter 三态；unevaluated 计数
- CLI：dry-run `--json` 字段稳定；show 回归；非法 transition id → exit ≠0
- 既有 `test/lifecycle.test.js` · verify · close 不回归

### D6 · 版本与 Epic 对齐

- 目标版本挂 Epic 统一发版 **`2.10.0`**
- 本棒 CLOSE 后 **不**单独强制 publish；等 T3 CLOSE → 00 发版前复检 → 维护者 publish
- 若 T3 无产品 diff 且仅本棒有码：仍建议同 tag **2.10.0**（Epic 约定），由维护者裁定

---

## 3. 非范围

- **完整 runner**（`harness run` · Agent spawn · 帽链自动推进）
- **同波硬塞 G7**（40「真跑过」执行证据）—— 附录观察项；宜跟本引擎之后另开
- 声称 / 文档暗示 **N1 YAML「已是引擎」**
- **`--apply` / 写回 task status / 事件溯源 / 持久化转移日志**
- 把全部 yaml 守卫一次性接线完毕（本波允许 unevaluated 清单）
- N2-C lint→block · G6 · HGM · discipline-coverage（T3）· dogfood 缺审补文（T1）
- 改变既有 `verify` / `task close` 的闸语义（引擎是**旁路报告**，不替换 verify 作为 30 硬闸；除非未来另 SPEC 规定「dry-run 替代」——本波不做）

---

## 4. 验收标准

- [ ] `lifecycle dry-run --transition to_30 --from draft --task <fixture>`：结构 ok；至少 `HG-AUDIT-R1` 与 `reviews_retention` 出现非 `unevaluated` 的 `pass|fail`（按夹具）
- [ ] 非法 `transition` id 或 `from` 不在 `from[]` → `structure_ok=false` · exit 2（或 1，须在实现/自检写死并测）
- [ ] 无 `--task`：可 exit 0（结构合法时）但 JSON/`unevaluated_count` > 0 且人读标明未求值
- [ ] block 守卫 adapter 返回 fail → `blocked=true` · exit 2
- [ ] `lifecycle show` 仍只读登记 · 行为与 v2.7+ 兼容
- [ ] 文档明确：**yaml ≠ 引擎**；dry-run ≠ runner / ≠ G7
- [ ] `npm test` 全绿
- [ ] CHANGELOG 含 2.10.0（或 Epic 实发版本）条目；Epic / RETRO #2 可回链本 SPEC

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| lifecycle.yaml 缺失/损坏 | dry-run 失败 · 信息可定位（同 show） | 修 yaml / 升级包 |
| 未知 `--transition` | exit ≠0 · 列出已知 id 或提示 `lifecycle show` | 改参数 |
| `--from` ∉ transition.from | `structure_ok=false` · blocked | 改 from 或选对 transition |
| `--task` 路径不可读 | exit ≠0 · 可定位 | 修路径 |
| 守卫 adapter 内部依赖失败（如 gate 文件缺失） | 该守卫 `fail` 或显式 `detail`；不伪装 pass | 补闸表 / 修 task |
| 用户误以为 unevaluated=已通过 | 文档 + JSON `unevaluated_count` + 人读 WARN 行 | — |
| 用户误以为 dry-run 可替代 verify 进 30 | 文档醒目：旁路报告；30 仍以既有 verify/gate 为准 | — |
| 业务仓未升级到含 dry-run 的版本 | 无子命令 | upgrade |

---

## 6. 依赖与引用

- 产品仓：`harness/lifecycle.yaml` · `lib/lifecycle.js` · `lib/cli.js` `cmdLifecycle` · `schema/lifecycle.v1.schema.json` · `test/lifecycle.test.js`
- 守卫复用候选：`lib/verify.js` · gate-check / human_gate · `findReview`（与 v2.5+/v2.9 语义对齐）
- 上游 SPEC：[`SPEC-lifecycle-and-verify-lint_v1.md`](./SPEC-lifecycle-and-verify-lint_v1.md)（N1 非范围「状态机引擎」→ 本 SPEC 承接）
- Epic 串行：T1 CLOSE 后才允许本 task **HG-AUDIT-R1 → 30**；SPEC 签收与 00 起草 task **可在 T1 完成前并行**（不挡文档轨）

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：Epic T2 · RETRO #2（方向二转移引擎最小骨架）· N1 SPEC（yaml+show · **明确不做引擎**）· 现状 `lifecycle.yaml` / `lib/lifecycle.js`（load+validate+format · 无转移 API）· CLI 仅 `lifecycle show` · 产品仓 **2.9.0** · 统一发版建议 **2.10.0**。

硬约束：

1. 不做完整 runner；不同波硬塞 G7  
2. 不声称 N1 YAML 已是引擎  
3. early_stop=no（无充分理由裁轮）  
4. Open Folder 实现 = `cyning-harness/`；本 10-spec 只写 SPEC/invoke  

### R1 · 范围 / 非范围 / 场景

**场景**：

1. Agent/人：`lifecycle dry-run --transition to_30 --from draft --task path` → 得资格报告，再决定是否跑 verify / 开 30  
2. 无 task：只验证「该转移在 yaml 里从该状态是否合法」+ 守卫清单 unevaluated  
3. 维护者对照 show vs dry-run：登记 vs 求值  

**范围边界**：引擎 = dry-run 资格判定 + 薄 adapter；**非**状态写回、**非**帽执行、**非** G7。  
**非范围**：见 §3。与 T1/T3 切分清晰。

### R2 · 方案对比

| 方案 | 内容 | 利 | 弊 | 裁定 |
|------|------|----|----|------|
| **A** | 仅结构 dry-run（from∈from[] · id 存在），守卫一律打印不求值 | 极小 diff | 相对 show 增量弱；难称「引擎」 | **弃** |
| **B** | 结构 + 薄 adapter（本波接线 to_30 核心 block 子集）+ 其余 `unevaluated`；**无 apply** | 真消费 yaml；边界清；可测；不撞 G7/runner | 守卫覆盖不全须文档说清 | **推荐 · 本波** |
| **C** | B + `--apply` 写 task status | 「可执行转移」字面更满 | 易与 close/verify 双写；半成品状态机；超最小骨架 | **弃（residual）** |
| **D** | 完整 runner / `harness run` / G7 同波 | 方向二终局感 | Epic 明禁；无消费者契约 | **禁** |

**CLI 命名**：`lifecycle dry-run`（相对 `transition --dry-run`）—— 默认语义即 dry-run，降低误触 apply。  
**与 verify 关系**：旁路报告，**不**在本波把 dry-run 设为 `may_start_30` 唯一真值。  
**版本**：挂 **2.10.0**（Epic 统一），不拆 2.10 docs / 2.11 engine。

### R3 · 边界 / 失败语义 / 安全

- **挂点**：dry-run 在「读 yaml + 可选读 task」时刻求值；不修改仓库文件。  
- **误报**：unevaluated 不得计为 pass；block fail 必须挡 exit。  
- **泄压**：复用 `--allow-no-review` / `--allow-lint-fail` 等**已存在**旗（仅当对应 adapter 接线后生效；未接线则旗可忽略或 WARN「无效果」——实现时选一并测）。  
- **安全**：无网络；无任意 shell（`command_or_check` 字段本波仍是**描述串**，不当 shell 执行）。  
- **兼容**：旧仓无 dry-run 子命令；show 不变。  
- **串行**：SPEC/task 文档可先行；**30 改码**受 Epic「T1 CLOSE」约束。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。夹具覆盖：结构失败、adapter pass/fail、无 task 的 unevaluated、JSON 字段、show 回归。验收清单 §4 均可自动化或 CLI 断言。图谱无需 bootstrap。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：D1–D6、非范围、failure_paths、R2 裁定（方案 B）已写死。  
**可交人签** → 签后 **00 起草 task**（slug `cyning-harness-lifecycle-engine-min`）。  
建议：可选轻量 **20-spec-audit R1**；维护者亦可用对话「签收」直接 HG-SPEC-SIGNOFF。  
**提醒 00**：task 元信息注明 Epic T2 · `target_version: 2.10.0` · Open Folder=`cyning-harness/` · `human_gate` 进 30 前核对 T1 CLOSE。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① adapter 覆盖不全 → 用户误读 unevaluated；② 未来 `--apply` / G7 边界需另 SPEC；③ dry-run 与 verify 双轨可能短期认知负担；④ Epic 发版节奏依赖 T3，本棒 CLOSE≠立即 npm publish |
| `round_extension_note` | — |

---

## 8. 下一棒可复制 Prompt（人签后 · 00 task）

```text
你是 Harness 00 编排 Agent，当前相位：起草 task（不写产品代码）。

输入：
- SPEC 已签收：cyning-harness/docs/spec/SPEC-lifecycle-engine-min_v1.md（状态须为 signed / HG-SPEC-SIGNOFF）
- Epic：docs/harness/guides/EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md · 串行 T2
- slug：cyning-harness-lifecycle-engine-min
- Open Folder（实现）：cyning-harness/
- target_version：2.10.0（Epic 统一发版；不代 publish）
- 约束：方案 B（dry-run + 薄 adapter · 无 apply · 无 G7/runner）；T1 CLOSE 前不得签 HG-AUDIT-R1 进 30

【交付 · 须落盘】
1) task：docs/harness/tasks/active/task_cyning_harness_lifecycle_engine_min_v1.md
   - 投影 SPEC §2–§5；test_strategy=required；human_gate 表完整
   - §4 预留 10-task 思考轮槽
2) invoke：docs/harness/invokes/by-task/cyning-harness-lifecycle-engine-min/invoke_*_00_draft_*.md（可选快照）
3) 勿改产品仓 lib/；勿 commit（除非维护者要求）

【下一棒】
10-task：回填 task §5 R0–R5 → 20-task-audit → 人签 HG-AUDIT-R1（且 T1 CLOSE）→ 30
```

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-25 | 10-spec R0–R5 · Epic T2 / RETRO #2 · draft 落盘 · early_stop=no |
| 2026-07-25 | 维护者签收（对话「签收」）→ `signed` · 00 起草 task · N3 纸链审查文 |
