# Runbook · 升级后 wiki_delta 迁移（v2.19+）

> **用途**：业务仓升级 `@cyning/harness` 后扫迁 `wiki_delta`，并可选挂 CI / `--strict`。  
> **非范围**：不削弱 close 闸；不自动改 task；不自动把 `coding_wiki` 迁成 `topics/`；**不**代写各仓 workflow。  
> **Open Folder**：对准**业务仓 git root**（勿写死 `Desktop/Projects/…` 假路径）。

---

## 0. 何时硬失败（CI）

| 阶段 | 建议 |
|------|------|
| **迁移中**（存量 task 尚未补齐） | workflow 可暂 `continue-on-error: true`，或只本地跑 lint |
| **迁完后** | CI **硬失败**（样例默认）；再开可选 `--strict` 做关账预检 |

原则：**先补字段让默认 lint 绿，再考虑 `--strict` / 硬闸**。勿在半迁状态把 `--strict` 设成必绿。

---

## 0b. 已迁完仓 · 快速路径（v2.21+）

若上一波已补齐 `wiki_delta`（默认 `lint-wiki-delta` 预期绿），升小版本只需：

> **overlay（≥2.22）**：若仓内曾有 AGENTS/FRAGMENT/cursor **仓内定制**（或仍把词写在产品 `cyning-harness:begin/end` 内）→ **先完成 [§1.2.1](#121-首次接入-overlay-契约强制序)**（或确认已有产品块外 local + 所需 `graph_modules_path` 且已 commit），再跑下方 upgrade。勿跳过迁契约却指望手恢复。

```bash
npx --yes @cyning/harness@2.22.1 upgrade --yes
npx --yes @cyning/harness@2.22.1 check
# 若仓有 harness.pin.json / 单源版本文件 → 同步 bump（产品 upgrade 不代写）
npx --yes @cyning/harness@2.22.1 task lint-wiki-delta --target .
npx --yes @cyning/harness@2.22.1 task lint-wiki-delta --target . --strict
# （可选）挂 CI · 见 §5
```

`missing=0` 时可**跳过** §3 决策树；重点验 RUNBOOK / `--strict` / CI 样例。

---

## 1. 升级包

推荐**钉目标版**（与 check / CI 一致；dogfood F-220-04）：

```bash
npx --yes @cyning/harness@2.22.1 upgrade --yes
npx --yes @cyning/harness@2.22.1 check
```

`upgrade` **不**代写 `docs/tasks/**` 元信息，也 **不**改已有 `docs/coding_wiki/` 目录形状。

### 1.1 若仓有 pin / 单源版本文件（F-220-01）

`upgrade` **只**更新 `.cyning-harness/manifest.json` 等纪律层，**不会**自动 bump 消费者自管文件（如 `harness.pin.json`）。  
有 pin 时须在 upgrade 后**额外**同步（本仓自有脚本 / 手改），再跑本仓 `check-harness-pin`（若有）。无 pin 可跳过。

### 1.2 overlay（v2.22+ · 部分根治）

**根因**：产品 marker 整块 replace + prompts/`cp`。定制写在产品同步面内 → 每次 upgrade 必冲。

| 做法 | 说明 |
|------|------|
| **操作序** | **先迁并 commit 契约 → 再 upgrade**（见 [§1.2.1](#121-首次接入-overlay-契约强制序)）；脏树可能 **S5** 拒 apply；勿依赖「upgrade 后代手恢复」；`--force` **非**默认 |
| **local 块** | 仓特异词写在 `<!-- cyning-harness-local:begin/end -->`，且在产品 `cyning-harness:begin/end` **外** |
| **G-L 路径** | `.cyning-harness/profile.json` 与 `tracks` **同级**增加 `"graph_modules_path": "l1/01_modules"`（默认不写 = `01_struct`） |
| **自检** | apply 结束会打印 `hint · overlay`；仍建议看 diff |

```bash
git diff HEAD -- AGENTS.md CLAUDE.md .cursor/rules/05-harness-starter.mdc \
  docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md
```

**负面边界**：定制只写在产品 marker 内且无 local 包裹 → upgrade **仍冲**（预期边界，勿当 bug）。误把 local 嵌在产品块内时，sync 会尝试 **salvage** 到块外（见 stdout warn）。

### 1.2.1 首次接入 overlay 契约（强制序）

适用于：manifest **低于 2.22**，或已 ≥2.22 但仍把仓特异词写在产品 `cyning-harness:begin/end` 内 / 未设所需 `graph_modules_path`。  
能力真值自 **2.22.0**；本序为 ops dogfood 流程化（文档 **2.22.1+**）。无仓内定制可跳过本节。

**逐步（须按序；可复制）：**

1. **迁 profile**（若需 G-L / 非默认模块页）  
   编辑 `.cyning-harness/profile.json`，与 `tracks` **同级**增加（路径按仓裁剪）：

       "graph_modules_path": "l1/01_modules"

   不需要变体时可不写（sync 展开为 `01_struct`）。

2. **迁 AGENTS**（CLAUDE 若有同类定制则同规）  
   - 产品 `<!-- cyning-harness:begin -->` … `<!-- cyning-harness:end -->` **内**：只留产品 fragment 语义，**删除**仓特异词。  
   - 紧接产品 `end` **之后**增加 local 块，例如：

         <!-- cyning-harness-local:begin -->
         （仓特异：试点闸关键词、拒改码补句等）
         <!-- cyning-harness-local:end -->

   - **禁止**：local 嵌在产品 begin/end 内；**禁止**往 `.cursor/rules/05-harness-starter.mdc`（或等价 cursor 规则）塞仓特异词（upgrade 全量 `cp`）。

3. **先 commit 契约（关键）**  

       git add .cyning-harness/profile.json AGENTS.md
       # 若改了 CLAUDE.md 一并 add
       git status   # 工作区应对 sync 足够干净
       git commit -m "chore(harness): adopt overlay local block and graph_modules_path"

   未提交就 `upgrade` → 脏树常触发 **S5**（`sync apply` 中止）。紧急才用 `upgrade --force` / `HARNESS_SYNC_FORCE=1`；**勿**把 force 当常态。

4. **再钉版 upgrade**  

       npx --yes @cyning/harness@2.22.1 upgrade --yes
       npx --yes @cyning/harness@2.22.1 check

   注视 stdout：`overlay · FRAGMENT graph_modules_path → …` 与 `hint · overlay`。

5. **有 pin 则 bump**（upgrade **不**代写）→ 再跑本仓 pin 检查（若有）。

6. **验收（合规零手恢复）**  

       git diff HEAD -- AGENTS.md CLAUDE.md .cursor/rules/05-harness-starter.mdc \
         docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md

   - 期望：local 关键词仍在；FRAGMENT 含 profile 路径（非误回默认且丢定制）；**无需**从 backup 手贴。  
   - 建议再跑一次 `npx --yes @cyning/harness@2.22.1 upgrade --yes`：第二次 overlay 相关 diff 宜空或仅产品合法更新。

IDE 纪律摘要：[`ide/adapters/README.md`](../ide/adapters/README.md)（POINTER 回本节）。

### 1.3 local.json（建议）

`.cyning-harness/local.json` 常含本机 npx 缓存绝对路径 → **建议加入 `.gitignore`**；多机/CI 勿提交。

---

## 2. 扫缺口

```bash
# 默认：只报缺 wiki_delta 字段（v2.19+）
npx --yes @cyning/harness@2.22.1 task lint-wiki-delta --target .

# 关账预检（v2.20+）：另报 none/n/a 无 note、path 不存在
npx --yes @cyning/harness@2.22.1 task lint-wiki-delta --target . --strict

# 仅 active / JSON
# npx --yes @cyning/harness@2.22.1 task lint-wiki-delta --scope active --json
```

- exit **0**：当前档全齐  
- exit **2**：列出相对路径（及 `--strict` 时的 `code`）→ 按 §3 补

---

## 3. 补字段（决策树）

真值：[`USER_GUIDE` §6.0b](./USER_GUIDE_v1.0_zh.md)。`missing=0` 可跳过本节。

| 条件 | `wiki_delta` | note |
|------|--------------|------|
| 未启用 WikiTrack | `n/a` | 一行理由 |
| 有轨、本 task 未改 wiki | `none` | 一行理由 |
| 本 task 改了 wiki | 相对仓根 path | path 须存在 |

```bash
npx --yes @cyning/harness@2.22.1 verify --target . --task docs/tasks/active/<task>.md
```

---

## 4.（可选）目录两层 · wiki export

```bash
# --target = 仓根；--root = wiki 目录（相对仓根）。二者等价语义见 USER_GUIDE。
npx --yes @cyning/harness@2.22.1 wiki export --json --target . --root docs/coding_wiki
```

叙述勿写裸双括号说明性字面；v2.21+ 对 `[[wikilink]]` 等**伪链**默认跳过 WARN（真缺页仍 WARN）。

---

## 5.（可选）挂 CI

### 5.1 获取样例（勿写含糊 path/to）

任选其一：

```bash
# A · 本机已 clone 产品仓
cp /path/to/cyning-harness/ci/samples/lint-wiki-delta.yml.example \
  .github/workflows/lint-wiki-delta.yml

# B · npm pack（不依赖 monorepo checkout）
npm pack @cyning/harness@2.22.1
tar -xzf cyning-harness-*.tgz
cp package/ci/samples/lint-wiki-delta.yml.example .github/workflows/lint-wiki-delta.yml
rm -rf package cyning-harness-*.tgz

# C · GitHub raw（标签随发版改）
curl -fsSL -o .github/workflows/lint-wiki-delta.yml \
  https://raw.githubusercontent.com/Cyning12/cyning-harness/v2.22.1/ci/samples/lint-wiki-delta.yml.example
```

有 **pin** 的仓：对照 [`lint-wiki-delta.pin.yml.example`](../ci/samples/lint-wiki-delta.pin.yml.example) 改编，或样例内「读 pin」注释。

### 5.2 策略

| 建议 | 说明 |
|------|------|
| 样例默认 | **硬失败** + 默认 lint（仅缺字段） |
| 迁移中 | `continue-on-error: true` |
| 迁完关账预检 | 可选第二 job/`--strict`（见样例；**半迁勿开**） |
| Python / 无 package.json | **必须** `package-manager-cache: false`（见 [`ci/samples/README`](../ci/samples/README.md)） |

---

## 6. 关账后继续

本 task `task close` 通过后即可开下一 task；读序靠已晋升的 `docs/coding_wiki/`。

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | v2.19.1 · 首版 |
| 2026-07-28 | v2.19.2 · §0 硬失败 |
| 2026-07-28 | v2.20.0 · `--strict` |
| 2026-07-28 | v2.21.0 · 快速路径 · pin/overlay · cp 三法 · Python 交叉链 · export 旗标/伪链（web+ops FEEDBACK） |
| 2026-07-28 | v2.22.0 · overlay 部分根治（local 块 · graph_modules_path · hint） |
| 2026-07-28 | v2.22.1 · §1.2.1 首次接入 overlay **强制操作序** · §0b 交叉链 · 示例钉版（ops RUNBOOK FEEDBACK） |
