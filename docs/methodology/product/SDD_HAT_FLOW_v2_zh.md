# SDD 帽链流程（V2 · 产品仓真值）

| 项 | 内容 |
|----|------|
| **版本** | v2.0 |
| **日期** | 2026-06-21 |
| **关联** | [`DESIGN_ONTOLOGY_v1_zh.md`](./DESIGN_ONTOLOGY_v1_zh.md) §3.2 · §4.1 · §8 · [`../../../harness/prompts/README.md`](../../../harness/prompts/README.md) |

---

## 1. 标准流程（功能 / Epic）

```text
人 + 00 chat 生成大纲
  → 10-spec R0–R9（回填 SPEC · 可多轮）
  → 20-spec-audit（规格验收 · reviews/）
       ↔ HG-SPEC-SIGNOFF（人签 · 未过则回到 10-spec 或 20 再审）
  → 00 起草 P0 task（自 SPEC §13 投影）
  → 10-task（回填 task §5）
  → 20-task-audit R1（reviews/ · 可打回 10-task）
       ↔ HG-AUDIT-R1（人签）
  → 30 实现
  → 40 自检（通常由 30 同一 Agent 连续执行 · 失败自修并重跑 40 直至通过 · 无需单独开 40 对话）
  → 50 独立复检（可选 · 未过打回 30）
  → CLOSE（关账 · KPI）
```

**10 / 20 配对**

| 10 | 20 | 人闸 |
|----|-----|------|
| 10-spec | 20-spec-audit | HG-SPEC-SIGNOFF |
| 10-task | 20-task-audit | HG-AUDIT-R1 |

历史别名：`10-requirements`→10-task · `22-task-audit`→20-task-audit。

---

## 2. 打回与关账

| 节点 | 常见打回 | 说明 |
|------|----------|------|
| 20-spec-audit | → **10-spec** | 规格缺口 · 人闸 pending / rejected |
| 20-task-audit | → **10-task** | task 验收 / failure_paths 不可执行 |
| 50 | → **30** | 独立视角发现实现问题 |
| CLOSE | → **下一 task / SPEC 增量** | 小问题留后续迭代 |
| CLOSE | → **10-spec 或 10-task** | 结果与预期相差太远 · 维护者决策重开 |

**30→40**：不强制新对话；30 Agent 跑验证命令、回填 `### 自检结论（执行者）`，不通过则改码再跑，直到 task 所列命令绿。

**00**：编排层 · 不写产品代码 · 起草 SPEC/task · 派下一棒 Prompt。

---

## 3. bugfix 捷径

Issue ≈ mini-SPEC 且已签收时：**跳过 10-spec / 20-spec-audit** · 自 **00 草稿 task → 10-task → 20-task-audit → …**。

---

## 4. Starter 包与用户仓

| 帽 | 产品仓 Starter | 完整 Prompt |
|----|----------------|-------------|
| 10-task | `harness/prompts/10-requirements.md` | 工作区 Extended |
| 20-task-audit | `harness/prompts/22-task-audit.md` | 同上 |
| 30 / 40 | ✅ Starter | 同上 |
| 10-spec / 20-spec-audit / 00 / 50 | POINTER | 工作区 `docs/harness/prompts/` |

工作区 Ink 全量库：[`docs/harness/guides/GUIDANCE_harness_hat_v2_chain_v1_zh.md`](../../../../docs/harness/guides/GUIDANCE_harness_hat_v2_chain_v1_zh.md)（POINTER · 私有 monorepo）。

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0 | 2026-06-21 | 与 Ink 工作区 V2 对齐 · 30→40 同 Agent · 50/CLOSE 打回规则 |
