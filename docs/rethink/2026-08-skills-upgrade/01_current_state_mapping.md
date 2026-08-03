---
name: rethink-skills-upgrade-01-current-state-mapping
description: 现状盘点 · harness 帽体系 × Agent Skills 标准逐条映射 · 何时读：理解我们离标准有多远、哪些已是 Skill 哪些不是
---

# 01 · 现状映射：帽体系已经是「半个 Skill 系统」

> **简介**：核心发现——cyning-harness 的帽体系与 Agent Skills 标准**在哲学上早已同构**（薄层发现 + 必读指向 + 按需展开 = 手工版 progressive disclosure），缺的是**标准格式封装**与**跨 client 分发面**。本文逐要素映射，标出「已是 / 形似 / 缺失」。

## 1. 五要素映射表

| Skill 标准要素 | harness 现状对应物 | 状态 | 差距 |
|---|---|---|---|
| `SKILL.md` frontmatter（name/description） | `.claude/agents/harness-*.md` frontmatter（name/description/tools） | **形似** | agent frontmatter 无 description 触发语义训练假设的约束（≤1024 字符、何时用）；agent 靠 Lead 显式 spawn，skill 靠描述匹配自动激活 |
| 指令正文（Markdown body） | 帽条文 `harness/prompts/*.md`、`Projects/docs/harness/prompts/*.md` | **已是** | 条文真值已是独立 markdown，天然可作 SKILL.md body 或 references |
| `references/`（按需加载） | 「必读」清单 + `SPEC_TEMPLATE_v1_zh.md` + `guides/` + FRAGMENT_* | **已是** | 薄层只列路径、spawn 时才读 = 手工版第二层 disclosure |
| `scripts/`（可执行） | npm 包 CLI（`verify`/`close`/`lint`/`lifecycle show`）+ `bin/` | **已是（更强）** | CLI 已是机械闸，比 skill scripts 更硬；但 skill 内尚无「何时调哪个命令」的显式挂接说明 |
| `assets/`（模板/资源） | `harness/templates/`、`docs/harness/invokes/` 模板 | **已是** | 未按标准目录名组织，client 不会自动识别 |

**结论**：五要素中三个「已是」、一个「更强」、一个「形似」。差距不在能力，在**封装格式与发现机制**。

## 2. Progressive disclosure 对照

| 阶段 | Skill 标准 | harness 现状 |
|---|---|---|
| 1 Discovery（~100 token） | client 启动时加载全部 skill 的 name+description | Lead 读 `.claude/agents/` frontmatter（人工/agent 判断选帽） |
| 2 Activation（<5000 token） | 匹配时读入 SKILL.md 全文 | spawn prompt 注入薄层 + 必读路径 |
| 3 Execution（按需） | 读 references/、跑 scripts/ | 帽读条文全文、调 CLI 闸 |

harness 的三层全部存在，但**每一层都靠人/Lead 手工驱动**。Skill 化的本质收益 = 把发现与激活交给 client 的标准机制，且**跨 client 免费**。

## 3. 两个消费面的不对称

| 面 | 位置 | 格式 | 谁能消费 |
|---|---|---|---|
| 包分发面 | `harness/prompts/`（Starter 9 文件）+ templates | client-agnostic markdown | 所有 client，但**无任何 client 能自动发现/激活**——纯靠用户手工粘贴/引用 |
| 工作区面 | `Projects/.claude/agents/harness-*.md`（6 薄层） | Claude Code subagent 专属 | 仅 Claude Code；Cursor/Codex/Copilot 用户拿不到换帽能力 |

**这是当前最真实的能力缺口**：包自称 client-agnostic，但「帽」这个核心交互单元只在 Claude Code 上有薄层封装。

## 4. 不是 Skill 的部分（边界声明）

以下 harness 机制**不该也不需** Skill 化，防止方向跑偏：

- **机械闸**（verify/close/lint/lifecycle）——代码强制，skill 是 prompt 层；闸的真值留在 CLI
- **human_gate 表**——闸真值在 task 文件，任何 skill 描述都不能替代人签
- **串行换帽协议**（PROMPT_claude_chain_serial_v2）——是**编排层**（orchestration），skill 是**能力层**（capability）；协议可引用 skill，不能被 skill 取代
- **Git 仅 Lead** 等纪律——靠 agent 定义 + 协议，skill 的 `allowed-tools` 是实验字段，不可依赖

## 5. 一句话现状

> harness 有一套成熟的「手工 Skill 系统」，跑在 Claude Code 专属薄层上；把它翻译为标准格式 = 低成本、跨 client、且与方向三（Agent 一等公民接口）同路。风险不在翻译，在**双真值**与**自动激活 vs 串行协议**的张力（见 02）。
