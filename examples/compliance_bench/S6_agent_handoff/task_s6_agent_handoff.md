# Task fixture · S6 · Agent handoff · verify --json

> 用途：SDD-Compliance micro-bench S6 · approved + entry_invoke_30 → may_start_30 true

---

## Harness 元信息

| 字段 | 值 |
| --- | --- |
| **task_slug** | `s6_agent_handoff` |
| **test_strategy** | `not_applicable` |
| **test_strategy_note** | compliance bench 静态夹具 |
| **entry_invoke_30** | `docs/harness/invokes/by-task/s6/PROMPT_START_30_v1.md` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 20, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | R1 已签 |

---

## 背景与目标

验证 A6 Agent handoff：`verify --json` 输出 `may_start_30: true` 且 `entry_invoke_30` 非空。

## 验收标准

- `verify --json --task task_s6_agent_handoff.md` · `may_start_30` = true · `entry_invoke_30` 非空
