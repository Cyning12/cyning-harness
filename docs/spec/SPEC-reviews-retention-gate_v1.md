# SPEC：reviews 留档闸（verify + close 的 R&lt;n&gt; 审查文存在性检查）（v1）

> **状态**：`done`（10-spec R0–R5 已回填 · **维护者已签收 2026-07-24** · → 00 起草 task）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **上游思考**：[`docs/rethink/2026-07-mechanization-rate/`](../rethink/2026-07-mechanization-rate/)（缺口 G2 · P0 最后一块）  
> **下游**：SPEC 签收 → 00 起草 task → 10-task

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `reviews-retention-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | verify/close 双挂点的 block/pass/豁免路径均可 fixture 驱动 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-reviews-retention-gate/invoke_20260724_10_spec_reviews_retention_gate.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

机械化率审计（rethink 02 C1–C4）：**20-task-audit（原 22）全帽零机械**——「必须落盘 `reviews/task_<slug>_audit_R<n>_<date>.md`」是纯 Prompt 纪律，与 invoke 失守同构。`FRAGMENT_30_gate_verify` 闸扫描表里本有一行「reviews：`task_*_audit_R1_*.md` 存在且 R1 通过？」，但它是**手工填表项**，无任何代码消费。

**关键事实**：`HG-AUDIT-R1` 是 30 的硬闸且由人签，但**签署依据（R1 审查文）的存在性本身没有闸**——人可以对着一份不存在的审查文签 approved，机械层面无法发现。

**目标**：把「R&lt;n&gt; 审查文存在」从填表项升级为机械闸，双挂点：

1. **verify（30 前）**：`may_start_30` 增加前置条件——`docs/harness/reviews/task_<base>_audit_R<n>_*.md`（n≥1）至少一份存在；
2. **close（归档前）**：新增第 6 项检查——归档时 R&lt;n&gt; 审查文应存在（纸链完整性）。

**职责切分（核心设计）**：机器只查**存在性**（形式）；审查**结论是否通过**由维护者签 `HG-AUDIT-R1` 覆盖（实质）。闸不做内容判定。

## 2. 范围

- **D1 · verify 挂点（`lib/verify.js` + `lib/task-meta.js`）**：
  - `findReviewPath` 扩展：glob 从 `_audit_R1_` 放宽为 `_audit_R`（取最新轮），返回 `{found, latest, rounds[]}`
  - `verifyTarget`：taskFile 模式下审查文缺失 → `VERIFY: BLOCKED · missing R<n> review` · exit 2
  - 豁免：`--allow-no-review`（warn 放行 · 留痕）；handoff JSON 增加 `review_found` / `review_latest`（`review_path` 保留兼容）
- **D2 · close 挂点（`lib/task-close.js`）**：新增检查 6——R&lt;n&gt; 审查文存在；缺失 → `CLOSE: BLOCKED`；同一 `--allow-no-review` 豁免（warn）
- **D3 · 测试**：verify 三态（存在 pass / 缺失 block / 豁免 warn）+ close 检查 6 三态；`npm test` 全绿（含既有回归）
- **D4 · dogfood**：工作区 active tasks 跑 verify 报告「approved 但无审查文」分布（只报告）
- **D5 · 文档**：`FRAGMENT_30_gate_verify_v1_zh.md` 该行标注「v2.5+ verify 机械强制存在性」；CHANGELOG + 版本 **v2.5.0**

## 3. 非范围

- 审查文**内容**判定（pass/fail 结论、核对项质量）——永远人/20 帽职责
- SPEC 审查文（20-spec-audit · HG-SPEC-SIGNOFF）留档闸——下一轮
- `task lint-done` 的 reviews 集合 diff（done↔reviews）——有需求再议
- 存量 done 任务的 reviews 补录；R 轮次与 task 回填一致性的交叉校验

---

## 4. 验收标准

- [ ] verify：task 有 `reviews/task_<base>_audit_R<n>_*.md`（n≥1）→ 行为不变；**缺失 → `VERIFY: BLOCKED · missing R<n> review`** exit 2（即使闸表全 approved）
- [ ] verify：`--allow-no-review` → warn + 放行；`--json` handoff 含 `review_found` / `review_latest`
- [ ] verify：多轮审查文（R1+R2）取最新轮为 `review_latest`
- [ ] close：检查 6 缺失审查文 → exit 2 不 mv；`--allow-no-review` warn 放行
- [ ] `npm test` 全绿（新增用例覆盖上述三态 · 既有 111 例回归）
- [ ] dogfood：工作区 active tasks「approved 无审查文」分布落自检结论
- [ ] FRAGMENT_30 + CHANGELOG（v2.5.0 · 行为变更醒目说明 + 豁免指引）

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 30 前审查文缺失 | `VERIFY: BLOCKED · missing R<n> review` · exit 2 | 20 补审落盘后重跑；或维护者授意 `--allow-no-review` |
| 归档时审查文缺失 | `CLOSE: BLOCKED` · 不 mv | 补审 / 豁免后重跑 |
| 存量 approved 无审查文任务被挡 | 属**预期拦截**（闸的目的）；豁免阀 `--allow-no-review` 留痕放行 | 同上 |
| 审查文命名不规范（无 `_audit_R` 段） | 视为缺失（形式宽容止于轮次段，文件名主体必须匹配 task basename） | 重命名后重跑 |
| 业务仓未升级 2.5.0 | 旧 verify 无此检查 · 行为不变 | upgrade |

---

## 6. 依赖与引用

- 复用：`lib/task-meta.js` `findReviewPath`（现 glob `_audit_R1_` · 已服务 verify --json 的 `review_path` 信息位）
- 挂点：`lib/verify.js` `verifyTarget`（taskFile 分支 · gate-check 之后）；`lib/task-close.js` 检查表第 6 项
- 纪律原文：`harness/prompts/20-task-audit.md`（必须落盘 reviews）· `harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md`（reviews 填表行）
- 缺口出处：rethink 02（C1–C4）· 03（G2 行）

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：rethink 02/03（G2=P0 队列最后一块）；`findReviewPath` 现实现（只 glob R1 · 只作信息位）；FRAGMENT_30 的 reviews 填表行（纪律原文）；v2.3 教训（lint 不接入 verify = 不误伤存量）。约束：verify 新增 blocking 条件是**行为变更**，豁免阀与 CHANGELOG 醒目说明是硬要求。

### R1 · 范围 / 非范围 / 场景

场景：① 30 前 verify 挡「闸表 approved 但审查文不存在」（主）；② 归档时 close 保证纸链完整；③ 存量任务被挡时维护者有豁免阀。**职责切分**是本 SPEC 最重要的边界：机器查存在性（形式），人签覆盖结论（实质）——不做审查文内容判定，那是 20 帽与维护者的职责，机械判定会重蹈 slug 式误报。双挂点同波做：机制共享（同一个 finder），分开做反而要两次发版说明。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|---|---|---|---|
| 严格度 | block / warn 起步 | **block + `--allow-no-review`** | 这是 verify 的语义本职（「30 可开工？」应含签署依据存在）；warn 起步等于又把纪律留在自觉层。豁免阀保灵活 |
| 挂点 | verify only / close only / 双挂点 | **双挂点同波** | finder 共享 · 一份发版说明；close 保证归档纸链（done 任务的未来审计入口） |
| 轮次语义 | 只认 R1 / 最新 R&lt;n&gt; / 要求结论 pass | **存在 ≥1 份 R&lt;n&gt;，信息位报最新轮** | R1 有阻塞 → 回填 → R2 是合法流程；结论 pass 由 HG-AUDIT-R1 人签覆盖，机器不判内容 |
| 与 `--allow-unchecked` 合并豁免阀 | 合并 / 独立 flag | **独立 `--allow-no-review`** | 语义不同（勾选豁免 vs 审查文豁免），合并会模糊审计痕迹 |
| verify 无 --task 全量模式 | 也查 reviews / 只查闸表 | **本波只查闸表（不变）** | 全量模式的存量面太大（dogfood 前先探）；taskFile 模式是 30 开工的正式路径 |

### R3 · 边界 / 失败语义 / 安全

- **存量误伤面**：受影响 = 「HG-AUDIT-R1 approved 且无 R&lt;n&gt; 审查文」的在途 task。工作区近三波 task 全有 R1 文（实测）；业务仓手工快照可能有缺口 → 豁免阀 + dogfood 报告（D4）先行量化。
- **文件名形式宽容边界**：宽容到「轮次数字任意」，不宽容到「文件名主体必须 = task basename」——否则张冠李戴的审查文也能过闸，闸就失去意义。
- **兼容**：`review_path` 字段保留（handoff 既有消费者）；新增字段不删旧字段。
- **安全**：verify/close 均为只读检查（close 的 mv 语义不变）；无 git 动作。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。fixture：verify 三态 + 多轮取最新 + close 检查 6 三态；复用 verify.test.js / task-close.test.js 的 mkdtemp 模式。dogfood 命令与分布落自检结论（同 v2.3 模式）。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：双挂点行为、豁免阀、职责切分、存量缓解均有明确规则。**可交 00 起草 task**。图谱：纯工具链无需 bootstrap。版本 v2.5.0（行为变更但属闸语义本职 · CHANGELOG 醒目 + 豁免指引）。落地后 rethink 矩阵 ❌ 8 → 6（C1/C2 族 ✅），22/20 帽脱离「全帽零机械」。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 存量仓 verify 行为变更可能挡在途 task（豁免阀 + CHANGELOG 醒目 + dogfood 量化缓解）；② 「审查文命名不规范视为缺失」可能对历史命名变体过严（宽容边界已声明 · 误报可重命名或豁免）；③ verify 无 --task 全量模式本波不查 reviews，遗留到 dogfood 后决策 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-24 | 10-spec R0–R5 同会话回填（维护者委派「开始」）· 基于 rethink G2 + findReviewPath 资产核查 |
| 2026-07-24 | **维护者签收** · 进入 00 起草 task |
