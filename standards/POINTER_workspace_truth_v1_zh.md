# POINTER · 工作区编码规范真值（Ink · 不复制全文）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **日期** | 2026-06-09 |
| **性质** | **只读指针**；Starter 交付 TEMPLATE，Ink 维护 L1/L2 **active** 条文 |

---

## 纪律（D-M2-04）

| 规则 | 说明 |
| --- | --- |
| **禁止双维护** | 不得将 Ink `docs/standards/` L1/L2 **全文**复制进 `cyning-harness` 产品仓 |
| **嵌入用户仓** | 从本目录 **TEMPLATE_*** 复制生成用户仓 `docs/standards/`；按需 **POINTER** 回链 Ink |
| **冲突** | task + 图谱 + PROJECT_CONFIG > 用户仓已嵌入 L1/L2 > 本 POINTER |

---

## Ink 工作区真值（金样 · 只读）

> 路径相对 **cyning-ink-workspace**（本地常名 `Projects/`）。无访问权限时仅用本仓 TEMPLATE。

| 资产 | 路径 | 状态 |
| --- | --- | --- |
| **L1 基线** | `docs/standards/CODING_BASELINE_L1_v1_zh.md` | `active` · R1 2026-06-09 |
| **L2 前端** | `ai-ink-brain/docs/standards/CODING_FRONTEND_L2_v1_zh.md` | `active` |
| **L2 后端** | `ai-ink-brain-api-python/docs/standards/CODING_BACKEND_L2_v1_zh.md` | `active` |
| **外部参考** | `docs/standards/SOURCES_编码规范外部参考_v1_zh.md` | `draft` |
| **改进大纲** | `docs/standards/00_OUTLINE_工程编码规范改进_v1_zh.md` | 规划 |
| **Harness 衔接** | `docs/harness/guides/GUIDANCE_standards_in_harness_starter_m2_v1_zh.md` | M2 打包真值 |

---

## 治理仓（可选 · 私有）

| 仓 | 用途 |
| --- | --- |
| [`cyning-ai-coding-governance`](https://github.com/Cyning12/cyning-ai-coding-governance) | 方法论 · L3/L2/L1 整合导读 · 对比研究 |

本地镜像（若有）：`Projects/ai_coding_governance/methodology/`

---

## M2 金样来源（后续 T6）

- 编码规范 Epic：`ai-ink-brain-api-python/docs/tasks/active/task_standards_backend_api_modularization_manifest_v1.md`
- 过程 invoke：工作区 `docs/harness/invokes/by-task/`（**不**复制进产品仓）

---

## 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-06-09 | M2 T2：TEMPLATE + POINTER 首版 |
