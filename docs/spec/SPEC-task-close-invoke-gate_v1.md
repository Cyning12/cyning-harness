# SPEC：task close 命令 + invoke 留档机械闸（v1）

> **状态**：`done`（10-spec R0–R5 已回填 · 2026-07-22 · 待维护者签收 → 00 起草 task）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链 · 不触业务模块）  
> **下游**：SPEC 签收 → 00 起草/重起草 task → 10-task  
> **关联 task**：`Projects/docs/harness/tasks/active/task_cyning_harness_task_close_invoke_gate_v1.md`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `task-close-invoke-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | close/lint-done 均为机械闸逻辑，fail 路径必须可失败测试驱动 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-task-close-invoke-gate/invoke_20260722_10_spec_task_close_invoke_gate.md` |
| **entry_invoke_00_draft** | 工作区 `docs/harness/prompts/PROMPT_00_draft_spec_or_task_v1_zh.md` |

---

## 1. 背景与目标

**现象**：invoke 留档是 Harness 明文纪律（`harness/prompts/30-execute-code.md`「invoke 快照落盘 `docs/harness/invokes/by-task/<task_slug>/`」），但 ops-desk-api 连续 4 个任务（llm-provider-v1 / auth-session-db-cookie / admin-github-sync / chat-websocket-v1）30 执行全部漏落（2026-07-20 根因分析）。

**根因（已源码核实）**：该纪律唯一出处是 Prompt 自然语言文本，零代码消费；`wizard/gate-check.sh` / `lib/verify.js` / `lib/audit.js` / `lib/task.js` 均不读 `invokes/by-task/`；且 `verify` 是 30 **开工前**的闸，invoke 是 30 **收尾**产物，检查点在时间线上错位 —— 正确挂点是「任务归档（active→done）」时刻，但 CLI 没有 close/done 命令，归档是手动 `mv`，工具链零感知。

**目标**：把「归档」从手动 `mv` 收编为受闸动作（`harness task close`，方案 A 主），并以 CI 集合 diff 兜底存量与漏网（方案 C）。漏落从「Agent 自觉」变为「机械可 fail」。

---

## 2. 范围

- **D1 · `lib/task-close.js`（新增）**：5 项机械校验（见 §4 验收对照）+ 归档执行（`mv`）；结构化结果（ok / blockers[]）。
- **D2 · CLI 路由（`lib/cli.js`）**：`task close --file PATH [--target PATH] [--yes] [--allow-unchecked]`；`CLOSE: PASS/BLOCKED` 末行协议；help 同步。
- **D3 · 方案 C（`lib/task-lint-done.js` + CLI `task lint-done`）**：done 任务 slug 集合 vs `invokes/by-task/` 目录名集合 diff；done 有而 invokes 无 → exit 2；反向仅 warn。
- **D4 · 文档同步**：`harness/prompts/30-execute-code.md` 交接物改为 close PASS 后方可归档；`harness/invokes/TEMPLATE_invoke.md` 补纪律行；`CHANGELOG.md` + 版本 **v2.2.0**（minor · 新增子命令）。
- **D5 · 试点**：正例（全链路 CLOSE: PASS）+ 反例（删 invoke → CLOSE: BLOCKED 且未 mv），两例 invoke 落盘。

## 3. 非范围

- 历史 done 任务的 invoke 补录（ops-desk-api 已于 2026-07-20 人工补录 4 份）。
- 50 独立复检帽的机械闸；reviews/ 留档机械校验（后续可同模式扩展）。
- 自动 git commit / push / PR 创建。
- **归档自动重命名**（各仓惯例不一，见 R2 弃选项）；由 `--target` 显式覆盖。
- 工作区 `_views/` 更新（编排仓特有，工具链不管）。

---

## 4. 验收标准

- [ ] `task close` 在以下情形分别 exit 2 + `CLOSE: BLOCKED · <原因>` 且**不执行** mv：
  - [ ] invoke 目录缺失/为空（无 `.md`）
  - [ ] `### 自检结论` 节缺失/为空/纯占位符
  - [ ] `## 验收标准` 节存在未勾选 `- [ ]`（且无 `--allow-unchecked`）
  - [ ] 文件名 slug ≠ 元信息表 `task_slug`，或 invoke 目录名 ≠ slug
  - [ ] `> **状态**` 行首 token ∉ {`done`, `completed`}
  - [ ] 目标 done 文件已存在（不覆盖）
  - [ ] 源文件不在 `*/active/` 下且未给 `--target`
- [ ] 全部通过 + `--yes`：exit 0 + `CLOSE: PASS · <slug>` + 文件归档至同级 `done/`（basename 保留）
- [ ] 无 `--yes`：dry-run —— 只检不 mv，exit 0 时输出 dry-run 标注
- [ ] `task lint-done` 对 done/invokes 集合不一致 exit 2 并列出缺失 slug；invokes 多出仅 warn
- [ ] `npm test` 全绿（新增用例覆盖每条 fail 路径 + pass 路径）
- [ ] Prompt 库与 TEMPLATE_invoke 已同步新纪律；CHANGELOG 记 v2.2.0
- [ ] 试点仓正反两例 invoke 落盘

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| invoke 目录缺失/为空 | exit 2 · `CLOSE: BLOCKED · missing invoke snapshots` · 不 mv | 补录后重跑 |
| 自检结论未回填/占位符 | exit 2 · 不 mv | 40 回填后重跑 |
| 验收标准存在 `- [ ]` | exit 2（`--allow-unchecked` 时 warn 放行）· 不 mv | 勾选/豁免后重跑 |
| 状态非 done/completed | exit 2 · 列出当前状态 token · 不 mv | 改状态后重跑 |
| 目标 done 文件已存在 | exit 2 · 提示冲突 · 不覆盖 | 人工处理或用 `--target` |
| 源文件不在 `*/active/` 且无 `--target` | exit 2 · 拒绝（防对 done 文件二次 close） | 指定 `--target` |
| 业务仓未升级到新版本 | 旧版 CLI 无此命令 · 行为不变 | `upgrade` |

---

## 6. 依赖与引用

- 复用：`lib/task-meta.js`（`parseHarnessMeta` / `extractSection` 解析 md 元信息表与节）、`lib/paths.js`（`resolveTarget`）。
- 挂点先例：`lib/verify.js`（`VERIFY: PASS/BLOCKED` 末行协议 · exit 2 语义）。
- CLI 路由：`lib/cli.js` `cmdTask`（现仅 `check` 子命令，`close` / `lint-done` 为新增子路由）。
- Prompt 真值：`harness/prompts/30-execute-code.md`（invoke 落盘纪律行）、`harness/invokes/TEMPLATE_invoke.md`。
- 测试模式：`node --test test/*.test.js` + `test/fixtures/`。
- 根因分析原始出处：ops-desk-api 仓 2026-07-20 会话；补录 commit `f7845d9`。

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：既有 task 草稿 v1（2026-07-20，维护者已定 A+C 方向）；根因证据链（本次会话对 `lib/cli.js` / `lib/task.js` / `lib/verify.js` / `lib/task-meta.js` / `wizard/gate-check.sh` 源码核实，草稿证据属实）；30 帽条文 invoke 纪律行；工作区与业务仓目录惯例实测。约束：HG-TASK-DRAFT / HG-AUDIT-R1 均 pending，本阶段只产出 SPEC + task 重起草，不触产品码。

### R1 · 范围 / 非范围 / 场景

角色与场景：① 业务仓 Agent 在 40 后执行 `task close` 归档（主场景）；② CI / pre-merge 跑 `task lint-done` 防漏网（兜底场景）；③ 维护者在编排仓（工作区）归档跨仓 task。**关键事实**：存在两套 task 目录约定 —— 业务仓 `docs/tasks/{active,done}`，工作区编排仓 `docs/harness/tasks/{active,done}`；且 done 命名惯例在实测中不一致（工作区 `task_<slug>_v1.md` 保名归档；ai-ink-brain-api-python `done_<slug>_YYYY-MM-DD.md`，另有 `done/chatbi/` 子目录）。→ close 的默认目标必须**从 `--file` 位置推导**（同级 `done/`、basename 保留），而非硬编码路径或命名。

### R2 · 方案对比

| 方案 | 结论 | 理由 |
|------|------|------|
| A · `task close` 受闸归档 | **推荐（主）** | 挂点正确（归档时刻 invoke 已是既成事实）；把手动 mv 收编为可 fail 动作 |
| B · verify 加 invoke 检查 | 弃 | 时间线错位：verify 在 30 开工前，invoke 在收尾，永远 fail |
| 仅 C · CI diff 兜底 | 弃（降级为兜底） | 事后检测，不能防单任务漏落；但存量/旁路 mv 仍需它 |
| 归档自动重命名（`task_<slug>_<YYYYMMDD>`） | 弃 | 实测各仓惯例不一（保名 / `done_` 前缀+连字符日期），机械重命名会制造不一致；保名 + `--target` 覆盖即可 |
| 方案 C 用 bash（wizard/*.sh） | 弃 | 仓内趋势：逻辑入 `lib/` + `node --test` 可单测；bash 仅薄壳。定为 `lib/task-lint-done.js` + `task lint-done` |
| close 交互确认（无 --yes 时 prompt） | 弃 | Agent 场景多为非 TTY；定为**默认 dry-run（只检不 mv）+ `--yes` 执行**，安全且脚本友好 |

### R3 · 边界 / 失败语义 / 安全

- **状态行解析**（实测 13 个 active task 的状态行）：词表含 `draft / in_progress / active / deferred / done`，个别无反引号（`> **状态**：done（…）`）。规则：取 `> **状态**` 行首个 `[a-z_]+` token（去反引号），close 仅接受 `done` / `completed`（`completed` 兼容早期草稿措辞）；sidecar 不参与（md 为唯一真值，业务仓 task 未必有 sidecar）。
- **自检结论占位符**：节内容剔空后，每行匹配 `^（[^）]*(回填|待填)[^）]*）$` 视为占位；无占位行且有实质内容才通过（覆盖 `（30/40 回填）`、`（30 回填）`、`（待填）` 变体）。
- **验收标准**：`## 验收标准` 节缺失 = fail（task 模板必含）；`- [x]` / `- [X]` 均算已勾选；仅 `- [ ]` 阻塞。
- **slug 提取**（close 与 lint-done 共用）：basename 去 `.md` → 去 `^(task_|done_)` 前缀 → 去 `_v\d+$` → 去 `_(YYYY-MM-DD|YYYYMMDD)$`；lint-done 递归扫描 done/ 一层以上子目录（实测存在 `done/chatbi/`）。
- **安全**：任何校验失败不 mv；目标已存在不覆盖；源文件不在 `*/active/` 且无 `--target` 拒绝执行（防对 done 文件二次 close）；不碰 git。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`。fixture 驱动：`test/task-close.test.js` 覆盖 §4 每条 fail 路径 + pass + dry-run；`test/task-lint-done.test.js` 覆盖三态（缺失 / 多余 warn / 一致）。沿用 `node --test` + `test/fixtures/` 现有模式，无新依赖。验收命令：`npm test` 全绿 + 试点仓正反两例实跑。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：范围/非范围/验收/失败路径均可观测，方案对比与弃选留痕。**可交 00 重起草 task**（维护者已明示「SPEC→task 同会话」，且 task 草稿已由 00 创建，符合 10-spec 分界例外）。图谱：纯 Harness 工具链，无需 bootstrap。试点仓 `Ops-desk/ops-desk-api` 不在当前工作区 → task D5 定为「ops-desk-api 在场时优先，否则 fallback `harness-probe/`（manifest 2.1.1 · harness-only · 具备 docs/tasks + invokes/by-task）」。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 业务仓旧版 CLI 无 close 命令，纪律生效依赖 upgrade（D4 文档提示缓解）；② 状态行/验收节解析依赖既有 task 文本惯例，异形 task 可能误 BLOCKED（以 fixture 覆盖 + `--allow-unchecked` 泄压）；③ ops-desk-api 缺席时试点证据来自 fallback 仓 |
| `round_extension_note` | — |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-22 | 00 骨架 + 10-spec R0–R5 同会话回填（维护者委派）· 基于 task 草稿 v1 根因分析与本仓源码核实 |
