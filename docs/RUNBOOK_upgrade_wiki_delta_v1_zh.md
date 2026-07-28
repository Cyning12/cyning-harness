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

```bash
npx @cyning/harness@2.21.0 upgrade --yes
npx @cyning/harness@2.21.0 check
# 若仓有 harness.pin.json / 单源版本文件 → 同步 bump（产品 upgrade 不代写）
npx @cyning/harness@2.21.0 task lint-wiki-delta --target .
npx @cyning/harness@2.21.0 task lint-wiki-delta --target . --strict
# （可选）挂 CI · 见 §5
```

`missing=0` 时可**跳过** §3 决策树；重点验 RUNBOOK / `--strict` / CI 样例。

---

## 1. 升级包

推荐**钉目标版**（与 check / CI 一致；dogfood F-220-04）：

```bash
npx @cyning/harness@2.21.0 upgrade --yes
npx @cyning/harness@2.21.0 check
```

`upgrade` **不**代写 `docs/tasks/**` 元信息，也 **不**改已有 `docs/coding_wiki/` 目录形状。

### 1.1 若仓有 pin / 单源版本文件（F-220-01）

`upgrade` **只**更新 `.cyning-harness/manifest.json` 等纪律层，**不会**自动 bump 消费者自管文件（如 `harness.pin.json`）。  
有 pin 时须在 upgrade 后**额外**同步（本仓自有脚本 / 手改），再跑本仓 `check-harness-pin`（若有）。无 pin 可跳过。

### 1.2 overlay 自检（ops dogfood · 必做）

marker merge / prompts sync 可能冲掉仓内定制。upgrade 后立刻：

```bash
git diff -- AGENTS.md CLAUDE.md .cursor/rules/05-harness-starter.mdc \
  docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md
# 路径按仓裁剪；有定制则从 backup/历史恢复关键词与 G-L 占位
```

### 1.3 local.json（建议）

`.cyning-harness/local.json` 常含本机 npx 缓存绝对路径 → **建议加入 `.gitignore`**；多机/CI 勿提交。

---

## 2. 扫缺口

```bash
# 默认：只报缺 wiki_delta 字段（v2.19+）
npx @cyning/harness@2.21.0 task lint-wiki-delta --target .

# 关账预检（v2.20+）：另报 none/n/a 无 note、path 不存在
npx @cyning/harness@2.21.0 task lint-wiki-delta --target . --strict

# 仅 active / JSON
# npx @cyning/harness@2.21.0 task lint-wiki-delta --scope active --json
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
npx @cyning/harness@2.21.0 verify --target . --task docs/tasks/active/<task>.md
```

---

## 4.（可选）目录两层 · wiki export

```bash
# --target = 仓根；--root = wiki 目录（相对仓根）。二者等价语义见 USER_GUIDE。
npx @cyning/harness@2.21.0 wiki export --json --target . --root docs/coding_wiki
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
npm pack @cyning/harness@2.21.0
tar -xzf cyning-harness-*.tgz
cp package/ci/samples/lint-wiki-delta.yml.example .github/workflows/lint-wiki-delta.yml
rm -rf package cyning-harness-*.tgz

# C · GitHub raw（标签随发版改）
curl -fsSL -o .github/workflows/lint-wiki-delta.yml \
  https://raw.githubusercontent.com/Cyning12/cyning-harness/v2.21.0/ci/samples/lint-wiki-delta.yml.example
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
