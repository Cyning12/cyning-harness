---
name: rethink-skills-upgrade-03-format-design
description: R2 上 · 方向 A/B/C 格式细化与四个落点决策 · 何时读：要知道 skills 目录长什么样、元数据放哪、怎么生成与校验
---

# 03 · 格式设计：四个落点决策 + SKILL.md 样例

> **简介**：R2 上半。先修正 R1 的一个错误前提（Starter 条文已经很薄），然后对 02 §5 留给 R2 的前三个问题给出决策，附 10-task 的 SKILL.md 完整草案与生成/校验挂点。

## 0. 修正 R1 的前提

实测 `harness/prompts/` 全部文件 **27–78 行**（最大 20-task-audit 78 行），远低于 Skill 规范「SKILL.md ≤500 行」上限。

**推论**：方向 B 的 SKILL.md **不需要**「薄层正文 + references/ 条文」的二次拆分——现有条文正文直接就是合格的 SKILL.md body。生成 = **frontmatter + 原文正文 + 相对链接重写**。`references/` 只收 FRAGMENT/TEMPLATE（它们本来就是条文内的按需加载指针）。这把方向 B 的成本从「改写」降为「封装」，也强化了 T3 解法：SKILL.md 纯生成物，零手写。

## 1. 决策一：帽元数据落点 → **嵌在 prompt 文件头的 frontmatter**

02 §5 候选：新 yaml / 挂 `discipline-coverage.yaml` / 嵌 prompts 头部。决策：**嵌头部**。

| 候选 | 判死/判活理由 |
|---|---|
| 新 yaml（如 `harness/skills.yaml`） | ❌ 新增一份「帽→元数据」映射，帽改名/增删时两处维护——正是 T3 要防的双真值 |
| 挂 `discipline-coverage.yaml` | ❌ 该文件管 **statements×强制状态**（纪律审计），不管触发语义；职责混杂会把两个演化节奏绑死 |
| 嵌 prompt 头部 frontmatter | ✅ 单源：name/description/触发词与条文同文件同 PR 演化；sync 复制到业务仓时 frontmatter 天然随行；生成器只需「读头 + 拼 body」 |

约束：frontmatter 只对生成器有意义，条文正文（人读部分）保持纯 markdown 不变。

## 2. 决策二：references → **生成时复制 + CI 一致性校验**（不用软链）

- npm 打包对软链支持差、Windows 消费者踩坑 → 软链判死
- 生成器把 `FRAGMENT_*` / `TEMPLATE_*` **复制**进 `skills/<hat>/references/`，同时**重写正文内的相对链接**（`./FRAGMENT_30_gate_verify_v1_zh.md` → `references/FRAGMENT_30_gate_verify_v1_zh.md`）
- CI 校验生成物与源一致（重跑生成器 diff 为空，golden 模式——与包内既有 `golden/` 测试同构）

## 3. 决策三：分发与 dogfood 顺序 → **包内生成物入库，工作区先吃**

- 包内新增 **`skills/`**（生成物、提交入库），`package.json` `files[]` 加 `"skills/"`
- 生成物入库而非发布时生成：消费者 `npm pack` 即得、CI 可校验、diff 可审——与「文件真值」哲学一致
- dogfood 顺序：**工作区 `Projects/.claude/skills/` 先装 2 个起草帽（10-task / 10-spec）** → 真实链内使用 → 数据回写 → 扩 20 系 → 30/40 最后（须过 T1 评测，见 04）
- 业务仓侧（Ink 子仓）经 sync 收到 skills/ 的落法，留 R3（sync 新目标目录决策）

## 4. 决策四：生成/校验挂点 → `lib/skills.js` + `harness skills build|check`

- `harness skills build`：读 `harness/prompts/*.md` frontmatter → 生成 `skills/<name>/SKILL.md` + `references/`
- `harness skills check`：只读校验（重跑生成、比对工作树、跑 frontmatter 规范约束）——与 `lifecycle show` 同哲学（只读、不做引擎）
- 测试：`test/skills.test.js`（生成确定性 + 链接重写 + 规范约束），模式照搬 `test/discipline-coverage.test.js`
- 规范校验外部分：`skills-ref validate` 入 CI 作为独立 step（官方校验器，防自研校验漏规范细节）

## 5. SKILL.md 草案（10-task 完整例）

源：`harness/prompts/10-task-requirements.md` 头部新增 frontmatter（手写、单源）：

```yaml
---
name: harness-10-task
description: >-
  起草/修订 Harness task 文件（验收标准、failure_paths、非范围、依赖、
  思考轮控制表 R0–R5）。当需要把一项工作拆成可验收的 task、或审查 task
  结构完整性时使用。不用于：直接实现代码（那是 hat 30，且须
  HG-AUDIT-R1=approved）；起草 SPEC（用 harness-10-spec）。
license: MIT
compatibility: Requires npx @cyning/harness CLI for gate checks
metadata:
  hat_id: "10-task"
  track: starter
---
```

生成物 `skills/harness-10-task/SKILL.md` = 上述 frontmatter + 原条文正文（链接已重写）。

**description 写法要点**（规范 ≤1024 字符，决定触发命中率）：
1. 做什么（一句话）+ 何时用（任务形态关键词）
2. **何时不用**（负向触发：指向正确的帽 / 声明闸前置）——T1 设计的主战场
3. 中英混合触发词（用户可能说「拆任务」也可能说 "draft a task"）

## 6. 目录形态（生成物全貌）

```
skills/                          # 包内新增 · 生成物入库
├── harness-10-task/
│   └── SKILL.md                 # frontmatter + 10-task-requirements.md 正文
├── harness-10-spec/
│   └── SKILL.md
├── harness-20-task-audit/
│   └── SKILL.md
├── harness-20-spec-audit/
│   └── SKILL.md
├── harness-30-execute/
│   ├── SKILL.md                 # 正文链接已重写 ↓
│   └── references/
│       ├── FRAGMENT_30_gate_verify_v1_zh.md
│       ├── FRAGMENT_30_invoke_block_v1_zh.md
│       └── TEMPLATE_30_gate_stop.md
└── harness-40-self-check/
    └── SKILL.md
```

6 个 skill 对应 Starter 6 帽；FRAGMENT/TEMPLATE 不独立成 skill（它们是 30 的按需资源，不是可触发能力）。Extended 帽（00/50/handoff）不进包、不进本轮——工作区若需要另立 `.claude/skills/` 手工薄层，留 R3 评估。

## 7. 与既有资产的接口（不改动的部分）

- `discipline-coverage.yaml`：不动；skills 化后可考虑给 statements 加 `surfaced_in: skills/harness-*/` 反向指针（可选，R3 再定）
- `harness/prompts/README.md`：加一段「skills/ 为本目录条文的标准封装（生成物，勿手改）」
- sync/upgrade：本轮只保证包内有 `skills/`；业务仓落法 R3 决策
