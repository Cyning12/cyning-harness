# Invoke · 00/10 · close-loop-hard-gates U1

| 字段 | 值 |
|------|-----|
| **hats** | `00` · `10` |
| **task_slug** | `cyning-harness-close-loop-hard-gates-u1` |
| **date** | `2026-07-28` |
| **actor** | 00 统筹（工作区） |

## 动作

1. U0：`verify-pre30` rebase 至 2.16.2 线 → 目标版本 2.17.0 → PR #6 squash merge 入 `main`（含 2.14–2.16 收口）。**未** npm publish。
2. 落盘产品 SPEC：`docs/spec/SPEC-close-loop-hard-gates_v1.md`（draft）。
3. 拆 task：
   - `docs/tasks/active/task_cyning_harness_close_loop_hard_gates_u1.md`（G1+G3+G4）
   - `docs/tasks/active/task_cyning_harness_consumer_ontology_bootstrap_v1.md`（G2 P0）
4. **STOP**：待 `HG-SPEC-SIGNOFF`（或书面 skip_10_spec）+ `HG-AUDIT-R1`（或 skip）后派 30。

## 下一棒

- 维护者签 SPEC / R1
- 30：`PROMPT_30_cyning_harness_close_loop_hard_gates_upgrade_v1_zh.md` + Gap G1→G3→G4（可同 PR）→ 再 G2
