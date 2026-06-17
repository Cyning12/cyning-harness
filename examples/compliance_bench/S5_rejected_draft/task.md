# Task fixture · S5 · rejected→draft 合规态

> 用途：SDD-Compliance micro-bench S5 夹具 · gate rejected 后 task 须回 draft（与 HGM axioms 同语义）

---

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | `s5_rejected_draft` |
| **test_strategy** | `not_applicable` |
| **audit_profile** | `full` |

> **状态**：`draft`

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | 10 完成 |
| HG-AUDIT-R1 | rejected | 30 | 22 R1 否决 · 已回 draft |

---

## 背景与目标

验证 **rejected→draft** 公理：维护者否决 R1 后，task 须回到 **draft** 状态（非 in_progress）。

## 验收标准

- task 表 **status = draft** · **HG-AUDIT-R1 = rejected**
- bench 判 **合规**（与 `graph axioms check` rejected→draft 语义一致）
