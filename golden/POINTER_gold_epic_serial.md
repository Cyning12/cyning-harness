# POINTER · 金样：串行 Epic + invoke 链（M1 · 不复制业务代码）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **日期** | 2026-06-09 |
| **freeze_id** | `freeze_epic_orchestration_pilot_v1` |
| **性质** | **只读指针**；金样真值在 Ink 私有工作区，本产品 **不复制** 业务代码或 invoke 全文 |

---

## 金样是什么

**M1 已签收** 的前端 Epic 串行编排试点：Epic 总纲 + 00 编排 + **M01→M02→M03** 子 task 链 + invoke 落盘 + CI 绿 + PR merge。

| 维度 | 值 |
|------|-----|
| **编排模式** | 单分支串行 · `Cursor Task 链` · `semi_auto: false` |
| **子仓** | `ai-ink-brain/`（前端 Ink） |
| **Epic slug** | `tech-debt-code-quality-frontend` |
| **分支（已 merge）** | `task/tech-debt-code-quality-frontend` |
| **人签** | `HG-M1-SIGNOFF` approved（2026-06-09） |

---

## 证据路径（Ink 私有工作区 · 只读）

> 本地常名 `Projects/`（cyning-ink-workspace）。无访问权限时仅用本产品 `harness/templates/TASK_epic.md` 作结构对照。

### 工作区 · M1 跟踪 task

| 资产 | 路径 |
|------|------|
| M1 签收单 | `docs/harness/tasks/done/task_harness_m1_epic_orchestration_frontend_pilot_v1.md` |
| Epic 编排 GUIDANCE | `docs/harness/guides/GUIDANCE_epic_orchestration_task_chain_v1_zh.md` |
| PLAN §6 M1 行 | `docs/harness/guides/PLAN_self_hosted_runtime_mvp_phases_v1_zh.md` |

### 前端子仓 · Epic 与 invoke

| 资产 | 路径 |
|------|------|
| Epic 总纲（done） | `ai-ink-brain/docs/tasks/done/task_tech_debt_code_quality_frontend_epic_v1.md` |
| **invoke 索引目录** | `ai-ink-brain/docs/harness/invokes/by-task/tech-debt-code-quality-frontend/` |
| 关账 invoke | `…/invoke_20260609_CLOSE_epic.md` |
| 00 编排 | `…/invoke_20260609_00_orchestrator.md` |

### M1 签收子集（串行棒）

| 棒 | 子 task（done） | 典型 invoke |
|----|-----------------|-------------|
| 00 | 编排派发 M01 | `invoke_20260609_00_orchestrator.md` |
| M01 | `task_tech_debt_cq_frontend_m01_py_proxy_v1.md` | `invoke_20260609_40_m01_py_proxy.md` |
| M02 | `task_tech_debt_cq_frontend_m02_bff_routes_v1.md` | `invoke_20260609_40_m02_bff_routes.md` |
| M03 | `task_tech_debt_cq_frontend_m03_unified_chat_v1.md` | `invoke_20260609_40_m03_unified_chat.md` |

M04～M06 为编码 Epic 延续（已关账），**不阻塞** M1 签收。

### 外部链接

| 项 | URL |
|----|-----|
| PR → production | https://github.com/Cyning12/ai-ink-brain/pull/64 |
| PR → main | https://github.com/Cyning12/ai-ink-brain/pull/65 |

---

## 与本产品（cyning-harness）的关系

| 本产品资产 | 对照金样 |
|------------|----------|
| [`harness/templates/TASK_epic.md`](../harness/templates/TASK_epic.md) | Epic 编排主表 §3.1 |
| [`harness/templates/TASK_TEMPLATE.md`](../harness/templates/TASK_TEMPLATE.md) | 各 sub-task 结构 |
| [`harness/invokes/TEMPLATE_invoke.md`](../harness/invokes/TEMPLATE_invoke.md) | invoke 快照格式 |
| M2 本仓执行 invoke | 工作区 `docs/harness/invokes/by-task/cyning-harness-v0-1/`（**不**复制进产品仓） |

**纪律**：clone `cyning-harness` 的用户 **打开金样** = 有权限时读上述 Ink 路径；否则按模板 + 本 POINTER 摘要演练。

---

## 后端编码 Epic（可选对照 · 非 M1 别名）

| 项 | 路径 |
|----|------|
| CC W2～W8 Manifest | `ai-ink-brain-api-python/docs/tasks/active/task_standards_backend_api_modularization_manifest_v1.md` |
| 说明 | 形态类似 Epic+PR，**≠** PLAN M1 编排试点；可作 M2 扩展金样来源 |

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-09 | M2 T6：M1 串行 Epic 金样 POINTER 首版 |
