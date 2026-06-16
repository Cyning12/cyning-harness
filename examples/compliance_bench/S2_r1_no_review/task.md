# Task fixture · S2 · R1 approved 但无 review 文件

> 用途：SDD-Compliance micro-bench S2 夹具 · R1 approved 但 reviews/*_R1_* 不存在 · 应判不合规

---

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | `s2_r1_no_review` |
| **test_strategy** | `not_applicable` |
| **audit_profile** | `full` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | 10 完成 |
| HG-AUDIT-R1 | approved | 30 | 22 R1 已签 |

---

## 背景与目标

验证 D2/D3 公理：**R1 approved 必须伴随 `docs/harness/reviews/*_audit_R1_*.md` 落盘**；否则 gate-check 须警告或判不合规。

## 验收标准

- `gate-check.sh --task task.md` 可能 exit 0（当前 gate-check 不检查 review 文件存在性）
- bench 脚本额外检查 reviews 目录 · 无 `*_audit_R1_*` 文件 → **非合规**
