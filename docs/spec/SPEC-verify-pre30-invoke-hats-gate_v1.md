# SPEC：verify 前 30 · 前置 invoke 硬闸（pre-30 hats）（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `draft_spec` · 待 HG-SPEC-SIGNOFF / 实现 Agent 接手 |
| **日期** | 2026-07-27 |
| **track** | `feature` · 行为变更（verify） |
| **上游** | [`SPEC-invoke-hats-retention-gate_v1.md`](./SPEC-invoke-hats-retention-gate_v1.md)（v2.12 · close 硬 / verify WARN） |
| **触发 dogfood** | Ops-desk `ops-desk-api` Phase α：用户说「开工」后 Agent 直进 30，缺 10/40 invoke；verify 仍 PASS |
| **建议版本** | **v2.14.0**（minor · breaking for verify semantics） |

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `verify-pre30-invoke-hats-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | verify 缺 10 block / 缺 40 仍 WARN / minimal 不挡 / `--allow-invoke-gap` 豁免；改写既有「WARN 不挡 PASS」用例 |
| **skip_spec_audit** | `false`（建议走 20-spec-audit；紧急可维护者 skip） |
| **graph_change_layer** | `none` |
| **review_hat** | `20` |

---

## 1. 背景与目标

### 1.1 问题

v2.12 将 invoke 集合硬闸放在 **`task close`**：`verify --task` 对缺帽仅 WARN，**不挡** `may_start_30`。

结果：人闸全 approved + 用户说「开工」→ Agent 跑 verify PASS → **合法直进 30**，但 **10 invoke 可不存在**。聊天词被当成流程完成；帽链证据滞后到关账才暴露。

### 1.2 目标（一句话）

**「开工」不是闸。** 把 **30 前置帽证据** 升为 `verify` 硬条件：缺 **pre-30** 所需 invoke → `may_start_30=false` / VERIFY BLOCKED；**40** 仍仅 close 硬拦（verify 可 WARN）。

### 1.3 非目标

- 不解析自然语言「开工 / 开干」
- 不新增默认人闸 ID（可选文档提及 `HG-INVOKE-PRE30`，**本 SPEC 不强制**）
- 不改变 close 对 10/30/40 的集合硬闸（已有）
- 不强制 20 invoke（reviews 存在性已硬闸）

---

## 2. 语义：pre-30 vs post-30

| 集合 | 成员（从 `required` 求交） | verify `--task` | close |
|------|---------------------------|-----------------|-------|
| **pre_30** | `required ∩ {10, 20, 00}`（**默认至少关心 10**；profile 未要求则不算） | **缺失 → BLOCK** `may_start_30` | 仍须覆盖（已有） |
| **post_30** | `required ∩ {30, 40, CLOSE}` | 30 执行前通常缺 40 → **仅 WARN**（不挡 30）；缺 30 文件本身不要求在「开工瞬间」已有（可选：不检查 30） | **硬** |

**裁定（本 SPEC）**：

1. `evaluatePre30InvokeHats(meta, invokeDir)`：  
   `preRequired = required.filter(h => ['10','20','00'].includes(h))`  
   - 若 `preRequired` 为空（如 `minimal` 仅 30）→ pre-30 检查 **跳过**（PASS）  
   - 否则缺任一 → BLOCK  
2. **不**因缺 `40` / 缺 `30` invoke 文件而挡 `may_start_30`（30 文件可在开改后落盘；40 在 30 后）  
3. 全量缺目录 / 空目录：若 `preRequired` 非空 → BLOCK（与缺 10 同类）  
4. `--allow-invoke-gap`：pre-30 BLOCK **豁免为 WARN 放行**并留痕（与 close 同旗标）

---

## 3. 范围（实现）

| 路径 | 动作 |
|------|------|
| `lib/task-meta.js` | 新增 `evaluatePre30InvokeHats`（或给 retention 加 `preMissing` / `postMissing` 字段） |
| `lib/verify.js` | pre-30 缺口 → `ok:false` · `exitCode:2` · reason 含 `missing pre-30 invoke hats`；写入 handoff 使 `may_start_30=false` |
| `lib/cli.js` | help 文案：verify 对 pre-30 硬拦；40 仍 close |
| `test/invoke-hats-retention.test.js` | **改写**「verify gap WARN 不挡 PASS」→ 拆成：缺 10 BLOCK / 仅缺 40 WARN+PASS / minimal PASS / allow-invoke-gap PASS |
| `harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md` | 增 pre-30 invoke 行 +「用户『开工』≠ 闸」 |
| `harness/prompts/30-execute-code.md` · `TEMPLATE_30_gate_stop.md` | 同步纪律 |
| `docs/USER_GUIDE_v1.0_zh.md` §6.0 | 改写「verify 仅 WARN」句 |
| `docs/spec/SPEC-invoke-hats-retention-gate_v1.md` | 文末 **Amend** 指针到本 SPEC（勿静默改历史验收勾选语义，用修订节） |
| `CHANGELOG.md` | **v2.14.0** 行为变更醒目说明 + 豁免 / `minimal` 指引 |

---

## 4. 非范围

- ops-desk-api / web 业务仓改码（dogfood 另 task，产品发版后 upgrade）
- 命名 CI 裸 L 号（另一 SPEC）
- G-L 物理分层模板回灌（Ops-desk Phase β）

---

## 5. 验收标准

- [ ] default profile：仅有 `invoke_*_30_*`、闸全 approved、R1 文在 → **VERIFY BLOCKED** · `may_start_30=false` · 文案含 pre-30 / 缺 `10`
- [ ] 补上 `invoke_*_10_*` 后（仍可无 40）→ verify **PASS**（40 可仍 WARN）
- [ ] `invoke_retention_profile: minimal`：无 10 → verify **不因 pre-30 挡**（行为与「无 preRequired」一致）
- [ ] `--allow-invoke-gap`：缺 10 → WARN 放行 · 留痕
- [ ] `invoke_*_30_40_*` 双计规则不变；close 行为回归绿
- [ ] `npm test` 全绿；旧「WARN 不挡」用例已按新语义更新
- [ ] FRAGMENT_30 / USER_GUIDE / CHANGELOG 已写行为变更
- [ ] `--json` handoff 可区分：`invoke_pre30_ok`（或等价）与既有字段

---

## 6. 失败路径 / 兼容

| 场景 | 行为 |
|------|------|
| 存量业务仓 default + 仅 30 invoke | upgrade 到 2.14 后 **verify 挡 30** → 补 10、或改 `minimal`、或 `--allow-invoke-gap` |
| 紧急 fix 习惯直进 30 | 文档推荐 `minimal` 或显式 `required_invoke_hats: 30` |
| Agent 无视 BLOCK 仍改码 | 产品无法拦 IDE；靠 FRAGMENT「零 diff」+ 本闸降低误放行 |

---

## 7. 给实现 Agent 的读序

1. 本 SPEC  
2. `lib/verify.js` § invoke hats（约 L83–110）  
3. `lib/task-meta.js` `evaluateInvokeHatsRetention` / `scanInvokeHats`  
4. `test/invoke-hats-retention.test.js`  
5. 对照已落地硬闸：`SPEC-reviews-retention-gate_v1.md`（verify BLOCK 模式）

---

## 8. 修订

| 版本 | 日期 | 说明 |
|------|------|------|
| v1 | 2026-07-27 | 初稿：Ops-desk dogfood 触发；pre-30=10/20/00 ∩ required |
