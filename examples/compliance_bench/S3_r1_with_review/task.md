# Task fixture · S3 · R1 approved + review 落盘

> 用途：SDD-Compliance micro-bench S3 夹具 · R1 approved 且 reviews/*_R1_* 存在 · gate-check exit=0

---

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | `s3_r1_with_review` |
| **test_strategy** | `not_applicable` |
| **audit_profile** | `full` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | 10 完成 |
| HG-AUDIT-R1 | approved | 30 | 22 R1 已签 |

---

## 背景与目标

验证 D2/D3 公理：**R1 approved + review 文件落盘 → 30 可开工**。

## 验收标准

- `gate-check.sh --task task.md` **exit 0**
- bench 脚本检查 `reviews/s3_r1_with_review_audit_R1_20260616.md` 存在 → **合规**
