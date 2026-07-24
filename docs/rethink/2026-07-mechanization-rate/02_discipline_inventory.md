---
name: rethink-mechanization-rate-02-discipline-inventory
description: 逐文件逐条盘点包内 prompts 规范语句 × 强制状态（mechanical/partial/prompt-only）· 何时读：查某条纪律是否有机械闸
---

# 02 · 规范语句盘点：每条纪律有没有机械闸

> **简介**：对 `harness/prompts/`（npm 分发的 Starter 子集：10/22/30/40 四帽 + 2 FRAGMENT）与 `harness/invokes/TEMPLATE_invoke.md` 的全部规范语句逐条编号、分类。分类标准：**mechanical** = 有代码消费且可 fail；**partial** = 有代码辅助但关键语义靠自觉；**prompt-only** = 零代码消费（纯自然语言纪律）。机制编号见 README（M1–M10）。

## 图例

| 标记 | 含义 |
|---|---|
| ✅ mechanical | 代码强制 · 可 exit≠0 |
| 🟡 partial | 有机制但挡不住核心违规 |
| ❌ prompt-only | 纯 Prompt 层（invoke 失守前的状态） |

---

## A · `30-execute-code.md`（执行帽 · 纪律密度最高）

| # | 规范语句（摘要） | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| A1 | HG pending → 拒开工、禁改码 | ✅ | M1 awk 三闸 + M2 verify exit 2（v2.1.1 已修 backtick 误判） |
| A2 | 开工前首输出 GATE_VERIFY 闸扫描表 | 🟡 | M2 提供机械判定，但「Agent 是否真先输出表再动码」无检查 |
| A3 | 真值在 task 表；声称 approved vs 表 pending → STOP | 🟡 | M1/M2 读表为真值；「用户声称」侧无法机械比对（也不应） |
| A4 | `test_strategy: required` → 先可失败测试再改实现 | 🟡 | M3 D5 只探测测试文件**存在**；「先红后绿」顺序无机制 |
| A5 | 运行验证命令 + 回填 `### 自检结论` | ✅（v2.2+） | M5 检查非占位符；「命令真跑过」内核仍靠 40 诚实（不可机械，见 G7） |
| A6 | invoke 快照落盘 `invokes/by-task/<slug>/` | ✅（v2.2+） | M5（归档闸）+ M6（CI 兜底）—— 本系列起点 |
| A7 | 归档只能 `task close` PASS 后进行 | ✅（v2.2+） | M5；手动 `mv` 旁路无法禁止，M6 兜底发现 |
| A8 | HG-GRAPH-MODULES pending → 禁改码 | ✅ | M1（gate-check --graph） |
| A9 | 缺验收/failure_paths/必读 → 仅输出阻塞清单 | ❌ | **无 task md 结构检查** → 缺口 G1 |
| A10 | 交接物 commit 仅本轮路径、禁 `git add -A` | ❌ | 无 git 行为层机制 → 缺口 G6（行为层，难） |

## B · `40-self-check.md`（自检帽）

| # | 规范语句 | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| B1 | 逐条对照验收标准标记 pass/fail | 🟡 | M5 只查「无未勾选」；勾选真实性靠 40 |
| B2 | 必须运行验证命令并摘要退出码 | ❌（内核） | 「真跑过」无证据要求 → 缺口 G7（执行证据） |
| B3 | 必须回填 `### 自检结论（执行者）` | ✅（v2.2+） | M5 占位符检查 |
| B4 | 禁止改 `docs/tasks/`、`reviews/`、`invokes/by-task/`（S2） | ❌ | S2 无写保护；M5 是唯一合规写者但无法挡其他写者 → 缺口 G6 |
| B5 | 不凭记忆声称「测过」 | ❌ | 不可机械（诚实纪律，设计上留在 Prompt 层） |

## C · `22-task-audit.md`（审核帽）

| # | 规范语句 | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| C1 | 必须落盘 `reviews/task_<slug>_audit_R<n>_<date>.md` | ❌ | **零机制**（v2.2 task 明确列为非范围）→ 缺口 G2 |
| C2 | HG-AUDIT-R1 pending 时禁止附 30 Prompt | ❌ | 审查文内容无检查 → G2 同族 |
| C3 | 思考轮审查不通过 → 退回 10 · 下一棒禁附 30 | ❌ | 流程纪律，prompt-only |
| C4 | 零阻塞写已核对项；终轮写签收/关闭 | ❌ | 审查文结构无 lint |

## D · `10-requirements.md`（需求帽）

| # | 规范语句 | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| D1 | task 必含验收标准 / failure_paths / 非范围 / 依赖 | ❌ | **task md 无 schema**（M4 只验 sidecar JSON，不验 md 正文）→ 缺口 G1 |
| D2 | 不写绝对本机路径 | ❌ | 可机械（grep `/Users/`、`/home/` 等）→ 缺口 G3（易做） |
| D3 | 预置 R0–R5 思考轮槽 + 思考轮控制表 | ❌ | 槽位/控制表结构无检查 → 缺口 G4 |
| D4 | 缺验收/failure_paths → 仅输出阻塞清单 | ❌ | 同 A9 → G1 |

## E · FRAGMENT_30（闸扫描与开工块）

| # | 规范语句 | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| E1 | invoke 中禁止预写 `HG-AUDIT-R1 approved` | ❌ | 可机械（grep invoke 文件字面句）→ 缺口 G3（易做） |
| E2 | 用户「确认 approved」= 须核验非事实 | 🟡 | M2 读表为真值；行为侧同 A3 |

## F · `TEMPLATE_invoke.md` 纪律表

| # | 规范语句 | 状态 | 机制 / 缺口分析 |
|---|---|---|---|
| F1 | 落盘路径 `by-task/<task_slug>/` | ✅（v2.2+） | M5/M6 |
| F2 | 同帽追问不新增 invoke；打回用 `_r2` | ❌ | 命名纪律无检查（成本低收益低，可留 prompt 层） |
| F3 | 落盘 + task 回填后再 commit | ❌ | git 行为层 → G6 |

## G · 机制已覆盖（对照组 · 证明模式有效）

| 规范 | 机制 |
|---|---|
| sidecar JSON schema | M4 `task check` ✅ |
| depends_on 禁环 | M4 `--no-circular` ✅ |
| graph YAML ↔ graph.json 一致 | M7 `graph yaml check` ✅ |
| manifest 版本可升级提示 | `check` / `upgrade` ✅ |
| S5 git-clean | M2/M3 warn（🟡 只警不挡，属刻意设计） |

---

## 缺口汇总（详表见 03）

| 缺口 | 内容 | 来源条目 | 可机械化度 |
|---|---|---|---|
| **G1** | task md 结构 lint（必填节：元信息/状态行/验收/failure_paths/自检结论/思考轮槽） | A9, D1, D4, D3(部分) | 高（解析与 M5 共享） |
| **G2** | reviews 留档存在性 + R 轮次命名 | C1–C4 | 高（glob 即可，挂 close 或 verify） |
| **G3** | 文本纪律 grep 闸（绝对路径、invoke 预写 approved） | D2, E1 | 高（trivial） |
| **G4** | 思考轮槽位/控制表结构检查 | D3 | 中（格式变体多，须宽容） |
| **G6** | git 行为层（仅本轮路径、S2 写保护、Git 仅 Lead） | A10, B4, F3 | 低（需 hook/action 层，属方向三） |
| **G7** | 执行证据（验证命令真跑过的留痕） | B2, A5 内核 | 低-中（需 runner 包装，属方向二/三） |

> 编号说明：G5 预留（首轮盘点未用上，留给复盘中新发现的同族缺口）。
