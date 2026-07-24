---
name: rethink-mechanization-rate-04-next-steps
description: 结论与立项建议 · 缺口到 SPEC/task 的转化路径 + 与状态机/Agent 契约的接口 · 何时读：评审是否立项、起草 SPEC 前
---

# 04 · 结论：从矩阵到立项

> **简介**：基于 01 的框架与 03 的矩阵，给出可执行的立项建议：哪些缺口立刻转 SPEC、以什么节奏、与方向二（状态机）/方向三（Agent 契约）如何衔接。**本文不产生任何闸的变更**；立项须走正式链（10-spec → 人签 → 00 起草 task → HG 闸）。

## 1. 建议立项序列

### 第一波 · `task lint`（G1 + G3）· 建议 v2.3.0

**一句话**：给 task md 一个结构闸——下游所有帽的输入假设从此可机械验证。

- 必填节检查：Harness 元信息（含 task_slug）、`> **状态**` 行、`## 验收标准`、`failure_paths`、`### 自检结论`、（阶段 C）R0–R5 槽 + 思考轮控制表字段
- 文本规则包（G3）：禁绝对本机路径（`/Users/`、`/home/`、`C:\`）；invoke 文件禁预写 `HG-AUDIT-R1 approved` 字面句
- 解析层与 `task-close.js` 共享（`extractSection`/`extractTaskSlug` 已在 task-meta.js）
- 挂点：10 产出时自查 + `verify` 聚合（30 前）
- 验收要点：形式宽容（slug 规范化同款）+ `--allow-*` 泄压 + 不误伤存量（只 lint 指定文件）

### 第二波 · reviews 留档闸（G2）· 建议 v2.3.0 同波或 v2.3.1

**一句话**：22 帽目前是「全帽零机械」——invoke 失守的同构问题，趁模式还热补掉。

- `verify` 增检查：`docs/harness/reviews/task_<slug>_audit_R1_*.md` 存在（`findReviewPath` 已存在于 task-meta.js，零新解析成本）→ 不满足则 `may_start_30: false`
- `close` 可选增第 6 项检查（归档时 R1 审查文应仍在）
- 注意与现有流程的兼容：`findReviewPath` 已被 `verify --json` 消费（handoff.review_path），本次是把它从「信息」升级为「闸」

### 第三波 · 思考轮结构检查（G4）· ✅ v2.6.0

- 并入 `task lint` 但作为独立规则组；宽容度设计需 dogfood 一轮（工作区 task 的槽位写法变体多）
- 只查结构（槽位存在、控制表字段），**不查**内容质量——质量判定永远留在 22 帽

### 暂缓（写好立项理由，别顺手做）

| 缺口 | 暂缓理由 | 归属 |
|---|---|---|
| G7 执行证据 | 本质是 runner 见证（`harness run -- <cmd>`），需要方向二状态机的「执行」概念先行 | 方向二落地时 |
| G6 git 行为层 | 本质是行为约束（hook/平台集成），grep 降维做会误报成灾 | 方向三 Agent 契约 |

## 2. 与方向二（状态机）的接口

第一波/第二波**不依赖**状态机先行——它们是现有命令的自然扩展（lint/verify/close）。但有一个前置动作建议同波做：

- **`lifecycle.yaml` 最小版**：只声明状态与转移清单（draft→R1→approved→30→40→done→archived），不实现引擎；让每个新闸在文件里登记自己守卫的转移。这是方向二的「文档先行」形态，成本一行 YAML，收益是后续所有闸的挂点不再靠临场设计。

## 3. 与方向三（Agent 契约）的接口

- 第一波起，所有新命令/新检查的 `--json` 输出**直接按统一契约设计**（`{ok, blockers[], warnings[], gates?, next_action?}`），不等方向三立项再返工；
- `CLOSE:`/`VERIFY:` 末行协议保留（人读 + grep 双通道），JSON 走 `--json`。

## 4. 机械化率矩阵的资产化

- 把 03 的矩阵落成 `discipline-coverage.yaml`（语句 id / 出处 / 状态 / 机制 / 缺口 / 备注），随版本维护；
- 每个新闸落地 = 矩阵里一行 ❌→✅——这就是方向一承诺的「改进路线自动生成」的实体；
- 远期可给 `harness audit` 加 `--discipline` 视图直接渲染该 YAML（机制质量审计也挂这里）。

## 5. 不做什么（本轮明确排除）

- 不做工作区 Extended 帽（00/10-spec/20-spec/50/handoff）盘点——方法已验证，需要时照搬 02 格式另开一轮；
- 不做机制**质量**审计（mechanical ≠ effective，如 D5 只探测测试文件存在）——矩阵 YAML 预留 `mechanism_quality` 字段即可；
- 不改任何 `harness/prompts/` 正文——本系列是审计不是修订；纪律措辞问题随各立项 task 顺带修。

## 6. 下一棒

若维护者认可本结论：

1. 对**第一波（task lint · G1+G3）**走 10-spec：复制 `SPEC_TEMPLATE_v1_zh.md` → `docs/spec/SPEC-task-lint-structure-gate_v1.md`，R0 直接引用本系列 02/03；
2. 第二波可同 SPEC 或独立 SPEC（建议独立，闸的验收各自可 dogfood）；
3. 本目录归档为思考留档，不随 task 关闭而删除——它是后续「为什么做这个闸」的上下文。
