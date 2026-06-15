# P0 金样 · 验收步骤（10→22→30）

> 配合 [`task_demo_p0_golden_v1.md`](./task_demo_p0_golden_v1.md) · 在 **空 git 仓** 或 `examples/demo_checkout/_sandbox/` 执行。

**最近一次跑通**：`_sandbox/` · 2026-06-15 · commit `8cd64ed`（签闸前）+ 30 交付 commit

---

## 前置

- [x] 已 `install.sh --preset harness-only` · 2026-06-15
- [x] 已 `harness-sync.sh apply` · 2026-06-15
- [x] 金样 task 在 `docs/tasks/active/task_demo_p0_golden_v1.md`
- [x] IDE Open **业务仓根**（`_sandbox`）

---

## 阶段 A · 10 需求帽

- [x] `@` 金样 task + `docs/harness/prompts/10-requirements.md`
- [x] task「背景与目标」「范围」已填（金样预填可微调）
- [x] `HG-TASK-DRAFT` → `approved`（维护者 · 2026-06-15）
- [x] commit task 变更

---

## 阶段 B · 22 审核帽（R1）

- [x] `@` task + `docs/harness/prompts/22-task-audit.md`
- [x] 产出 `docs/harness/reviews/task_demo_p0_golden_audit_R1_20260615.md`
- [x] 22 **未** 附 30 Prompt（签前 · D2）
- [x] `HG-AUDIT-R1` → `approved`（维护者 · 2026-06-15）
- [x] commit review + task 表

---

## 阶段 C · gate-check

```bash
CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/gate-check.sh" --target . \
  --task docs/tasks/active/task_demo_p0_golden_v1.md
```

- [x] **签前** exit 码 ≠ 0（exit 2 · HG pending）
- [x] **签后** exit 码 0 · 输出「✅ 可 30」· 2026-06-15

---

## 阶段 D · 30 执行帽

- [x] `@` task + `docs/harness/prompts/30-execute-code.md`
- [x] gate-check 签后验证（D3 机械辅助）
- [x] 创建 `src/p0-demo/hello.txt` 内容为 `harness-p0-ok`
- [x] task「实现备忘」回填 · status → `in_progress`

---

## 阶段 E · 22 CLOSE（可选 · **defer A3**）

> **A2 关账不阻塞**。完整 SDD 链 `10→22→30→40→22(CLOSE)` 的 **最后一棒 22 终轮** 在 **A3 对外金样** 时执行。

- [ ] 22 终轮 · 产出 `*_audit_CLOSE_*.md` 或 R2
- [ ] task status → `done`
- [ ] `git mv` → `docs/tasks/done/`（按域 · 见 ONBOARDING §6）

---

## 阶段 F · 40 自检帽（A2 · 2026-06-15 ✅）

> **已在 `_sandbox` 阶段 2 完成** · commits `769964c` + `7d5b375` · **无需再开 Agent**，仅需本清单勾选留档。

- [x] sync 后存在 `docs/harness/prompts/40-self-check.md`
- [x] `@` task + 40-self-check.md · 跑验证命令
- [x] task 回填 `### 自检结论（执行者）`
- [x] sidecar `task check` schema OK（产品仓路径 · 阶段 1）
- [x] gate-check 输出 manifest.version（upgrade 后 · `7d5b375`）

---

## P0 通过标准（最小）

满足 **A + B + C（签后）+ D** 即 P0 通过。  
**2026-06-15**：`_sandbox` **A–D 最小通过 ✅** · **F（40 帽）✅** · **E defer A3**

---

## 失败演练（可选 · v0.3+）

| 场景 | 期望 |
| --- | --- |
| 未签 `HG-AUDIT-R1` 即 30 | 30 拒开工 · 输出 gate_stop 模板 |
| `HG-AUDIT-R1` → rejected | task.status → draft · 退回 10 |
