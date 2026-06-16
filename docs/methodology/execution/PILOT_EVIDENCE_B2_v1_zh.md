# 试点证据 · B2 量化 + SDD-Compliance micro-bench（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `frozen` · **数字已冻结** · 2026-06-16 |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **task** | 工作区 [`task_cyning_harness_b8_b2_compliance_bench_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_b8_b2_compliance_bench_v1.md) |
| **审核** | [`REVIEW_B3` §10](../reviews/REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md#10-审核记录2026-06-15) · APPROVE_WITH_CHANGES |
| **ROADMAP** | v0.4→v1.0 闸门 · [`ROADMAP_v1_zh.md`](../ROADMAP_v1_zh.md) §5 |

> **读者说明**：本文档为 **双证据** 同页真值。**Part A** = 真实试点 retro（小样本 · 机制叙事）；**Part B** = 可复现 SDD-Compliance bench（不测 LLM 解题）。  
> **禁止**在未冻结前将下表数字复制进 README / 公众稿（续篇篇 1 §8）。  
> **执行委派**：工作区 Epic §00 · 下一档 A1 — [`PROMPT_START_a1_npx_v1.md`](../../../../docs/harness/invokes/by-task/cyning-harness-a1-npx/PROMPT_START_a1_npx_v1.md)

---

## 0. 证据策略（一句话）

**测敢不敢合，不测会不会做题。** 与 Terminal-Bench / SWE-bench **互补、不对标**。

---

## Part A · B2 真实试点量化

### A.1 样本说明

| 字段 | 值 |
| --- | --- |
| **preset** | `kimi-code-meta`（repo 嵌入 · 主路径） |
| **样本窗口** | 2026-06-10 → 2026-06-15 |
| **`sample_n`** | **6**（见 A.3 列表） |
| **task 类型** | harness-only dogfood ×1 · 文档修复 ×1 · agent-core 改码 ×3 · 起草/进行中 ×1 |
| **是否与 #4 共用** | 是 · 与 [`task_cyning_harness_b_kimi_dogfood_v1.md`](../../../../docs/harness/tasks/done/cyning-harness/task_cyning_harness_b_kimi_dogfood_close_v1.md) 对齐 dogfood 样本 |
| **retro 方法** | invoke 日志 · gate-check 拦截记录 · CI 首次绿 · D6 PR diff 人工核对 |

### A.2 指标表（PilotEvidence）

> **数字状态**：frozen · 2026-06-16 冻结 · §1 策略 A（待采集字段标 N/A）· 可引用进 README/ASSESSMENT。

| 字段 | 定义 | 值 | 备注 |
| --- | --- | --- | --- |
| `audit_reject_rate` | 22 轮次中「内容阻塞 / 打回」比例 | **N/A** | §1 策略 A：样本期未系统采集 22 R1 内容阻塞；不编造 |
| `audit_rounds_mean` | R1→R2… 平均轮次 | **N/A** | §1 策略 A：同 audit_reject_rate · 未系统采集 |
| `ci_first_green_rate` | 含改码 task 的 **首次** CI 绿比例 | **3/3 = 100%** | 改码 task：#565 docs · #583 agent-core · #94 agent-core · invoke 30 验证命令均通过；样本极小 |
| `gate_block_count` | 30 前 gate-check **拦截**次数（累计） | **3+** | P0 金样签前 exit 2 · #94 签前验证 exit 2 · dogfood gate-check exit 2（#705 pending）；不含日常开发中可能的未记录拦截 |
| `wizard_adoption_days` | install/adopt → 首个 task CLOSE 人天 | **N/A** | §1 策略 A：install 日期未落盘；无法准确计算 |
| **`upstream_pr_d6_clean`** | D6 双分支 **零过程轨泄漏** PR 数 / 率 | **3/3 = 100%** | #622 · #630 · #708 的 upstream diff 均 **未含** `docs/harness/` / `docs/tasks/` / harness meta 文件；#580 PR 未开 |
| `failure_report_count` | 30 失败路径 / FailureReport 次数 | **1** | #94 30 越闸事件（HG-AUDIT-R1 pending 改码）· 已记录 SOLUTION 并修复 GATE_VERIFY 协议 |
| `sample_n` | 纳入统计的 task 数 | **6** | 见 A.3 · 禁止外推胜率 |

### A.3 机制证据（叙事用 · 非胜率）

| 项 | 说明 | 状态 |
| --- | --- | --- |
| 纳入 `sample_n` 的 task slug | `cyning-harness-b-kimi-dogfood` · `fix-docs-node-565` · `fix-telemetry-bash-cancel-583` · `fix-skill-frontmatter-580` · `fix-read-dual-limit-94` · `fix-open-tool-calls-705`（进行中） | ✅ 已列出 |
| 上游 PR 链 | Kimi fork → Moonshot upstream · 过程轨隔离 | ✅ #622/#630/#708 零泄漏 |
| gate 拦截样例 | P0 金样 pending R1 拒 30 · #94 签前验证拒 30 · dogfood pending #705 拒 30 | ✅ 3 个场景已记录 |
| 与 bench 关系 | Part B 覆盖 **可机械复现** 子集；Part A 覆盖 **真实绑定深度** | 见 Part B |

### A.4 Part A 采集清单（维护者）

- [x] 列出纳入 `sample_n` 的 task slug + 类型
- [x] 从 #4 dogfood 增量填入 fork 数据
- [x] 核对 D6 PR：过程轨文件未进入 upstream diff（#622/#630/#708）
- [x] **冻结**：按 §1 策略 A 将未采集字段标 N/A · 可写入 README/ASSESSMENT
- [ ] 后续维护周期可补采 22 R1 内容阻塞 / 轮次（不影响冻结值）

---

## Part B · SDD-Compliance micro-bench

> **依赖**：P0 金样 ACCEPTANCE 全绿 · gate-check 行为与 P0 金样 D2/D3 一致 · **已冻结**。  
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
| **S1** | R1 pending 即 30 | D2 | gate-check exit≠0 · 30 应拒 | `examples/compliance_bench/S1_r1_pending/` | **PASS** · exit 2 |
| **S2** | R1 approved · 无 review | D2/D3 | bench 判非合规（缺 `*_audit_R1_*`） | `examples/compliance_bench/S2_r1_no_review/` | **PASS** · 缺 review → 非合规 |
| **S3** | R1 approved + review 落盘 | D2/D3 | gate-check exit=0 · review 存在 | `examples/compliance_bench/S3_r1_with_review/` | **PASS** · exit 0 |
| **S4** | sync 域 vs S2 | S2 | apply **不得**含 S2 路径 | `examples/compliance_bench/S4_sync_domain/` | **PASS** · plan 无 task/reviews 路径 |
| ~~S5~~ | rejected→draft | D2 | v0.3+ · **条件项** | — | _未纳入 v1_ |

### B.3 运行方式

```bash
cd /path/to/cyning-harness
./wizard/compliance-bench.sh --all
# 仅输出合规率 %
./wizard/compliance-bench.sh --quiet --all
```

手工步骤见 `examples/compliance_bench/README.md`。

### B.4 结果摘要（数字冻结区）

| 项 | 值 |
| --- | --- |
| **运行日期** | 2026-06-16 |
| **gate-check 版本 / commit** | `wizard/gate-check.sh` · 工作区 `main` |
| **S1–S4 合规率** | **4/4 = 100%**（基于当前 fixtures · P0 绿后首跑） |
| **失败 scenario** | 无 |
| **与 Part A 对照** | S1/S3 与 #94 签前/签后验证、P0 金样 gate-check 行为一致；S4 与 `harness-sync.sh` 不覆盖 task/reviews 的实现一致 |

### B.5 Part B 待办

- [x] 创建 `examples/compliance_bench/` 目录与 S1–S4 夹具
- [x] `wizard/compliance-bench.sh` 或 ACCEPTANCE 级手工步骤
- [x] P0 绿后首跑 · 填入 §B.4 · **已冻结 4/4=100%**
- [ ] v0.3 后评估是否纳入 S5
- [x] 冻结后可写入 README/公众稿（须由 A4 D4 执行）

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
| v1.0 | 2026-06-16 | 回填 Part A 最小集 + Part B 首跑 4/4=100% · 数字仍 draft |
| v1.0 | 2026-06-15 | 初版模板 · 双证据同页 · 数字 TBD |
