# P0 金样 · 验收步骤（10→22→30）

> 配合 [`task_demo_p0_golden_v1.md`](./task_demo_p0_golden_v1.md) · 在 **空 git 仓** 或 `examples/demo_checkout/_sandbox/` 执行。

---

## 前置

- [ ] 已 `install.sh --preset harness-only`
- [ ] 已 `harness-sync.sh apply`
- [ ] 金样 task 在 `docs/tasks/active/task_demo_p0_golden_v1.md`
- [ ] IDE Open **业务仓根**（非 cyning-harness 产品仓）

---

## 阶段 A · 10 需求帽

- [ ] `@` 金样 task + `docs/harness/prompts/10-requirements.md`
- [ ] task「背景与目标」「范围」已填（金样预填可微调）
- [ ] `HG-TASK-DRAFT` → `approved`（维护者改 task 表）
- [ ] commit task 变更

---

## 阶段 B · 22 审核帽（R1）

- [ ] `@` task + `docs/harness/prompts/22-task-audit.md`
- [ ] 产出 `docs/harness/reviews/task_demo_p0_golden_audit_R1_*.md`（零阻塞也须落盘）
- [ ] 22 **未** 附 30 Prompt（`HG-AUDIT-R1` 仍为 pending 时 · D2）
- [ ] `HG-AUDIT-R1` → `approved`（维护者人签）
- [ ] commit review + task 表

---

## 阶段 C · gate-check

```bash
CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/gate-check.sh" --target . \
  --task docs/tasks/active/task_demo_p0_golden_v1.md
```

- [ ] **签前** exit 码 ≠ 0（或输出「30 不可开工」）
- [ ] **签后** exit 码 0 · 输出「✅ 可 30」

---

## 阶段 D · 30 执行帽

- [ ] `@` task + `docs/harness/prompts/30-execute-code.md`
- [ ] 首输出含闸表扫描（或引用 `TEMPLATE_30_gate_stop` 语义 · D3）
- [ ] 实现范围：在业务仓创建 `src/p0-demo/hello.txt` 内容为 `harness-p0-ok`
- [ ] task「实现备忘」回填 · status → `in_progress` 或保持至 CLOSE

---

## 阶段 E · 22 CLOSE（可选 · P0 完整闭环）

- [ ] 22 终轮 · 产出 `*_audit_CLOSE_*.md` 或 R2
- [ ] task status → `done`
- [ ] `git mv` → `docs/tasks/done/`（按域 · 见 ONBOARDING §6）

---

## P0 通过标准（最小）

满足 **A + B + C（签后）+ D** 即 P0 通过。  
**E** 为完整 SDD 闭环，可与 A2（40 帽）一并补全。

---

## 失败演练（可选 · v0.3+）

| 场景 | 期望 |
| --- | --- |
| 未签 `HG-AUDIT-R1` 即 30 | 30 拒开工 · 输出 gate_stop 模板 |
| `HG-AUDIT-R1` → rejected | task.status → draft · 退回 10 |
