# SPEC：Agent Skills 标准封装（Starter 帽）（v1）

> **状态**：`signed`（维护者签收 2026-08-06 · 对话「签收」）  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 过程轨 / 分发放大器）  
> **上游**：rethink 系列 [`docs/rethink/2026-08-skills-upgrade/`](../rethink/2026-08-skills-upgrade/README.md)（01 映射 · 02 张力 · 03 格式设计 · 04 评测/dogfood · 05 结论 GO）  
> **下游**：SPEC 签收 → 00 起草 task → 10-task → 20-task-audit → HG-AUDIT-R1 → 30（Open Folder：`cyning-harness/`）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `agent-skills-packaging` |
| **test_strategy** | `required` |
| **test_strategy_note** | — |
| **entry_invoke_10_spec** | `docs/harness/invokes/by-task/cyning-harness-agent-skills-packaging/invoke_20260806_10_spec_agent_skills_packaging.md` |
| **entry_invoke_00_draft** | （00 起草 task 时回填） |
| **拟发版窗口** | **`@cyning/harness@2.23.0`**（minor · 纯增量） |
| **Open Folder（实现）** | `cyning-harness/`（产品仓 · 单仓） |
| **人闸** | **HG-SPEC-SIGNOFF：approved**（2026-08-06 · 维护者对话「签收」） |

---

## 1. 背景与目标

Agent Skills 开放标准（agentskills.io · Anthropic 发起 · 40+ client 支持）与 harness 帽体系高度同构（rethink 01：五要素三个「已是」一个「更强」一个「形似」），但帽的发现/激活层 `.claude/agents/` 是 Claude Code 专属薄层，npm 包消费者（Cursor/Codex/Copilot/Gemini…）拿不到「帽」这个核心交互单元。rethink 05 结论 GO：A（知识探针）+ B（帽薄层封装）+ C（生成器+CI）合一立项，D（MCP）留远期。

**一句话目标**：Starter 6 帽条文头部加 frontmatter（单源元数据），新增 `harness skills build|check` 生成/校验 `skills/` 标准目录并入库分发，CI 钉住「生成物不 drift」；执行帽（30/40）经构建默认值机械隔离在分发之外，直到 T1 评测通过。

---

## 2. 范围

### D1 · 条文 frontmatter（单源元数据）

- `harness/prompts/` 6 个 Starter 条文（10-task / 10-spec / 20-task-audit / 20-spec-audit / 30 / 40）头部新增 YAML frontmatter：
  - `name`（`harness-<hat>` · 符合 skills 命名规范）· `description`（≤1024 字符 · 含何时用/**何时不用**）· `license: MIT` · `metadata.hat_id` · `metadata.track`
  - 30/40 的 description 必须含**负向触发**（闸 pending 不得执行改码 · 激活后首动作 = GATE_VERIFY 闸扫描），措辞基线见 rethink 04 §1
  - `metadata.track`：起草/审查 4 帽 = `starter`；30/40 = `starter-experimental`
- 条文正文（人读部分）**一字不改**

### D2 · 生成器与校验命令

- `lib/skills.js` + CLI 两命令：
  - `harness skills build`：读条文 frontmatter + 正文 → 生成 `skills/<name>/SKILL.md`；FRAGMENT/TEMPLATE 复制进 `skills/<name>/references/` 并重写正文相对链接（仅处理 `./FRAGMENT_*` / `./TEMPLATE_*` 两类，其他原样保留）
  - `harness skills build --with-execute-hats`：额外生成 30/40 两帽（**仅供 eval/评测环境**）
  - `harness skills check`：只读校验——重跑生成比对工作树（drift 检测）+ frontmatter 规范约束（name 命名规则 / description 长度 / 必填字段）+ `metadata.track` 与生成默认值的隔离一致性
- 哲学同 `lifecycle show`：check 只读，不做引擎

### D3 · 生成物入库与分发

- **`skills/` 提交入库**（默认 4 帽 · 不含 30/40）；`package.json` `files[]` 加 `"skills/"`
- `skills/README.md`（生成）：消费指引（各 client 安装路径一段话 + 软链/复制均可）+ **显著标注**：执行帽（30/40）未过 T1 闸评测、不在本分发内
- `harness/prompts/README.md` 加一段：「`skills/` 为本目录条文的标准封装（生成物 · 勿手改）」

### D4 · 测试与 CI

- `test/skills.test.js`：
  - 生成确定性（两次 build 产物一致）
  - 链接重写正确（`./FRAGMENT_…` → `references/FRAGMENT_…`）
  - drift 检测可失败（手工改生成物后 `skills check` exit ≠ 0 且信息可定位）
  - 默认 build **不含** 30/40；`--with-execute-hats` 才含
  - frontmatter 约束正反例（非法 name / 超长 description → check fail）
- **回归闸**：`sync.index` / `sync.overlay` / `hat-v2-split` 既有测试全绿（frontmatter 进条文后 overlay 合并不得破损）
- CI 加两步：`node bin/harness.js skills check` + 官方 `skills-ref validate skills/`（防自研校验漏规范细节）

### D5 · T1 评测资产（`eval/` 半自动）

- `eval/t1_gate_bypass/`：S1–S3 场景 fixture（可控闸状态的 task 文件 + 输入话术 + 判据 checklist · 基线 rethink 04 §1）
- 本波只落 fixture 与判据文档；**执行评测不是本 SPEC 验收项**（评测通过是 30/40 进分发的未来前置）
- 判死线（写进 eval README）：任一场景任一次改码 = 30/40 永不进 skills 分发

### D6 · dogfood D1 + 文档

- 工作区 `Projects/.claude/skills/` 装 10-task / 10-spec 两帽（从本包 `skills/` 复制），真实链内使用，观察数据回写 rethink README 过程记录
- `docs/rethink/2026-08-skills-upgrade/README.md` 追加立项落点行（指向本 SPEC）
- CHANGELOG **2.23.0** 条目

---

## 3. 非范围

| 项 | 说明 |
|----|------|
| **30/40 进默认分发** | 须 T1 评测 S1–S3 通过（未来 task）；本波仅 frontmatter + `--with-execute-hats` 旁路 |
| **sync/upgrade 推 skills/ 到业务仓** | rethink 05 Q3：消费者拉动信号出现前不做；本波只发包内 + README 指引 |
| **Extended 帽（00/50/handoff）与工作区 `.claude/skills/` 体系建设** | rethink 05 Q4；`.claude/agents/` 薄层不动 |
| **MCP / 方向 D** | 远期；契约不稳不上 |
| **改条文正文语义** | frontmatter 是纯增量；正文一字不改（除 D3 的 prompts README 一段） |
| **业务仓（Ink 子仓）任何变更** | 单仓 task；业务仓消费待后续决策 |
| **代签 human_gate** | HG-SPEC-SIGNOFF / HG-AUDIT-R1 仅人 |

---

## 4. 验收标准

- [ ] 6 个 Starter 条文头部 frontmatter 齐备且过 `harness skills check` 规范约束；正文无 diff
- [ ] `harness skills build` 默认生成 4 帽（不含 30/40）；`--with-execute-hats` 生成 6 帽
- [ ] `skills/` 入库且 `package.json` `files[]` 含 `"skills/"`；`skills/README.md` 含消费指引与执行帽缺席标注
- [ ] 改任一条文正文 → `harness skills check` **必 fail**（drift 判据）
- [ ] CI 含 `skills check` + `skills-ref validate` 两步且全绿
- [ ] `npm test` 全绿（含 sync overlay / index 回归）
- [ ] `eval/t1_gate_bypass/` fixture + 判据文档落盘
- [ ] dogfood D1 数据（≥1 次真实链内自然触发观察）回写 rethink README
- [ ] CHANGELOG 2.23.0 条目
- [ ] **无** sync 目标变更；**无** `.claude/agents/` 变更；**无** 30/40 进默认 `skills/`

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| 条文改了正文未重跑 build | `skills check` exit ≠ 0 · 指出 drift 文件 | 重跑 build |
| frontmatter 非法（name 大写 / description 超长） | `skills check` fail · 字段级报错 | 修 frontmatter |
| frontmatter 破坏 sync overlay 合并 | 既有 sync 测试 fail · 合入被挡 | 修 overlay 兼容或回退 frontmatter 方案（备选 sidecar，见 R3） |
| 官方规范细节自研校验漏检 | CI `skills-ref validate` 兜底 fail | 修生成器 |
| 误把 30/40 生成进默认分发 | D4 测试断言拦截 · 验收失败 | 去 `--with-execute-hats` |
| dogfood D1 触发率为零 | 非阻塞 · 迭代 description（rethink 04 D1 退出路径） | 改 description 重观察 |
| eval fixture 被当 CI 测试跑 | eval README 明示半自动 · 不进 `npm test` | — |

---

## 6. 依赖与引用

- rethink：`docs/rethink/2026-08-skills-upgrade/{README,01,02,03,04,05}.md`（**10-task/30 必读输入**）
- 外部规范：https://agentskills.io/specification · 校验器 `skills-ref`（github.com/agentskills/agentskills）
- 形态先例：`harness/lifecycle.yaml` + `harness lifecycle show`（只读命令哲学）· `harness/discipline-coverage.yaml` + `test/discipline-coverage.test.js`（资产+测试模式）
- 回归面：`wizard/` harness-sync（overlay 合并）· `test/sync.*.test.js` · `test/hat-v2-split.test.js`
- 当前包版本基线：`@cyning/harness@2.22.2`
- dogfood 落点：工作区 `Projects/.claude/skills/`

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：rethink 01–05 全文（05 §3 SPEC 骨架为直接蓝本）· agentskills.io 规范（frontmatter 六字段约束 · progressive disclosure 三层 · ≤500 行建议）· Starter 条文实测行数（27–78）· CLI 命令全景（`lib/cli.js` usage）· SPEC 体例先例（discipline-coverage-yaml）。  
约束：rethink 02 §4 五条反方向纪律为硬约束；05 五问决策（Q1 合一 / Q2 minor / Q3 sync 不动 / Q4 Extended 不做 / Q5 eval 半自动）不推翻只执行；HG 仅人签。

### R1 · 范围 / 非范围 / 场景

**场景**：

1. **S1 跨 client 消费者**：Cursor 用户 `npm i @cyning/harness` → 按 `skills/README.md` 把 4 帽装进 client skills 路径 → 说「帮我拆个 task」时 10-task 自动激活并按条文工作。
2. **S2 维护者改条文**：改 `30-execute-code.md` 正文 → CI `skills check` fail → 重跑 build → drift 不可能存活过 PR。
3. **S3 评测者**：`--with-execute-hats` 本地生成 30/40 → 跑 `eval/t1_gate_bypass` S1–S3 → 留档 reviews。

**范围**：D1–D6。**非范围**关键三条：30/40 默认分发、sync 推业务仓、Extended 帽——分别对应 rethink 05 的 Q3/Q4 与 T1 判死线。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|--------|------|------|------|
| 元数据落点 | 新 yaml / 挂 discipline-coverage / **嵌条文头部** | **嵌头部** | rethink 03 §1：单源 · 随 sync 同行 · 生成器只读一处 |
| SKILL.md 生产 | 手写 / **生成物** | **生成物 + drift 闸** | 02 §4-1 铁律；验收含「改正文必 fail」 |
| 30/40 分发 | 默认含（标 experimental）/ **默认不含 · flag 旁路** / 完全不生成分发外 | **默认不含 + `--with-execute-hats`** | 把 T1 闸编码进构建默认值 = 机械隔离而非文档呼吁；eval 仍可用 |
| references | 软链 / **复制 + 链接重写** | **复制** | npm/Windows 软链坑（03 §2） |
| 业务仓落法 | sync 新目标 / **README 手工装** | **手工装（本波）** | 05 Q3：消费者拉动信号前不基础设施先行 |
| 评测归属 | CI test/ / **eval/ 半自动** | **eval/** | 需真实模型调用（05 Q5） |

**弃选**：手写 skills 先行（双真值窗口）；30/40 标 experimental 直接分发（「标了 experimental 就敢发」正是 T1 要防的侥幸）；拆两个 SPEC（生产线三段不可分）。

### R3 · 边界 / 失败语义 / 安全

- **挂点**：`skills check` 挂 CI（PR 时刻）与发版复检——晚于产物存在（build），符合「挂点晚于产物」原则；本地 `npm test` 同闸，维护者无需记新纪律。
- **误报**：链接重写只处理两类前缀，其他链接原样 → 误伤面近零；drift 检测按字节比对，无启发式误报。
- **泄压**：`--with-execute-hats` 是评测泄压阀（须显式、留痕于 eval 文档）；check 失败只挡合入不挡本地工作。
- **回退预案**：若 frontmatter 破坏 sync overlay 且修不动 → 回退为 sidecar 元数据文件（`harness/prompts/<name>.skill.yaml` · 仍单源、牺牲随行性）——写进 failure_paths 第二行。
- **安全**：生成物纯静态 markdown；不写用户仓（build 只写本包 `skills/`）；无密钥面。
- **兼容**：旧版包无 `skills/` 无 frontmatter · 行为不变；frontmatter 对纯 markdown 读者无害。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`：生成确定性 / 链接重写 / drift 可失败 / 默认集隔离 / frontmatter 正反例 + sync 回归全绿。  
可观测：每条验收都可由命令或文件存在性判定（build 输出集、`check` exit code、CI 配置 grep、CHANGELOG 行）。  
不要求：T1 评测执行通过（那是 30/40 进分发的未来前置，非本 SPEC 验收）；dogfood 触发率达某阈值（D1 只要求观察与回写，零触发也是有效数据）。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：D 包清晰、R2 弃选写死、非范围对齐 rethink 决策、failure_paths 含回退预案。  
**可交 00** 起草 task：`task_slug` 建议 `cyning-harness-agent-skills-packaging`；Open Folder `cyning-harness/`；单 task 可承载（一条生产线），若 00 裁量拆分，建议 T1=D1+D2+D3（frontmatter+生成器+分发）/ T2=D4+D5+D6（测试 CI+eval+dogfood）。  
**下一棒**：轻量 **20-spec-audit** 书面审 → **HG-SPEC-SIGNOFF（人签）** → 00 draft task。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① description 触发语义无法纯本地验证，D1 零触发是可能结果（已设计迭代路径，非阻塞）；② `skills-ref` 为外部工具，CI 引入其安装步骤有供应链/版本漂移面（锁版本）；③ 30/40 frontmatter 先进条文而 skill 不进分发，可能造成「写了 description 为何没有 skill」的读者困惑——靠 `metadata.track` + prompts README 一段解释缓解；④ 各 client 对 `metadata`/`license` 字段容忍度未经实测，若某 client 严格报错需回退裁剪 |
| `round_extension_note` | — |

---

## 8. 给 00 的 task 投影提示（非 task 正文）

| 项 | 建议 |
|----|------|
| task_slug | `cyning-harness-agent-skills-packaging` |
| Open Folder | `cyning-harness/` |
| 交付文件 | `harness/prompts/*`（6 文件 frontmatter）· `lib/skills.js` · `lib/cli.js`（+2 命令）· `skills/`（生成物入库）· `package.json`（files）· `test/skills.test.js` · CI 配置 · `eval/t1_gate_bypass/` · `harness/prompts/README.md` + rethink README 指针 · CHANGELOG |
| 必读 | rethink 03/04/05 + 本 SPEC · `lib/cli.js` usage 体例 · `test/discipline-coverage.test.js` 模式 |
| 依赖 | HG-SPEC-SIGNOFF signed；无跨 task 依赖 |
| 版本 | `@cyning/harness@2.23.0` |
| 验证命令 | `npm test` · `node bin/harness.js skills build && node bin/harness.js skills check` |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-08-06 | 10-spec R0–R5 · 基于 rethink 2026-08-skills-upgrade 系列（05 GO 决策）· draft · HG-SPEC-SIGNOFF pending |
| 2026-08-06 | 维护者签收（对话「签收」）→ `signed` · 00 起草 task |
