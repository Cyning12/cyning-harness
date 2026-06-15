# 审核稿 · B9 方案：Agent-shell 并行实验（ExecutionShell 层）

| 项 | 内容 |
| --- | --- |
| **状态** | `review_done` · **APPROVE_WITH_CHANGES** |
| **版本** | v1.1 |
| **日期** | 2026-06-15 |
| **提交方** | 维护者 / 路线 Epic #9 |
| **审核方** | 外部 Agent（只读 · 输出可行性结论） |
| **关联 task** | [`task_cyning_harness_b9_agent_shell_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b9_agent_shell_v1.md) |
| **Invoke Prompt** | [`../prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md`](../prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md) |

---

## 0. 请审核 Agent 回答什么

**一句话**：在 **不替代 repo 嵌入（kimi-code-meta）** 的前提下，把 SDD 纪律放到 **Kimi Code Agent 层** 是否 **可行、有价值、且不破坏产品边界**？

**须给出**：`APPROVE` / `APPROVE_WITH_CHANGES` / `REJECT` + 理由 · 不超过 1200 字。

---

## 1. 问题陈述

| 观察 | 含义 |
| --- | --- |
| kimi-code-meta | **项目规则**：docs/harness、task、reviews · 深绑定 Inform/Verify |
| 用户提议 | **Agent 规则**：改 Kimi Code 默认 policy · 非项目目录 |
| 并行策略 | **#8 主链先跑** · #9 **核实期完成** · 不挡 Q3 push |

---

## 2. 方案摘要

```text
部署形态对比
├── Repo-embedded（现有）   .cyning-harness + docs/harness + task
├── Agent-shell（本方案）  ~/.kimi-code/ 或 fork 内 agent policy
└── Hybrid（目标态）       shell 默认行为 + 打开仓读 repo 真值（repo 优先）
```

**实验范围（v1.1 · 审核后）**：

- Kimi **个人 fork** 分支注入 Orchestrate 摘要（gate-stop、帽链顺序）
- **3 scenario × 2 部署**（#8 **冻结后**同源 · repo-embedded vs shell-only）
- Hybrid：**可选** 加分轮 · 非必做
- **Week-1** 验证 H1（硬 gate vs 软提示）
- **≤4h/周** · 核实期 v0.3–v0.4
- 产出：1 页 findings · H1 失败则 **不做** v0.4 示例目录

---

## 3. 设计约束（审核时不得突破）

| ID | 约束 |
| --- | --- |
| C1 | **不** PR agent 规则进 Moonshot upstream |
| C2 | **不** 声称替代 repo 嵌入或 npx install |
| C3 | P1：不做 Runtime · 不改 Tool Host |
| C4 | 与 #8 指标 **同口径** · 部署面标注清楚 |
| C5 | Epic CLOSE **不强制** 依赖 #9 |

---

## 4. 假设清单（请审核真伪）

| # | 假设 | 若 false 的影响 |
| --- | --- | --- |
| H1 | Shell 层可 enforce **30 首行 gate-stop** | 方案退化为「软提示」 |
| H2 | 无 repo 时 Inform/Verify **显著弱化** | 只能宣传 Orchestrate 演示 |
| H3 | Hybrid「repo 优先」可在 Kimi 实现 | 否则双真值冲突 |
| H4 | 对 Kimi 求职叙事 **加分** | 若 REJECT 可只做内部笔记 |
| H5 | 3 scenario × **2** 部署 **一人可完成** | Hybrid 为加分轮 · 非 3×3 |

---

## 5. 与 kimi-code-meta / 产品本体关系

| 维度 | kimi-code-meta | Agent-shell |
| --- | --- | --- |
| 真值位置 | BusinessRepository | ExecutionShell |
| ICVO 覆盖 | 较完整 | Orchestrate 为主 |
| D6 上游 PR | 过程轨隔离 | agent 实验 **更不宜** upstream |
| 产品 preset | `kimi-code-meta` | 拟 `kimi-code-agent-shell`（proposal） |

**本体引用**：`Task --executedIn--> ExecutionShell` · IDETrack 桥接 · 非第二 DisciplinePackage。

---

## 6. 风险与反模式

| 风险 | 缓解 |
| --- | --- |
| 双真值（shell vs repo prompts 冲突） | Hybrid 规则：repo marker 存在则 **disable shell 覆盖** |
| 被误解为 Kimi fork 竞品 | 文档写明 **个人实验分支** |
| 分散 A1 人力 | **核实期**做 · weekly timebox |
| Bench 误用 | 与 #8 共用 scenario · 只比 **合规率差异** |

---

## 7. 成功标准（方向通过）

审核 **APPROVE** 当且仅当（可带修改项）：

- [ ] Agent-shell **值得** v0.4 后保留为 **第二 DistributionChannel** 选项
- [ ] **不**削弱「纪律包 = repo 嵌入」主叙事
- [ ] 实验设计 **3 个月内一人可完成**
- [ ] 与 Kimi Code SDK/配置 **技术路径清晰**（即使仅 fork 级）

---

## 8. 审核 Agent 输出模板

```markdown
## 结论
APPROVE | APPROVE_WITH_CHANGES | REJECT

## 可行性（1–5）
## H1–H5 逐条判定
## 与 #8 主链关系（应并行还是串行）
## 必改项
## 若 REJECT：建议替代方案（一句）
```

---

## 10. 审核记录（2026-06-15）

| 项 | 内容 |
| --- | --- |
| **结论** | **APPROVE_WITH_CHANGES** |
| **可行性** | 3/5 |
| **HG-B9-DIRECTION** | `approved_with_changes` |

**H1–H5 判定摘要**：

| 假设 | 判定 |
| --- | --- |
| H1 gate-stop | 部分真 · Week-1 验证 |
| H2 无 repo 弱化 | **真** |
| H3 Hybrid | 设计可行 · 待证 |
| H4 求职加分 | 边际 |
| H5 工作量 | **3×2** 可完成 |

**必改项（已回写 task #9）**：3×2 矩阵 · ≤4h/周 · Week-1 H1 · 不进 upstream · findings 写「壳层不足回 repo」  

**与 #8**：#8 scenario **冻结后**再开 #9 · Epic 不强制 #9 · **并行、弱依赖**  

**叙事**：主路径 repo+npx · shell = 第二 DistributionChannel · **禁止**单独宣传「不必 embed」

---

## 9. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 提交外部审核 |
| v1.1 | 2026-06-15 | 审核结论 · 3×2 · timebox · §10 记录 |
