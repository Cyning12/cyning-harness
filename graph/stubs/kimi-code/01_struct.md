# 模块边界登记表（kimi-code monorepo · L0-b）

> **试点**：个人 fork · `cyning/meta` · 不 PR 上游。  
> **人签**：`HG-GRAPH-MODULES` approved 后，业务 task 方可 **30** 改码。  
> **真值来源**：[`AGENTS.md`](../../AGENTS.md) Project Map（2026-06-10 起草）。

## 模块表

| module_id | 名称 | 路径 glob | 依赖方向（出边） | 备注 |
|-----------|------|-----------|------------------|------|
| `cli` | CLI / TUI 应用 | `apps/kimi-code/**` | → `node_sdk` | **禁止**直接依赖 `agent_core` |
| `vis` | Session 可视化 | `apps/vis/**` | → `node_sdk`, `agent_core` | vis/server · vis/web |
| `node_sdk` | 公开 TS SDK | `packages/node-sdk/**` | → `agent_core` | 对外 harness 入口 |
| `agent_core` | Agent 引擎 | `packages/agent-core/**` | → `kosong`, `kaos`, `oauth`, `telemetry` | Session · tools · skills |
| `kosong` | LLM / Provider 抽象 | `packages/kosong/**` | — | 被 `agent_core` 依赖 |
| `kaos` | 执行环境 | `packages/kaos/**` | — | 文件 / 进程抽象 |
| `oauth` | OAuth / 鉴权 | `packages/oauth/**` | — | |
| `telemetry` | 客户端遥测 | `packages/telemetry/**` | — | |
| `acp_adapter` | ACP 适配 | `packages/acp-adapter/**` | → `node_sdk` | IDE 集成 |
| `migration_legacy` | 旧版迁移 | `packages/migration-legacy/**` | → `agent_core` | kimi-cli 迁移 |
| `monorepo_root` | 构建 / CI / Nix | `build/**`, `scripts/**`, `flake.nix` | — | 与 `pnpm-workspace.yaml` 同步维护 |

## 跨模块契约（摘要）

| 契约 | 提供方 | 消费方 | 说明 |
|------|--------|--------|------|
| `@moonshot-ai/kimi-code-sdk` | `node_sdk` | `cli`, `acp_adapter` | CLI 须经 SDK 访问引擎 |
| `Agent` / `Session` API | `agent_core` | `node_sdk` | 公开面由 SDK 封装 |

## 人签记录

| human_gate_id | status | 签核人 | 日期 | 说明 |
|---------------|--------|--------|------|------|
| HG-GRAPH-MODULES | pending | | | 维护者核对上表后改 approved |

## 关联

- [`00_main.md`](./00_main.md) · [`00_main.ai.md`](./00_main.ai.md)
- 待补 flow：见 `00_main` §待补 flow 清单
