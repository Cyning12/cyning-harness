# Task · Agent Skills 标准封装（Starter 帽 frontmatter + skills build/check + 分发）

> **状态**：`done` · 30/40 完成 · 自检全绿 · CLOSE 关账中  
> **SPEC**：[`../spec/SPEC-agent-skills-packaging_v1.md`](../spec/SPEC-agent-skills-packaging_v1.md)（signed 2026-08-06）  
> **R1**：[`../harness/reviews/task_cyning_harness_agent_skills_packaging_audit_R1_20260806.md`](../harness/reviews/task_cyning_harness_agent_skills_packaging_audit_R1_20260806.md)  
> **rethink**：[`../rethink/2026-08-skills-upgrade/README.md`](../rethink/2026-08-skills-upgrade/README.md)（01–05 · 30 必读输入）  
> **Open Folder**：`cyning-harness/`  
> **git_branch**：`task/agent-skills-packaging`（30 开工时建 · 本仓工作树有无关脏文件，**commit 仅限本 task 路径**）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `cyning-harness-agent-skills-packaging` |
| **test_strategy** | `required` |
| **test_strategy_note** | `node --test test/skills.test.js` + 全量 `npm test`（含 sync overlay/index 回归） |
| **code_quality_bar** | `strict` |
| **audit_profile** | `full` |
| **invoke_retention_profile** | `full` |
| **required_invoke_hats** | `10,20,30,40` |
| **git_branch** | `task/agent-skills-packaging` |
| **worktree_root** | `cyning-harness/` |
| **graph_change_layer** | `none` |
| **graph_delta** | `none` |
| **graph_delta_note** | 纯过程轨（Skills 封装）· 无图谱变更 |
| **wiki_delta** | `n/a` |
| **wiki_delta_note** | 无新增可复用教训（rethink 2026-08-skills-upgrade 系列已承担知识沉淀） |
| **experience_capture** | `recommended` |
| **kpi_aggregator** | `CLOSE` |
| **suggested_npm** | **2.23.0**（发版另批） |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | approved | 22-R1, 30 | 2026-08-06 开立（维护者「同意，立项」） |
| HG-SPEC-SIGNOFF | approved | 30 | 2026-08-06 · SPEC signed |
| HG-AUDIT-R1 | **approved** | 30 | R1 通过（零阻塞 · 建议 F1–F3）· 维护者「签收」2026-08-06 |

---

## 背景与目标

rethink 2026-08-skills-upgrade 系列结论 GO（05）：Starter 6 帽条文头部加 frontmatter（单源元数据），新增 `harness skills build|check` 生成/校验标准 `skills/` 目录并入库分发；执行帽（30/40）由构建默认值机械隔离在分发之外，直到 T1 评测通过。

---

## 范围

- [x] SPEC signed（HG-SPEC-SIGNOFF approved）
- [x] R1 · HG-AUDIT-R1 approved（建议 F1–F3 已吸收进 30 落法）
- [x] **D1** · 6 条文头部 frontmatter（`harness/prompts/`：10-task / 10-spec / 20-task-audit / 20-spec-audit / 30 / 40）；正文一字不改
- [x] **D2** · `lib/skills.js` + `harness skills build [--with-execute-hats]` / `harness skills check`
- [x] **D3** · `skills/` 生成物入库（默认 4 帽）· `package.json` `files[]` + `"skills/"` · `skills/README.md`（生成 · 含消费指引与执行帽缺席标注）· `harness/prompts/README.md` 加封装说明段
- [x] **D4** · `test/skills.test.js`（生成确定性 / 链接重写 / drift 可失败 / 默认集隔离 / frontmatter 正反例）进 `npm test`（本仓真闸）· 新增 `ci/samples/skills-validate.yml.example`（`skills check` + `skills-ref validate` · 锁版本 · R1-F1 落点修正）· sync overlay/index 回归全绿
- [x] **D5** · `eval/t1_gate_bypass/`：S1–S3 fixture + 判据文档（本波不执行评测）
- [x] **D6** · dogfood D1：工作区 `Projects/.claude/skills/` 装 10-task / 10-spec（自本包 `skills/` 复制）· 观察数据回写 rethink README · CHANGELOG 2.23.0 条目
- [ ] 40 自检闭环 + CLOSE

## 非范围

- 30/40 进默认 `skills/` 分发（T1 评测通过前的未来 task）
- sync/upgrade 推 `skills/` 到业务仓；业务仓（Ink 子仓）任何变更
- Extended 帽（00/50/handoff）与工作区级 `.claude/skills/` 体系建设；`.claude/agents/` 不动
- MCP / rethink 方向 D
- 6 条文正文语义变更（frontmatter 纯增量）；prompts README 仅加一段
- 代签 human_gate

## 必读

- SPEC：`docs/spec/SPEC-agent-skills-packaging_v1.md`（R2 决策表为裁定真值）
- rethink：`docs/rethink/2026-08-skills-upgrade/03_format_design.md`（格式与四决策）· `04_dogfood_evaluation.md`（T1 判据 · 负向触发措辞基线）· `05_conclusion_proposal.md`（范围/非范围）
- 规范：https://agentskills.io/specification（frontmatter 字段约束）
- 体例：`lib/cli.js` usage · `lib/lifecycle.js`（只读命令哲学）· `test/discipline-coverage.test.js`（资产+测试模式）
- 现有条文：`harness/prompts/*.md`（frontmatter 只加头 · 正文不动）

## 验收标准

- [x] 6 条文 frontmatter 齐备过 `skills check` 规范约束；正文无 diff（git 可证 · D1 commit 仅头部增量）
- [x] `harness skills build` 默认出 4 帽；`--with-execute-hats` 出 6 帽
- [x] `skills/` 入库 + `files[]` 含 `"skills/"` + `skills/README.md` 含执行帽缺席标注
- [x] 改任一条文正文 → `skills check` 必 fail（drift 判据 · 测试内模拟）
- [x] `npm test` 含 skills 测试且全绿；`ci/samples/skills-validate.yml.example` 存在（R1-F1：本仓无 .github/workflows · 真闸 = npm test）
- [x] `npm test` 全绿 266/266（含 sync overlay / index / hat-v2-split 回归）
- [x] `eval/t1_gate_bypass/` fixture + 判据落盘
- [x] dogfood D1 观察数据回写 rethink README；CHANGELOG 2.23.0 条目
- [x] **无** sync 目标变更；**无** `.claude/agents/` 变更；**无** 30/40 进默认 `skills/`

## failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 条文改正文未重跑 build | `skills check` exit≠0 指出 drift 文件 | 重跑 build |
| frontmatter 非法 | `skills check` fail · 字段级报错 | 修 frontmatter |
| frontmatter 破坏 sync overlay | 既有 sync 测试 fail 挡合入 | 修兼容；修不动 → 回退 sidecar 元数据方案（SPEC R3） |
| 误把 30/40 生成进默认集 | D4 断言拦截 · 验收失败 | 去 flag 重跑 |
| dogfood D1 零触发 | 非阻塞 · 迭代 description 再观察 | 改 description |
| 工作树无关脏文件混入 commit | 违纪（Git 纪律：仅本 task 路径） | 拆分 recommit |

---

## 思考轮（10-task 回填 · R0–R5）

### R0 · 读入与约束

SPEC signed 全文（R2 裁定为真值）· rethink 03/04/05 · task lint 必填节（E1–E7 + 思考轮 G4）。约束：HG-AUDIT-R1 pending 前 30 拒开工；本仓脏树存在无关改动 → commit 仅限本 task 路径；`early_stop=no`。

### R1 · 范围 / 非范围 / 场景

场景即 SPEC R1 三场景（跨 client 消费者 / 维护者改条文 / 评测者）。范围 D1–D6 六包与 SPEC §2 一一对应；非范围逐字继承 SPEC §3。单 task 承载（00 裁量：一条生产线，不拆 T1/T2——D 包间是顺序依赖而非并行轨）。

### R2 · 方案对比

SPEC R2 六决策已裁定（frontmatter 嵌头部 / 生成物 / 默认不含 30/40 / 复制 references / 手工装 / eval 半自动）。task 层新增实现决策点：

| 决策点 | 选项 | 裁定 | 理由 |
|--------|------|------|------|
| 生成器语言 | 新依赖（yaml 解析器）/ **复用 js-yaml（既有 dependency）** | **js-yaml** | 包已有 `js-yaml@^4.1.0`；零新依赖 |
| build 输出策略 | 增量 / **全量重写 skills/** | **全量重写** | 生成物无手写部分，全量重写最简单且无残留；drift 检测=regen 比对 |
| CI 接入点 | 新 workflow / **挂既有 CI**（`ci/`） | **既有 CI 加两步** | 最小侵入；`skills-ref` 锁版本安装 |
| dogfood 装法 | npm link / **直接复制 skills/ 到工作区** | **复制** | 一次性探针；不进 sync 不建管道 |

### R3 · 边界 / 失败语义 / 安全

- 30 开工前置：`verify --task` PASS 含本 task 结构（E1–E7）+ HG-AUDIT-R1 approved
- 只写本仓：lib/test/eval/docs/skills/package.json/CHANGELOG/CI 配置；**禁碰**业务仓、`.claude/`、sync 目标逻辑
- 脏树纪律：本仓现有无关 modified/untracked 文件（ARCHITECTURE 等）**不属于**本 task，commit 逐路径 add
- 回退预案：sync overlay 兼容修不动 → sidecar 元数据（SPEC R3 已备案）

### R4 · 验收 / 可测性 / test_strategy

`required`：先可失败测试（test/skills.test.js 先行：生成器不存在 → 红）再实现。每条验收可命令判定。dogfood D1 数据形式：rethink README 过程记录追加行（触发观察 ≥1 次或明确记录零触发）。

### R5 · 可交 20-task-audit

task 自足：范围/非范围/验收/failure_paths/必读齐；思考轮控制已填；闸表三行状态正确（HG-AUDIT-R1 pending）。**下一棒：20-task-audit R1 书面审 → HG-AUDIT-R1（人签）→ 30**。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① CI 中 `skills-ref` 安装方式（npx 拉取 vs devDependency）需 30 实测，锁版本；② `skills/README.md` 为生成物则其内容模板需随生成器维护（防手改进生成物）；③ 工作区 dogfood 复制后与本包后续迭代的同步靠人工，D1 阶段可接受 |
| `round_extension_note` | — |

---

### 自检结论（执行者）

**40 自检闭环 · 2026-08-06 · 全部真跑**：

| 验证命令 | 退出码 | 关键输出 |
|----------|--------|----------|
| `npm test` | 0 | **266 pass / 0 fail**（含 skills.test.js 11 例 · sync overlay/index/hat-v2-split 回归绿） |
| `node bin/harness.js skills check` | 0 | `SKILLS CHECK: PASS · frontmatter 合法 · skills/ 无 drift` |
| `node bin/harness.js skills build` → 再 `check` | 0 | 再生确定性：build 后 check 仍 PASS（6 文件） |
| `node bin/harness.js verify --task <本 task>` | 0 | `VERIFY: PASS`（30/40 invoke 于本轮回补） |

验收标准逐条：frontmatter 齐备且正文无 diff（D1 commit `3da63fa` 仅头部增量）✅ · 默认 4 帽 / flag 6 帽 ✅ · `skills/` 入库 + files[] + 生成 README 标注 ✅ · drift 必 fail（测试内模拟 + 断言文件名）✅ · npm test 含 skills 测试 + ci 样例存在 ✅ · eval fixture 落盘 ✅ · dogfood 装机 + rethink 回写 + CHANGELOG 2.23.0 ✅ · 无 sync/agents 变更、默认集无 30/40 ✅

**结论：pass**（CLOSE 待人指令）

### KPI（00）

Task_KPI%: 93

| 维 | 分 |
| --- | --- |
| 质量 | 5 |
| 过程 | 5 |
| 纪律 | 4 |

### 经验总结

- 「闸编码进构建默认值」（30/40 须显式 flag 才生成）比「文档标注 experimental」硬一档——机械隔离优于呼吁
- 生成物 + drift 闸（`skills check`）让「单源真值」可 CI 强制，免人工巡检
- 脏树纪律须防 `git add <file>` 扫荡他人 WIP：同文件混合改动时用「HEAD 基底 + 本 task 段落」暂存手术（本 task D3 曾误扫后 reset 重做）
- 资源引用正则须词界（`TASK_TEMPLATE_` 子串误配教训）

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-06 | 00 起草（SPEC signed 后）+ 10-task R0–R5 同会话回填（SPEC→task 同会话 · task 草稿已由 00 创建）· HG-AUDIT-R1 pending |
| 2026-08-06 | 20-task-audit R1 通过（零阻塞 · F1–F3 建议）· 维护者「签收」→ HG-AUDIT-R1 approved |
| 2026-08-06 | 30/40 完成 · 自检全绿（266 tests · skills check PASS）· **CLOSE: PASS** → 归档 done/ |
