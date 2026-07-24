# SPEC：lifecycle.yaml 最小版 + verify↔lint 挂点（N1+N2）（v1）

> **状态**：`signed`（维护者签收 2026-07-24 · 对话「签收」）  
> **track**：`epic`  
> **关联图谱**：无（纯 Harness 工具链 / 过程轨）  
> **上游**：工作区 [`PLAN_post_g4_next_mechanization_v1_zh.md`](../../../docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md) · rethink [`01_big_directions`](../rethink/2026-07-mechanization-rate/01_big_directions.md) 方向二  
> **前置**：G1–G4 文档闸 ✅ · `@cyning/harness@2.6.0`  
> **下游**：00 已起草 task → 20-task-audit → HG-AUDIT-R1 → 30

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `lifecycle-and-verify-lint` |
| **test_strategy** | `required` |
| **test_strategy_note** | N1：schema 校验夹具 + fixture yaml；N2：verify 三态（无 lint 错 / warn / 豁免）+ 既有 verify 回归 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-lifecycle-and-verify-lint/invoke_20260724_10_spec_lifecycle_and_verify_lint.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

G1–G4 把「文档存在性/结构」闸补齐后，CLI 仍是一袋动词：新闸的挂点靠临场设计（verify？close？独立命令？）。rethink 方向二主张用 **`lifecycle.yaml`** 显式登记状态/转移/守卫，让补闸变便宜。

同时 G1 遗留决策未闭合：`task lint` 是否接入 `verify`。2026-07-24 dogfood：**active 16 · PASS 1 · FAIL 15**——全量 block 会立即误伤工作区。

**本 Epic 双目标**：

1. **N1**：产品仓落地 `lifecycle.yaml` 最小真值（文档 + schema；可选只读 CLI），**不**实现状态机引擎。  
2. **N2**：在 lifecycle 上裁定并实现 **verify↔lint** 挂点语义——本波 **warn-only**（见 R2），为将来升 block 留泄压阀与登记位。

---

## 2. 范围

### N1 · lifecycle.yaml 最小版

- **D1 · 真值文件**：`harness/lifecycle.yaml`（随包分发）描述：
  - `states[]`：至少覆盖 `draft` · `in_progress` · `done` · `archived`（与 task 状态词表 / close 对齐；允许注释映射 `pending` 等别名）
  - `transitions[]`：至少 `→30`（开工）与 `done→archived`（close）；每条含 `id` · `from` · `to` · `guards[]`
  - `guards[]` 元素：`{ id, command_or_check, severity: block|warn, allow_flag? }`
  - 本波须把 **既有** 守卫登记进去：`HG-AUDIT-R1` / reviews 留档 / audit D5 / `task close` 五～六检（描述级 · 不要求引擎执行）
- **D2 · Schema**：`schema/lifecycle.v1.schema.json`（或等价 YAML schema）+ 非法 fixture 校验测试
- **D3 · 只读 CLI（最小）**：`harness lifecycle show [--json]` —— 读包内 yaml · 打印状态/转移/守卫表；**不做**转移执行、不做持久化状态
- **D4 · 文档**：USER_GUIDE 或 ONBOARDING 一小节 + CHANGELOG；rethink 01 方向二链到本文件

### N2 · verify 接入 task lint（本波语义）

- **D5 · 裁定落地（R2）**：**severity = warn**（非 block）
  - `verify --task`：在 gate-check + audit + reviews 之后调用 `lintTaskFile`；有 E 级 → `WARN: task lint FAIL · …` 拼入 stdout，**不**改 exit / **不**改 `may_start_30`
  - `--json` handoff 增字段：`lint_ok` · `lint_errors[]`（或 `lint: { ok, errors, warnings }`）
  - 豁免：`--allow-lint-fail`（即使未来升 block 也复用此旗；本波 warn 模式下作用为「抑制 WARN 行」或留痕 `lint_suppressed`）
- **D6 · lifecycle 登记**：`to_30` 守卫含 `task_lint` · `severity: warn` · `allow_flag: --allow-lint-fail`；注释写明升 `block` 的前置条件（见 §非范围 / residual）
- **D7 · 测试**：verify fixture 三态（lint pass 无 warn / lint fail 有 warn 且 exit 0 / `--allow-lint-fail`）；既有 verify 用例不回归
- **D8 · 版本**：**v2.7.0**（N1 文档+只读 CLI + N2 warn 行为；无硬 block）

---

## 3. 非范围

- **状态机引擎**（按转移执行、写回 status、事件溯源）—— 方向二下一波  
- **N2 选项 C（verify block lint）**—— 本波不做；待 active lint FAIL 率下降或另立「仅新流转」策略后再开  
- `harness run` / G7 执行证据  
- G6 git 行为层 · HGM G2 查询  
- SPEC 审查文闸（N3）· verify 无 `--task` 全量模式纳入 reviews  
- 强制修复工作区存量 15 个 FAIL task（可另开 hygiene task）  
- 改变既有 E1–E10 规则集语义

---

## 4. 验收标准

### N1

- [ ] `harness/lifecycle.yaml` 可被 schema 校验通过；含 `to_30` 与 `close` 两条主转移及既有守卫登记
- [ ] 非法 yaml（缺 states / 非法 severity）→ schema 或 `lifecycle show` 可失败可定位
- [ ] `harness lifecycle show` 退出 0 · 人读表含状态与守卫；`--json` 输出稳定字段
- [ ] 文档章节可从 README/ONBOARDING/USER_GUIDE 链到

### N2

- [ ] `verify --task` 对 lint FAIL 的 task：exit **0**（在其余闸通过时）且 stdout 含 `WARN: task lint`
- [ ] lint PASS：无该 WARN
- [ ] `--json` 含 lint 结果字段；`may_start_30` **不**因 lint FAIL 变 false（本波）
- [ ] `--allow-lint-fail` 可抑制 WARN（或显式 `lint_suppressed: true`）
- [ ] `npm test` 全绿（含既有 verify 回归）

### 发布

- [ ] CHANGELOG v2.7.0；PLAN / rethink 回链本 SPEC

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| lifecycle.yaml 损坏 / 不符 schema | `lifecycle show` exit ≠0 · 信息可定位 | 修 yaml |
| verify 时 task 文件不可读 | 既有 verify 行为不变 | 修正路径 |
| lint FAIL（本波） | WARN · exit 仍由其余闸决定 | 修 task 或 `--allow-lint-fail` |
| 业务仓未升级 2.7.0 | 无 lifecycle 子命令 · verify 无 lint WARN | upgrade |
| 误以为 lint FAIL 会挡 30 | 文档 + lifecycle 表 severity=warn 明示 | — |

---

## 6. 依赖与引用

- rethink 01 方向二；PLAN_post_g4 N1/N2  
- `lib/task-lint.js` · `lib/verify.js` · `lib/task-meta.js`（handoff）  
- G1 SPEC：刻意不接入 verify 的历史裁定 → 本 SPEC **修订**为 warn 挂点（非沉默独立）  
- dogfood 证据：2026-07-24 active `PASS=1 FAIL=15`

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：PLAN_post_g4（点菜 N1+N2）· rethink 01 方向二原文 · G1/G4 SPEC 非范围（verify 不接入）· verify.js 当前插点顺序（gate → audit D5 → reviews → S5 warn）· dogfood active 15/16 lint FAIL。约束：本波 **不**做引擎；闸三问（挂点/误报/泄压）必须过；不误伤存量。

### R1 · 范围 / 非范围 / 场景

**场景**：① 维护者/Agent 查「to_30 有哪些守卫」→ lifecycle show；② 30 前 verify 看到结构问题但不被存量堵死 → lint WARN；③ 未来升 block 时有登记位与 `--allow-lint-fail`。  
**同 Epic 理由**：N2 的挂点必须写进 N1 的转移表，拆开会再临场一次。  
**非范围**：引擎、C 硬挡、N3/N4/G6/G7——避免 Epic 膨胀。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| N1 形态 | 仅 md 文档 / yaml+schema / yaml+引擎 | **yaml+schema+只读 show** | 真值可校验；引擎无消费者则违反「消费者先行」 |
| N1 CLI | 无 / show / doctor+建议 | **show** | doctor 暗示修复策略，本波无库存治理承诺 |
| N2 A 维持独立 | 永不进 verify | **否** | 丢掉机械化挂点；与方向二冲突 |
| N2 B warn-only | verify 提示不挡 | **是 · 本波** | FAIL 率 15/16，block=治理负担 |
| N2 C block+allow | 硬挡 + 豁免 | **推迟** | 须 hygiene 或「仅新流转」另 SPEC；本波在 yaml 预留 severity 升级路径 |
| 版本 | 拆 2.7 docs + 2.8 lint | **同发 2.7.0** | 同 Epic 同挂点叙事；warn 非 breaking |

### R3 · 边界 / 失败语义 / 安全

- **挂点**：lint 检查时刻 = verify `--task`（产物 task md 已存在）✓；全量无 `--task` 模式本波 **不**跑 lint（与 G2 全量策略一致，避免扫库爆炸）。  
- **误报**：沿用 lint 形式宽容；WARN 须带 rule 列表便于修。  
- **泄压**：`--allow-lint-fail`；升 block 后同旗变豁免。  
- **安全**：只读 lint；不改 task 文件；lifecycle show 不写盘。  
- **兼容**：未升级仓行为不变。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。N1：schema 正反例 + show JSON 快照字段。N2：verify 夹具三态 + 全量模式「不出现 lint WARN」断言。回归：既有 verify/close/lint 套件。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：双 D 包边界清晰，N2 裁定写死为 warn，C 升级条件在 residual。**可交 00**：建议单 task `cyning-harness-lifecycle-and-verify-lint`（D1–D8 同 PR），或拆 `…-lifecycle` + `…-verify-lint` 两 task 串行（lifecycle 先 merge）。图谱无需 bootstrap。版本 **v2.7.0**。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 升 C（block）时机依赖存量 FAIL 率或「新流转」定义未在本 SPEC 冻结；② lifecycle 描述级守卫与代码路径可能漂移——须 30 实现时对照 verify/close 源码回填 yaml；③ `lifecycle show` 若被误解为引擎，需文档醒目标「只读」 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-24 | 10-spec R0–R5（维护者点菜「开 N1+N2」）· 分支清理后同会话落盘 |
| 2026-07-24 | 维护者签收（对话「签收」）· 下游 00 起草 task |
