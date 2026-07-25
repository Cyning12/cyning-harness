# SPEC：verify 全量模式纳入 reviews 留档闸（N4）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收」）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **上游**：[`PLAN_post_g4_next_mechanization_v1_zh.md`](../../../docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md) · N4 · G2 residual  
> **前置**：G2 `@cyning/harness@2.5.0`（`--task` 已查 reviews）· N3 `@2.8.0`  
> **下游**：CLOSE ✅ · `@cyning/harness@2.9.0` published · 合入 `main` · tag `v2.9.0`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `verify-full-reviews-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | 全量模式：有文 PASS / 缺文 BLOCKED / `--allow-no-review`；双路径发现；既有 `--task` 回归不变 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-verify-full-reviews-gate/invoke_20260725_10_spec_verify_full_reviews_gate.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

G2（v2.5.0）把「R&lt;n&gt; 审查文存在」挂在 **`verify --task`** 与 `task close`，但 R2 明确：**无 `--task` 全量模式本波只查闸表**。后果：

1. **语义裂缝**：`verify --task X` 会因缺审查文 BLOCKED，但裸 `verify`（全量）在闸表全 approved 时仍可能 **PASS**——「仓库可否 30」答案因是否传 `--task` 而分裂。
2. **发现路径裂缝**：`gate-check` / `listActiveTasks` 只扫 `docs/tasks/active`；工作区 Extended 真值在 `docs/harness/tasks/active`。对 Projects 根跑裸 `verify` →「无 active」vacuous PASS，与人工闸表现实脱节。

**dogfood（2026-07-25 · `findReview` + `evaluateMayStart30`）**：`docs/harness/tasks/active` **15** 个 task：

| 指标 | 值 |
|------|-----|
| `may_start_30=true` | **4** |
| 其中缺 R&lt;n&gt; 审查文 | **3**（`a5_cli_verify` · `hat_chain_pointer_sync` · `task_validate_human_gate_ci_gate`） |
| 有审查文且可 30 | **1**（`ops_clarify_single_run_resume`） |

→ 若仅扩展 reviews 检查而不扩路径，N4 对工作区几乎无效果；若扩路径 + 查 reviews，裸 `verify` 将暴露上述 3 个「闸表可 30 但无审查文」任务（预期拦截 · 可用 `--allow-no-review`）。

**目标**：闭合 G2 residual——全量模式与 `--task` 在 **reviews 存在性** 上同构；并让全量发现覆盖 Starter（`docs/tasks/active`）与 Extended（`docs/harness/tasks/active`）。

**职责切分（同 G2）**：机器 = 存在性；人 = `HG-AUDIT-R1` 结论。

---

## 2. 范围

### D1 · 全量模式 reviews 闸（`lib/verify.js`）

- 当**无** `--task` 且**无** `--spec`：在 gate-check 通过后，对发现的每个 active task 调用 `findReview`：
  - 任一缺失 → `VERIFY: BLOCKED · missing R<n> review`（reason 列出 basename，如 `3/15 tasks · a.md, b.md, …`）· exit 2
  - `--allow-no-review` → 对缺失者 WARN 放行（与 `--task` 同旗）
- **不**在全量模式跑 task lint（维持 N2：仅 `--task`）
- **不**在全量模式跑 audit D5 逐 task（本波不变；另议）

### D2 · active 发现双路径

- `listActiveTasks(target)`：返回  
  `docs/tasks/active/task_*.md` ∪ `docs/harness/tasks/active/task_*.md`  
  （去重：同 basename 优先 Starter 路径；排序稳定）
- `wizard/gate-check.sh`：**同步**双路径扫描（无 `--task` 时），避免闸表集合 ≠ reviews 集合
- 文档：ONBOARDING/USER_GUIDE 注明双路径

### D3 · handoff 对齐

- 全量 `--json`：每个 task 的 `may_start_30` / `verify_ok` **纳入** `review_found`（与单 `--task` 一致）；根级 `verify_ok` = 全部可 30（含审查文）
- `--agent-hint` 可显示缺审查文的 blocked 行

### D4 · lifecycle 登记

- `harness/lifecycle.yaml`：`to_30` 的 `reviews_retention` 注释/描述改为覆盖「`--task` 与全量模式」；不新增转移 id（同守卫 · 两入口）

### D5 · 测试 / 文档 / 版本

- 测试：全量三态（全有文 PASS / 一缺 BLOCKED / allow 豁免）+ 双路径夹具（仅 harness 路径也能被扫到）+ 既有 `--task` 回归
- CHANGELOG **v2.9.0**（⚠ 行为变更：裸 verify 更严）+ 豁免指引
- PLAN / G2 SPEC residual 回链关闭

### D6 · dogfood（实现波）

- 对工作区根或含 `docs/harness/tasks/active` 的 target 跑裸 `verify`，报告 BLOCKED 列表与豁免后结果；落自检结论（可修审查文或 `--allow-no-review`，不强制本波修齐 3 个存量）

---

## 3. 非范围

- 全量模式接入 **task lint**（N2-C / 另 SPEC）
- 全量模式逐 task **audit D5**
- SPEC 侧全量扫描（已有 `verify --spec` 单文件）
- 强制补齐 dogfood 3 个缺审查文的存量 task
- 审查文内容判定；状态机引擎

---

## 4. 验收标准

- [ ] 无 `--task`：active 均有 R&lt;n&gt; 文 → PASS（闸表亦过）
- [ ] 无 `--task`：至少一 task 缺审查文 → BLOCKED exit 2 · reason 含该 basename
- [ ] `--allow-no-review`：全量缺失 → WARN + PASS
- [ ] 仅存在 `docs/harness/tasks/active` 时，gate-check / listActiveTasks 仍能发现 task
- [ ] `--task` 行为与 v2.8 一致（回归）
- [ ] 全量 `--json`：`may_start_30` 含审查文条件
- [ ] `npm test` 全绿；CHANGELOG v2.9.0 行为变更醒目
- [ ] dogfood 分布落自检结论

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 全量扫描发现缺审查文 | BLOCKED · 列出 task | 补 20 审 / `--allow-no-review` |
| 双路径同 basename 重复 | 去重后只检一次 | — |
| 业务仓只有 Starter 路径 | 行为 = 只扫 `docs/tasks/active`（与今同构 + reviews） | — |
| 未升级 2.9.0 | 全量仍不查 reviews | upgrade |
| 存量 3 个可 30 无审查文被挡 | **预期** | 补审或豁免 |

---

## 6. 依赖与引用

- G2：`findReview` · `--allow-no-review` · SPEC residual ③  
- N2：全量不跑 lint（本 SPEC 维持）  
- `listActiveTasks` · `gate-check.sh` ACTIVE_DIR  
- PLAN N4

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：PLAN N4；G2 R2「全量本波不变」+ residual ③；`verify.js` 仅 `taskFile` 分支查 reviews；`listActiveTasks` / gate-check 仅 `docs/tasks/active`；dogfood 15/4/3。约束：行为变更须豁免阀 + CHANGELOG；挂点须与检查物同时刻（审查文应在 R1 后已存在）。

### R1 · 范围 / 非范围 / 场景

**场景**：① 维护者/Agent 裸 `verify` 做仓库健康检查，应与逐 task `--task` 对「可 30」同答案；② Extended 工作区 active 在 harness 路径下也要被扫到；③ 存量缺文用豁免，不强制本波修齐。  
**非范围**：lint/D5 全量化、SPEC 全量、内容判定——避免 N4 膨胀成「verify 大一统」。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| 是否纳入 reviews | 否（关账 N4）/ warn / block | **block + `--allow-no-review`** | 与 G2 `--task` 同构；warn 再留自觉层；dogfood 已能量化误伤面（3 task） |
| 检查哪些 task | 全部 active / 仅 may_start_30 | **全部发现的 active**（与 gate-check 集合对齐） | 闸表未 approved 者 gate-check 已挡；对已过闸者补审查文洞；实现简单 |
| 双路径 | 仅 Starter / Starter∪Extended | **∪ 双路径**（listActiveTasks + gate-check 同步） | 否则 N4 对 Projects dogfood 无效 |
| 全量 lint | 顺带做 / 不做 | **不做** | N2 已拒；FAIL 率仍高 |
| 版本 | 2.8.x / 2.9.0 | **2.9.0** | 裸 verify 行为变更 · minor |

### R3 · 边界 / 失败语义 / 安全

- **误伤**：主要是「闸表可 30 且无审查文」——正是 G2 要抓的类；豁免旗复用。  
- **空 active**：两路径皆无 → 维持现状（gate-check 提示无 active · exit 0）。  
- **安全**：只读。  
- **兼容**：`--task` / `--spec` 不变。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。夹具：双路径目录、全量缺一文、allow 豁免；回归 verify-review-gate / verify-lint-warn。dogfood 命令写进 40 自检。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

自足：裁定、路径、豁免、版本清晰。**可交 00**：单 task `cyning-harness-verify-full-reviews-gate`。图谱无需。关闭 G2 residual ③。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① gate-check 双路径改 bash 须防破既有单测路径假设；② 去重规则若两目录同 slug 不同内容属数据错误——本波只去重不深比较；③ 全量 D5 仍空缺，健康检查仍非「可 30」充分条件 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-25 | 10-spec R0–R5（维护者点菜「继续 N4」）· dogfood 15/4/3 |
| 2026-07-25 | 维护者签收（对话「签收」）· → 00 起草 task |
