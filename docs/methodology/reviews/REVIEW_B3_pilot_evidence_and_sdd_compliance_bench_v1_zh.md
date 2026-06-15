# 审核稿 · B8 方案：B2 试点量化 + SDD-Compliance micro-bench（1+3）

| 项 | 内容 |
| --- | --- |
| **状态** | `review_done` · **APPROVE_WITH_CHANGES** |
| **版本** | v1.1 |
| **日期** | 2026-06-15 |
| **提交方** | 维护者 / 路线 Epic #8 |
| **审核方** | 外部 Agent（只读 · 输出可行性结论） |
| **关联 task** | [`task_cyning_harness_b8_b2_compliance_bench_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b8_b2_compliance_bench_v1.md) |
| **Invoke Prompt** | [`../prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md`](../prompts/PROMPT_feasibility_review_b_evidence_v1_zh.md) |

---

## 0. 请审核 Agent 回答什么

**一句话**：在 **不追 Agent 解题 Bench** 的前提下，「真实试点 B2 + 5 场景合规 micro-bench」能否作为 cyning-harness **v1.0 有用性** 的主证据？

**须给出**：`APPROVE` / `APPROVE_WITH_CHANGES` / `REJECT` + 理由 · 不超过 1200 字。

---

## 1. 问题陈述

| 痛点 | 说明 |
| --- | --- |
| 行业 Bench 偏 Agent | Terminal-Bench、SWE-bench 测 **任务完成率**，非 **过程签收** |
| 纪律包外挂 | 价值随 **Inform/Verify 与项目绑定** 加深；浅绑定难证「比不用强」 |
| 对外 credibility | STRATEGY 要求 **B2 在 Q3 push 前** · README 须可自证 |

---

## 2. 方案摘要（1+3）

```text
Part A · B2（真实）
  kimi-code-meta / 历史 task retro
  → 打回率、R1 轮次、CI 首次绿、gate 拦截、接入人天

Part B · micro-bench（可复现）
  5 固定 scenario · 公理 D2/D3/S2
  → gate-check 机械化打分 · 合规率 %
  → 不测 LLM 解题
```

**与 Terminal-Bench 关系**：**互补、不对标**。对外叙事：「测敢不敢合，不测会不会做题。」

---

## 3. 设计约束（审核时不得突破）

| ID | 约束 |
| --- | --- |
| C1 | 产品 P1：不做 LLM Runtime |
| C2 | 样本量小须 **明示**（n、task 类型）· 禁止外推胜率 |
| C3 | 未冻结数字 **不进** 公众稿（篇 1 §8） |
| C4 | bench 只测 **Orchestrate/Verify 可机械部分**（gate、review 文件存在） |
| C5 | 一人维护 · Part B 优先脚本化 gate-check · 不依赖大规模人工标注 |

---

## 4. micro-bench scenario（v1.1 · 审核后）

| ID | 场景 | 夹具要点 | 期望（合规） | v1 纳入 |
| --- | --- | --- | --- | --- |
| S1 | R1 pending 即 30 | task 表 HG-AUDIT-R1=pending | gate-check exit≠0 · 30 应拒（D2） | **是** |
| S2 | R1 approved | HG-AUDIT-R1=approved · 无 review 文件 | gate 警告或 22 不合规 | **是** |
| S3 | R1 approved + review 落盘 | 有 `reviews/*_R1_*` | gate-check exit=0 | **是** |
| S4 | sync 域 vs S2 | plan 列出 tasks/ 路径 | apply **不得**含 S2 路径 | **是** |
| S5 | rejected → draft | HG-AUDIT-R1=rejected | gate 建议 status=draft | **条件项** · v0.3+ gate 落地后 |

> **审核结论**：S1–S4 覆盖产品差异化核心；v1.0 **不必**增 D4/D5 scenario · README **须声明覆盖边界**。

---

## 5. B2 字段草案（PilotEvidence）

| 字段 | 采集方式 | 用途 |
| --- | --- | --- |
| `audit_reject_rate` | 22 轮次中「内容阻塞」比例 | Orchestrate 有效性 |
| `audit_rounds_mean` | R1→R2… 平均轮次 | 协作成本 |
| `ci_first_green_rate` | 改码 task 首次 CI 绿 | Verify |
| `gate_block_count` | 30 前 gate-check 拦截次数 | 公理执行 |
| `wizard_adoption_days` | install→首 task CLOSE | 产品 UX |
| `sample_n` | task 数 · 类型 | 诚实边界 |
| **`upstream_pr_d6_clean`** | D6 双分支零泄漏 PR 数/率 | **机制证据**（审核必增） |
| `failure_report_count` | 30 失败路径次数 | 可选 |

---

## 6. 风险与反模式（请审核是否认同）

| 风险 | 缓解 |
| --- | --- |
| n 太小不可信 | 并列 **机制证据**（上游 PR 链）+ bench **可复现** |
| bench 与真实脱节 | scenario 来自 P0 金样 + kimi 真实失败模式 |
| 被误读为「模型 Benchmark」 | README 标题用 **SDD Compliance** · 非 Agent Score |
| 维护成本 | 5 scenario 固定 · semver 大改才增 scenario |

---

## 7. 成功标准（方向通过）

审核 **APPROVE** 当且仅当（可带修改项）：

- [ ] B2 + micro-bench **足以支撑** v1.0 README「为何有用」段落
- [ ] **不**与产品本体 / ROADMAP / 篇 1 §8 冲突
- [ ] 一人 **8 月底前** 可完成 Part A 最小集 + Part B 脚本雏形
- [ ] 不要求 Terminal-Bench 对照作为门禁

---

## 8. 审核 Agent 输出模板

```markdown
## 结论
APPROVE | APPROVE_WITH_CHANGES | REJECT

## 可行性（1–5）
## 与战略一致性
## 必改项（若 APPROVE_WITH_CHANGES）
## 可选增强
## 是否建议合并/拆分 Part A 与 B
```

---

## 10. 审核记录（2026-06-15）

| 项 | 内容 |
| --- | --- |
| **结论** | **APPROVE_WITH_CHANGES** |
| **可行性** | 4/5 |
| **HG-B8-DIRECTION** | `approved_with_changes` |

**必改项（已回写 task #8）**：

1. v1 bench **仅 S1–S4** · S5 对齐 v0.3 后再纳入  
2. B2 增 **`upstream_pr_d6_clean`**  
3. Part B 标注依赖 P0 绿 · **不预写**合规率  
4. README 标题 **SDD-Compliance** · 禁 Agent Score  

**可选增强**：双证据同页 · 与 #4 共用样本 · 同 task 分节交付  

**交叉问题（摘要）**：1+3 与 2 并行合理（#8 主投入 · #9 ≤4h/周）；若只能做一个 **砍 #9**；叙事不矛盾若 **repo-primary**；1+3 已接近最小双证据集。

---

## 9. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 提交外部审核 |
| v1.1 | 2026-06-15 | 审核结论 · S1–S4 · D6 字段 · §10 记录 |
