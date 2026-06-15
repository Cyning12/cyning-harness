# POINTER · 金样：串行 Epic + invoke 链（M1 · 不复制业务代码）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **日期** | 2026-06-15（A3 脱敏） |
| **freeze_id** | `freeze_epic_orchestration_pilot_v1` |
| **性质** | **只读摘要** · 详细 invoke 链在业务仓 · 本产品 **不复制** |

---

## 金样是什么

**M1 已签收** 的前端 Epic 串行编排试点：Epic 总纲 + 00 编排 + **M01→M03** 子 task 链 + invoke 落盘 + CI 绿 + PR merge。

| 维度 | 值 |
|------|-----|
| **编排模式** | 单分支串行 · `semi_auto: false` |
| **Epic slug** | `tech-debt-code-quality-frontend` |
| **人签** | `HG-M1-SIGNOFF` approved（2026-06-09） |

---

## 公开证据（可独立验证）

| 项 | URL |
|----|-----|
| PR → production | https://github.com/Cyning12/ai-ink-brain/pull/64 |
| PR → main | https://github.com/Cyning12/ai-ink-brain/pull/65 |

有权限时可在 **Cyning12/ai-ink-brain** 对照 `docs/harness/invokes/by-task/tech-debt-code-quality-frontend/`。  
无权限时仅用本产品模板演练。

---

## 与本产品（cyning-harness）的关系

| 本产品资产 | 对照金样 |
|------------|----------|
| [`harness/templates/TASK_epic.md`](../harness/templates/TASK_epic.md) | Epic 编排主表 §3.1 |
| [`harness/templates/TASK_TEMPLATE.md`](../harness/templates/TASK_TEMPLATE.md) | 各 sub-task 结构 |
| [`harness/invokes/TEMPLATE_invoke.md`](../harness/invokes/TEMPLATE_invoke.md) | invoke 快照格式 |
| [`examples/demo_checkout/`](../examples/demo_checkout/) | **A3 对外金样** · P0 10→22→30 |

**纪律**：clone `cyning-harness` 的用户 **打开金样** = 读公开 PR + 本 POINTER + `demo_checkout`；勿期望 invoke 全文在产品包内。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-09 | M2 T6：M1 串行 Epic 金样 POINTER 首版 |
| 2026-06-15 | A3 public push：移除内部工作区路径与 invoke 文件枚举 |
