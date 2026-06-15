# 试点证据 · B2 量化 + SDD-Compliance micro-bench（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `draft` · **数字未冻结** |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **task** | 工作区 [`task_cyning_harness_b8_b2_compliance_bench_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b8_b2_compliance_bench_v1.md) |
| **审核** | [`REVIEW_B3` §10](../reviews/REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md#10-审核记录2026-06-15) · APPROVE_WITH_CHANGES |
| **ROADMAP** | v0.4→v1.0 闸门 · [`ROADMAP_v1_zh.md`](../ROADMAP_v1_zh.md) §5 |

> **读者说明**：本文档为 **双证据** 同页真值。**Part A** = 真实试点 retro（小样本 · 机制叙事）；**Part B** = 可复现 SDD-Compliance bench（不测 LLM 解题）。  
> **禁止**在未冻结前将下表数字复制进 README / 公众稿（续篇篇 1 §8）。

---

## 0. 证据策略（一句话）

**测敢不敢合，不测会不会做题。** 与 Terminal-Bench / SWE-bench **互补、不对标**。

---

## Part A · B2 真实试点量化

### A.1 样本说明

| 字段 | 值 |
| --- | --- |
| **preset** | `kimi-code-meta`（repo 嵌入 · 主路径） |
| **样本窗口** | _TBD_（如 2026-Q2） |
| **`sample_n`** | _TBD_ |
| **task 类型** | _TBD_（如 harness-only / 跨仓 Epic / dogfood） |
| **是否与 #4 共用** | 是 · 与 [`task_cyning_harness_b_kimi_dogfood_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b_kimi_dogfood_v1.md) 对齐 task 列表 |
| **retro 方法** | 22 轮次日志 · gate-check 拦截记录 · CI 首次绿 · D6 PR 链人工核对 |

### A.2 指标表（PilotEvidence）

| 字段 | 定义 | 值 | 备注 |
| --- | --- | --- | --- |
| `audit_reject_rate` | 22 轮次中「内容阻塞 / 打回」比例 | _TBD_ | Orchestrate 有效性 |
| `audit_rounds_mean` | R1→R2… 平均轮次 | _TBD_ | 协作成本 |
| `ci_first_green_rate` | 含改码 task 的 **首次** CI 绿比例 | _TBD_ | Verify |
| `gate_block_count` | 30 前 gate-check **拦截**次数（累计或均值/task） | _TBD_ | 公理 D3 辅助 |
| `wizard_adoption_days` | install/adopt → 首个 task CLOSE 人天 | _TBD_ | 产品 UX |
| **`upstream_pr_d6_clean`** | D6 双分支 **零过程轨泄漏** PR 数 / 率 | _TBD_ | **机制证据** · 审核必增 |
| `failure_report_count` | 30 失败路径 / FailureReport 次数 | _TBD_ | 可选 |
| `sample_n` | 纳入统计的 task 数 | _TBD_ | **诚实边界** · 禁止外推胜率 |

### A.3 机制证据（叙事用 · 非胜率）

| 项 | 说明 | 状态 |
| --- | --- | --- |
| 上游 PR 链 | Kimi fork → Moonshot upstream · 过程轨隔离 | _TBD_ |
| gate 拦截样例 | 1–2 个 **匿名化** 拦截场景（pending R1 拒 30 等） | _TBD_ |
| 与 bench 关系 | Part B 覆盖 **可机械复现** 子集；Part A 覆盖 **真实绑定深度** | 见 Part B |

### A.4 Part A 采集清单（维护者）

- [ ] 列出纳入 `sample_n` 的 task slug + 类型
- [ ] 从 #4 dogfood 增量填入 fork 数据
- [ ] 核对 D6 PR：过程轨文件未进入 upstream diff
- [ ] **冻结前**勿写入 README / 续篇 vol3

---

## Part B · SDD-Compliance micro-bench

> **依赖**：P0 金样 ACCEPTANCE 全绿 · gate-check 行为与 P0 金样 D2/D3 一致。  
> **初版范围**：**S1–S4** · S5（rejected→draft）待 **v0.3** gate 落地后再纳入。

### B.1 覆盖边界（README 须声明）

| 测 | 不测 |
| --- | --- |
| D2 HumanGate · D3 gate-check · S2 sync 域 | D4/D5 完整路径 |
| Orchestrate / Verify **可机械部分** | Terminal-Bench · pass@1 · Agent Score |
| gate exit code · review 文件存在性 | LLM 解题质量 |

### B.2 Scenario 定义（v1 · S1–S4）

| ID | 场景 | 公理 | 期望（合规） | 夹具路径 | 实测 |
| --- | --- | --- | --- | --- | --- |
| **S1** | R1 pending 即 30 | D2 | gate-check exit≠0 · 30 应拒 | `examples/compliance_bench/S1_r1_pending/` | _待 P0 绿_ |
| **S2** | R1 approved · 无 review | D2/D3 | gate 警告或 22 不合规 | `examples/compliance_bench/S2_r1_no_review/` | _待 P0 绿_ |
| **S3** | R1 approved + review 落盘 | D2/D3 | gate-check exit=0 | `examples/compliance_bench/S3_r1_with_review/` | _待 P0 绿_ |
| **S4** | sync 域 vs S2 | S2 | apply **不得**含 S2 路径 | `examples/compliance_bench/S4_sync_domain/` | _待 P0 绿_ |
| ~~S5~~ | rejected→draft | D2 | v0.3+ · **条件项** | — | _未纳入 v1_ |

### B.3 运行方式（计划）

```bash
# 待实现 · P0 绿后
./wizard/compliance-bench.sh --all
# 或文档化手工步骤见 examples/compliance_bench/README.md
```

### B.4 结果摘要（数字冻结区）

| 项 | 值 |
| --- | --- |
| **运行日期** | _TBD_ |
| **gate-check 版本 / commit** | _TBD_ |
| **S1–S4 合规率** | _TBD_（**P0 绿后填写**） |
| **失败 scenario** | _TBD_ |
| **与 Part A 对照** | _TBD_（机制一致 / 差异说明） |

### B.5 Part B 待办

- [ ] 创建 `examples/compliance_bench/` 目录与 S1–S4 夹具
- [ ] `wizard/compliance-bench.sh` 或 ACCEPTANCE 级手工步骤
- [ ] P0 绿后首跑 · 填入 §B.4
- [ ] v0.3 后评估是否纳入 S5

---

## 附录 · 引用链

| 文档 | 路径 |
| --- | --- |
| 审核纪要 | [`PROCESS_track_b_evidence_audit_2026-06-15_v1_zh.md`](../reviews/PROCESS_track_b_evidence_audit_2026-06-15_v1_zh.md) |
| P0 金样 | [`examples/demo_checkout/`](../../examples/demo_checkout/) |
| STRATEGY B2 | 工作区 `docs/harness/guides/STRATEGY_MASTER_cyning_harness_v1_zh.md` §4.3 |

---

## 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 初版模板 · 双证据同页 · 数字 TBD |
