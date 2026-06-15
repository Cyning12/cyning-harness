# Task：P0 金样 · 验证 Harness 10→22→30 最小闭环

> **状态**：`draft`  
> **用途**：`examples/demo_checkout/` 演示仓 · **非** 业务功能  
> **关联图谱**：无（docs-only 金样）  
> **落盘**：复制到 `docs/tasks/active/` 后按 [`ACCEPTANCE.md`](./ACCEPTANCE.md) 执行

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `demo_p0_golden` |
| **test_strategy** | `not_applicable` |
| **test_strategy_note** | 金样仅验证 SDD 链与 gate-check · 无产品代码测试 |
| **code_quality_bar** | `not_applicable` |
| **audit_profile** | `full` |
| **git_branch** | `task/demo-p0-golden` |
| **semi_auto** | `false` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | pending | 22, 30 | 10 完成后维护者签 |
| HG-AUDIT-R1 | pending | 30 | 22 R1 落盘后人签 · **P0 关键闸** |

> **演示提示**：阶段 B 完成后将 `HG-AUDIT-R1` 改为 `approved` 再跑 gate-check。

---

## 背景与目标

在空业务仓中证明 **cyning-harness harness-only** preset 可支撑：

1. `install` + `harness-sync apply` 纪律层就绪  
2. 10 → 22(R1) →（人签）→ 30 帽链可执行  
3. `gate-check.sh` 机械拦截未签 30  

完成态：业务仓存在 `src/p0-demo/hello.txt`，内容为 `harness-p0-ok`。

---

## 范围

- [ ] 按 ACCEPTANCE 走通 10 / 22 / gate-check / 30  
- [ ] 产出至少一份 `docs/harness/reviews/*_audit_R1_*.md`  
- [ ] 创建 `src/p0-demo/hello.txt`

## 非范围

- 图谱 / wiki 五轨全量  
- npx CLI · manifest（v0.3）  
- 40-self-check 帽（A2）  
- 上游 OSS PR  

---

## 失败路径

| 触发条件 | 系统行为 | 可重试 | 用户可见 |
|----------|----------|--------|----------|
| `HG-AUDIT-R1` = pending 时 30 | Agent **拒开工** · gate-check exit 2 | 是 | `TEMPLATE_30_gate_stop` |
| `HG-AUDIT-R1` = rejected | 强制退回 10 · status → draft | 是 | 须记录否决理由 |
| sync 覆盖 task/reviews | **禁止**（S2） | — | plan 可见 diff |

---

## 验收标准

- [ ] `gate-check.sh` 签前拒 30、签后放行  
- [ ] `docs/harness/reviews/` 有 R1 审核落盘  
- [ ] `src/p0-demo/hello.txt` 内容为 `harness-p0-ok`  
- [ ] task 表 `HG-TASK-DRAFT` 与 `HG-AUDIT-R1` 均为 `approved`（30 后）

---

## 给执行帽的必读列表

1. 本 task  
2. `docs/harness/prompts/10-requirements.md` · `22-task-audit.md` · `30-execute-code.md`  
3. [`examples/demo_checkout/ACCEPTANCE.md`](./ACCEPTANCE.md)  
4. [`docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md`](../../docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md) §4（状态机 · 可选）

---

## 实现备忘（30 回填）

| 项 | 状态 | 备注 |
|----|------|------|
| `src/p0-demo/hello.txt` | ⏳ | 30 创建 |
| reviews R1 | ⏳ | 22 落盘 |

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-15 | P0 金样初版 |
