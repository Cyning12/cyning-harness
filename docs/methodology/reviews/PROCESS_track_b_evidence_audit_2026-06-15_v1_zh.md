# PROCESS · Track B 证据方案审核纪要（2026-06-15）

| 项 | 内容 |
| --- | --- |
| **状态** | `closed` |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **Epic** | [`TASK_epic_cyning_harness_roadmap_v0_2_to_v1_v1.md`](../../../../docs/harness/tasks/active/TASK_epic_cyning_harness_roadmap_v0_2_to_v1_v1.md) |
| **范围** | B8（1+3 主链）· B9（Agent-shell 并行）方向审核与回写 |

---

## 1. 背景

**问题**：行业 Agent Bench（Terminal-Bench、SWE-bench）测 **解题完成率**，难以直接证明 **外挂式纪律包** 在 Inform/Verify 绑定下的过程签收价值。

**维护者决策（2026-06-15）**：

| 线 | 内容 | 优先级 |
| --- | --- | --- |
| **1+3** | B2 真实试点量化 + SDD-Compliance micro-bench | **主链** · Epic #8 |
| **2** | Agent-shell（Kimi agent 规则层 SDD） | **并行** · Epic #9 · 核实期 · 不挡 Q3 push |

**部署形态共识**：

- **Repo 嵌入**（`kimi-code-meta`）：全 ICVO · 主证据
- **Agent 层**（shell）：Orchestrate + 轻 Constrain · Inform/Verify 仍靠 repo
- **Hybrid**：repo marker 存在时 **repo 真值优先**

---

## 2. 产出物时间线

| 阶段 | 日期 | 动作 | 落点 |
| --- | --- | --- | --- |
| T1 | 2026-06-15 | Epic 增 **#8 / #9** · ROADMAP v1.3 Track B 证据三线 | 工作区 `docs/harness/tasks/active/` · `ROADMAP_v1_zh.md` |
| T2 | 2026-06-15 | 撰写两份 **审核稿** + 联合 Invoke Prompt | `reviews/REVIEW_B3_*` · `REVIEW_B9_*` · `prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md` |
| T3 | 2026-06-15 | **外部 Agent** 执行 PROMPT 阶段 A–C | 结论见 §3 |
| T4 | 2026-06-15 | 必改项 **回写** task · REVIEW v1.1 · Epic / ROADMAP | 本纪要 §4 |
| T5 | 2026-06-15 | 起草 **PILOT_EVIDENCE_B2_v1_zh.md** 空模板 | `execution/PILOT_EVIDENCE_B2_v1_zh.md` |

---

## 3. 外部审核结论摘要

| 方案 | 结论 | 可行性 | HG |
| --- | --- | --- | --- |
| **B8 · 1+3** | APPROVE_WITH_CHANGES | 4/5 | `HG-B8-DIRECTION` = approved_with_changes |
| **B9 · shell** | APPROVE_WITH_CHANGES | 3/5 | `HG-B9-DIRECTION` = approved_with_changes |

**交叉问题（审核 Agent）**：

1. 1+3 与 2 并行 **合理**（#8 主投入 · #9 ≤4h/周）
2. 若只能做一个 → **砍 #9**
3. 对外叙事 **不矛盾**，若统一 **repo-primary**
4. 1+3 已接近最小双证据集；不宜再砍 bench 雏形

详文：[`REVIEW_B3` §10](./REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md#10-审核记录2026-06-15) · [`REVIEW_B9` §10](./REVIEW_B9_agent_shell_parallel_v1_zh.md#10-审核记录2026-06-15)

---

## 4. 必改项锁定（已回写 task）

### B8（#8）

| # | 必改项 |
| --- | --- |
| 1 | v1 micro-bench **仅 S1–S4** · S5 等 v0.3 gate 后再纳入 |
| 2 | B2 增 **`upstream_pr_d6_clean`**（D6 机制证据） |
| 3 | Part B 标注依赖 P0 绿 · **不预写**合规率 |
| 4 | 对外标题 **SDD-Compliance** · 禁 Agent Score |
| 5 | 双证据 **同页** · 与 #4 dogfood **共用样本** |

### B9（#9）

| # | 必改项 |
| --- | --- |
| 1 | 实验矩阵 **3×2**（repo vs shell）· Hybrid 可选 |
| 2 | **≤4h/周** · 核实期 v0.3–v0.4 |
| 3 | **Week-1** 验证 H1（硬 gate vs 软提示） |
| 4 | 不进 Moonshot upstream |
| 5 | **#8 scenario 冻结后**再开 #9 |

---

## 5. 后续闸门

| 闸门 | 条件 |
| --- | --- |
| #8 开工 | P0 金样 ACCEPTANCE 全绿 |
| #8 SIGNOFF | B2 表 + bench 报告 · 数字 **冻结后**进 README |
| #9 开工 | #8 scenario 定义冻结 |
| Epic CLOSE | **不强制** #9 |

---

## 6. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 审核闭环纪要 |
