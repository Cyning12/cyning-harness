# Runbook · 升级后 wiki_delta 迁移（v2.19+）

> **用途**：业务仓从 `@cyning/harness` **低于 2.18** 升到 **≥ 2.19** 后，一次性扫迁 `wiki_delta`，并可选挂 CI。  
> **非范围**：不削弱 close 闸；不自动改 task；不自动把 `coding_wiki` 迁成 `topics/`。

## 0. 何时硬失败（CI）

| 阶段 | 建议 |
|------|------|
| **迁移中**（存量 task 尚未补齐） | workflow 可暂 `continue-on-error: true`，或只本地跑 lint |
| **迁完后** | CI **硬失败**（样例默认）；再开可选 `--strict` 做关账预检 |

原则：**先补字段让默认 lint 绿，再考虑 `--strict` / 硬闸**。勿在半迁状态把 `--strict` 设成必绿。

## 1. 升级包

```bash
npx @cyning/harness upgrade --yes
npx @cyning/harness check
```

`upgrade` **不**代写 `docs/tasks/**` 元信息，也 **不**改已有 `docs/coding_wiki/` 目录形状。

## 2. 扫缺口

```bash
# 默认：只报缺 wiki_delta 字段（升级迁移清单 · v2.19+）
npx @cyning/harness task lint-wiki-delta --target .

# 关账预检（v2.20+）：另报 none/n/a 无 note、path 不存在
npx @cyning/harness task lint-wiki-delta --target . --strict

# 仅 active / 仅 done / JSON
# npx @cyning/harness task lint-wiki-delta --scope active
# npx @cyning/harness task lint-wiki-delta --json
```

- exit **0**：当前档全齐  
- exit **2**：列出相对路径（及 `--strict` 时的 `code`）→ 按 §3 补

消费者仓（Ink / Ops-desk / harness-web）操作序同本页；产品仓只提供本 runbook + CI 样例，**不**代写各仓 workflow。

## 3. 补字段（决策树）

真值：[`USER_GUIDE` §6.0b](./USER_GUIDE_v1.0_zh.md)。

| 条件 | `wiki_delta` | note |
|------|--------------|------|
| 未启用 WikiTrack | `n/a` | 一行理由 |
| 有轨、本 task 未改 wiki | `none` | 一行理由 |
| 本 task 改了 wiki | 相对仓根 path | path 须存在 |

批量：在 Harness 元信息表 `graph_delta_note` 行后插入两行（示例见 §6.0b）。

抽查：

```bash
npx @cyning/harness verify --target . --task docs/tasks/active/<task>.md
# 缺字段 → WARN（文案会提示 lint-wiki-delta）；close 才会 BLOCK
```

## 4.（可选）目录两层

若主题页在 wiki **根**平铺：按 [`coding_wiki/templates/README`](../coding_wiki/templates/README.md) 自行 `git mv` → `topics/`，修双括号 wikilink，再：

```bash
npx @cyning/harness wiki export --json --root docs/coding_wiki
```

叙述勿写裸双括号字面（会被 export 当边）。

## 5.（可选）挂 CI

```bash
mkdir -p .github/workflows
cp path/to/@cyning/harness/ci/samples/lint-wiki-delta.yml.example \
  .github/workflows/lint-wiki-delta.yml
```

| 建议 | 说明 |
|------|------|
| 样例默认 | **硬失败** + 默认 lint（仅缺字段） |
| 迁移中 | `continue-on-error: true` |
| 迁完且想关账预检 | 去掉 continue-on-error，并可加 `--strict`（见样例注释） |

说明见 [`ci/samples/README.md`](../ci/samples/README.md)。

## 6. 关账后继续

本 task `task close` 通过后，即可开下一 task；读序靠已晋升的 `docs/coding_wiki/`（与是否再升包无关）。

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | v2.19.1 · 升级扫迁一页 runbook |
| 2026-07-28 | v2.19.2 · §0 迁完再硬失败；消费者 POINTER；CI 策略表 |
| 2026-07-28 | v2.20.0 · 文档 `--strict` 关账预检 |
