# Release v1.0.0 · A4 stable

> **包名**：`@cyning/harness@1.0.0`  
> **许可**：MIT  
> **日期**：2026-06-16  
> **代号**：A4 · Stable（纪律包 · 无业务代码 · 无 LLM Runtime）

---

## 概要

本版本为 **v1.0 stable**：完成 ICVO 四支柱机械审计、InvokeSnapshot 索引、Inform 图谱闸，并将 #8 B2 试点证据写入 README。v0.4 已解决「能公开分发」；v1.0 解决「公理可机械审计 + 编排索引 + Inform 图谱闸 + 证据进 README」。

**定位**：嵌入任意业务仓的 **SDD 过程纪律包**（Inform / Constrain / Verify / Orchestrate 仓库化落地），与 Agent Runtime / MCP 宿主 **互补而非竞争**。详见 [`docs/ETCLOVG_MAPPING_v1_zh.md`](./ETCLOVG_MAPPING_v1_zh.md)。

---

## Quick Start

在 **目标业务仓根**（非本产品仓根）：

```bash
npx @cyning/harness@1.0.0 init --preset harness-only --ide cursor,agents
npx @cyning/harness upgrade
npx @cyning/harness check
npx @cyning/harness audit --target . --task docs/tasks/active/task_xxx.md
```

---

## 新增

| 项 | 说明 |
| --- | --- |
| **`harness audit`** | ICVO 机械审计 CLI · D3/D5/S5 · 复用 `gate-check.sh` |
| **`schema/invoke_index.v1.schema.json`** | InvokeSnapshot 机器索引 schema |
| **`wizard/harness-sync.sh --index`** | 生成 `.cyning-harness/invoke_index.json`（只读聚合 · 不覆盖 S2 域） |
| **`wizard/gate-check.sh --graph [--json]`** | Inform 图谱闸 · 读 `HG-GRAPH-MODULES` + `docs/_tech_graph/` |
| **B2 试点证据** | README「试点证据（B2）」节 · 链 [`PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md) |
| **SDD-Compliance micro-bench** | `examples/compliance_bench/` · `wizard/compliance-bench.sh` · S1–S4 4/4 |

---

## 变更

- **README** · **ONBOARDING**：v1.0 stable 叙事 · ICVO 审计 · B2 证据
- **`ontology.yaml`**：`product_semver: "1.0.0"`

---

## 继承自 v0.4.0（仍可用）

- **npx CLI**：`init` · `upgrade` · `check` · `audit` · `task check`
- **Starter 四帽**：10 / 22 / 30 / 40 · `gate-check` · manifest · S5 git-clean
- **金样**：[`examples/demo_checkout/`](../examples/demo_checkout/) · P0 10→22→30

---

## 验证

维护者关账前已跑：

- `npm test` — **23/23** pass
- `bash -n wizard/*.sh wizard/lib/*.sh` — 语法 OK
- `harness audit` 签前 fail / 签后 pass
- `harness-sync.sh --index` 生成 JSON 可解析
- `gate-check.sh --graph --json` 输出模块审核摘要

---

## 已知限制

- **demo 阶段 E**（22 CLOSE 终轮）仍可选 defer
- **Extended 帽**（00/50/链式 PROMPT）不在 Starter 默认闭包 · 见 `harness/prompts/README`
- **Track G HGM**：v1.0 后 30 天内书面决策，v2.0+ 另开 Epic

---

## 完整变更日志

[`CHANGELOG.md`](../CHANGELOG.md#100---2026-06-16)

---

## 链接

- **使用手册**：[`docs/USER_GUIDE_v1.0_zh.md`](./USER_GUIDE_v1.0_zh.md)
- 文档索引：[`docs/README.md`](./README.md)
- 接入：[`docs/ONBOARDING.md`](./ONBOARDING.md)
- 路线：[`docs/methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md)
- 试点证据：[`docs/methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md`](./methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md)
