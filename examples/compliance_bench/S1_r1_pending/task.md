# Task fixture · S1 · R1 pending 应拒 30

> 用途：SDD-Compliance micro-bench S1 夹具 · R1 pending 时 gate-check 须 exit≠0

---

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | `s1_r1_pending` |
| **test_strategy** | `not_applicable` |
| **audit_profile** | `full` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | 10 完成 |
| HG-AUDIT-R1 | pending | 30 | 22 R1 未落盘 / 未签 |

---

## 背景与目标

验证 D2 公理：**HG-AUDIT-R1 pending 时，30 不可开工**。

## 验收标准

- `gate-check.sh --task task.md` **exit 2** · 输出「30 不可开工: HG-AUDIT-R1 非 approved」
