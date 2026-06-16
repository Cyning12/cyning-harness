# Release v1.0.1 · A5 CLI verify（A+C+D）

> **包名**：`@cyning/harness@1.0.1`  
> **许可**：MIT  
> **日期**：2026-06-16  
> **代号**：A5 · CLI verify patch（v1.0.0 → v1.0.1）

---

## 概要

v1.0.0 已能 `npx init/upgrade/audit`，但业务仓若无 clone 路径或 `CYNING_HARNESS` 环境变量，Agent/维护者须手拼路径。v1.0.1 让 **任意业务仓直接跑** `npx @cyning/harness verify` / `gate-check` / `sync index`，通过 `.cyning-harness/local.json` 自动定位产品包根；并新增 Node 仓可选 `--with-scripts` 把 harness 命令写入 `package.json`。

---

## Quick Start

在 **目标业务仓根**：

```bash
# 首次接入
npx @cyning/harness@1.0.1 init --preset harness-only --ide cursor,agents --yes

# 30 前验证	npx @cyning/harness verify --target . --task docs/tasks/active/task_xxx.md

# 升级
npx @cyning/harness@1.0.1 upgrade --target . --yes
```

Node 仓可选 scripts 路径：

```bash
npx @cyning/harness@1.0.1 upgrade --target . --yes --with-scripts --pm pnpm
pnpm install
pnpm harness:verify --task docs/tasks/active/task_xxx.md
```

---

## 新增命令

| 命令 | 用途 |
| --- | --- |
| `npx @cyning/harness gate-check` | 业务仓人工闸（透传 `wizard/gate-check.sh`） |
| `npx @cyning/harness verify` | 30 前聚合：gate-check + audit D5 + S5 warn + 可选 `--graph` |
| `npx @cyning/harness sync index` | 生成 `.cyning-harness/invoke_index.json` |
| `npx @cyning/harness --version` / `-V` | 显示当前包版本 |

## 新增 flag

| flag | 命令 | 说明 |
| --- | --- | --- |
| `--with-scripts` | `init` · `upgrade` | 写入 `devDependencies['@cyning/harness']` 与三 scripts |
| `--pm pnpm\|npm\|yarn\|auto` | `init` · `upgrade` | 仅用于提示与文档；scripts 值统一调用 `node_modules/.bin/harness` |

---

## 主要变更文件

- `lib/paths.js`：`resolveHarnessRootForTarget`
- `lib/audit.js`：使用统一根解析
- `lib/verify.js`：新增
- `lib/package-scripts.js`：新增
- `lib/cli.js`：子命令路由 + help/version
- `wizard/install.sh` · `wizard/upgrade.sh`：写 `QUICKREF.md`
- `harness/templates/QUICKREF_v1_zh.md`：新增
- `docs/USER_GUIDE_v1.0_zh.md` · `README.md` · `docs/ONBOARDING.md` · `wizard/README.md`
- IDE 片段：AGENTS / CLAUDE / Cursor

---

## 非范围

- `.cyning-harness/bin` stub 全套（方案 B）→ backlog
- 改 compliance-bench S1–S4 语义
- init 时自动 `pnpm install`
- 自动写 shell alias（~/.zshrc）

---

## HG-RELEASE

- [ ] git tag `v1.0.1`
- [ ] npm publish `@cyning/harness@1.0.1`
- [ ] 可选 GitHub Release v1.0.1

由维护者执行。
