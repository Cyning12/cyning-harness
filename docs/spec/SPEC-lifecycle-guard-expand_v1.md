# SPEC：lifecycle dry-run 守卫扩面（Post-2.10 Epic A）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收 A+E」）  
> **track**：`feature`  
> **上游**：Epic [`EPIC_post_210_menu_serial_a_e_j_v1_zh.md`](../../../docs/harness/guides/EPIC_post_210_menu_serial_a_e_j_v1_zh.md) · RETRO [`RETRO_post_210_next_menu_v1_zh.md`](../../../docs/harness/guides/RETRO_post_210_next_menu_v1_zh.md) 候选 **A**  
> **前置**：`@cyning/harness@2.10.0`（dry-run 骨架）· Epic **J CLOSE ✅**  
> **下游**：人签 → 00 draft task → 20-task-audit → HG-AUDIT-R1 → 30  
> **目标版本**：Epic 统一 **`2.11.0`**（与 E 同窗）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `lifecycle-guard-expand` |
| **invoke_slug** | `cyning-harness-lifecycle-guard-expand` |
| **test_strategy** | `required` |
| **test_strategy_note** | to_30 新 adapter 的 pass/fail/warn/unevaluated；既有 HG-AUDIT-R1 / reviews 回归；CLI dry-run exit；无 apply |
| **Open Folder（实现）** | `cyning-harness/` |
| **epic_serial** | A（J → **本棒** → E） |

---

## 1. 背景与目标

T2（v2.10）已落地 `lifecycle dry-run`，但 `to_30` 仅接线 **`HG-AUDIT-R1`** 与 **`reviews_retention`**；`HG-TASK-DRAFT` · `audit_D5` · `task_lint` 及 `to_00` / `close_*` 仍为 **`unevaluated`**，报告易被误读。

**一句话目标**：在**仍无 `--apply` / 仍非 runner / 仍非 G7** 的前提下，把 **`to_30` 剩余守卫**（及可选 `to_00`）接到薄 adapter，降低 unevaluated 面。

---

## 2. 范围

### D1 · 必须接线（`--task` + `to_30`）

| guard id | 语义（对齐既有） | 说明 |
| --- | --- | --- |
| `HG-TASK-DRAFT` | human_gate 表 `approved` | 同 HG-AUDIT-R1 解析路径 |
| `audit_D5` | test_strategy vs 测试文件存在 | 复用 audit/verify 既有判定，禁止盲 spawn 全量 verify |
| `task_lint` | `lintTaskFile`；severity=**warn** | fail→报告 `warn` 或 `fail` 按 yaml severity；`--allow-lint-fail` 抑制为非 block（本波 lint 仍非 block） |

既有 `HG-AUDIT-R1` / `reviews_retention` **行为不得回归**。

### D2 · 可选同波（若成本低）

- `to_00` · `spec_reviews_retention`（复用 `findSpecReview` / verify `--spec` 语义）  
- 若 30 评估成本高 → 记 residual，**不**阻塞 CLOSE

### D3 · 仍允许 unevaluated

- 全部 `close_*` 守卫（本波不扩 close 转移，除非顺手且单测充分）  
- 无 `--task` 时：除结构外全部 unevaluated（语义同 T2）

### D4 · 文档 / 测试 / 版本

- CHANGELOG **2.11.0** 条目；USER_GUIDE / ONBOARDING 一句：扩面守卫列表  
- 单测覆盖新 adapter 三态 + unevaluated 计数下降（相对 T2 fixture）  
- **无** schema 必填扩张（除非缺字段阻塞）

---

## 3. 非范围

- `--apply` / 写回 task status / 事件溯源（候选 B）  
- G7 / `harness run` / 完整 runner  
- N2-C · lint severity 升 **block**（候选 D；J 已测 FAIL≈93%）  
- 改变 `verify` / `close` 硬闸语义（dry-run 仍旁路）  
- E · `discipline show`（下一棒）

---

## 4. 验收清单

- [ ] `to_30` + fixture：`HG-TASK-DRAFT` · `audit_D5` · `task_lint` 均出现非 `unevaluated` 的 `pass|fail|warn`
- [ ] 既有两 adapter 回归绿
- [ ] `--allow-lint-fail` 对 `task_lint` 行为可测
- [ ] 无 `--task`：unevaluated 语义不变
- [ ] `npm test` 全绿 · 文档列出已接线守卫
- [ ] **无** `--apply` 旗

---

## 5. 思考轮控制表（摘要）

| 字段 | 值 |
| --- | --- |
| `actual_last_round` | R2 |
| `early_stop` | yes |
| `early_stop_reason` | 扩面集合由 yaml to_30 未接线项冻结；与 T2 SPEC 方案 B 同构，争议面小 |
| `residual_risks` | ① D5 与 verify 路径细微漂移；② close_* 仍 unevaluated 须文档标明；③ 与 E 同窗发版叙述勿漏 |

---

## 8. 下一棒 Prompt（人签后）

```text
【00】draft task · slug cyning-harness-lifecycle-guard-expand · Open Folder cyning-harness/
约束：本 SPEC D1 必须接线；无 apply；无 N2-C；E 不得同 PR 抢做
```
