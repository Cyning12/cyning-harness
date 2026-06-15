# Push 前审计 · A3 v0.4.0（§5.1）

| 项 | 值 |
| --- | --- |
| **日期** | 2026-06-15 |
| **执行** | 30 A3 Agent |
| **分支** | `task/cyning-harness-a3-push` |
| **基准** | STRATEGY_ONTOLOGY §5.1 · ROADMAP §2.1 A3 |

---

## §5.1 清单

| # | 检查项 | 结果 | 动作 / 证据 |
| --- | --- | --- | --- |
| 1 | **密钥 / 令牌** | ✅ pass | `rg -i 'API_KEY\|password\|git@\|token\|secret'` 无真实泄露 · 仅文档占位 |
| 2 | **内部路径** | ✅ pass | 无 `/Users/cyning/` · `kimi-code-meta` 绝对路径 · `golden/` 已 POINTER 化 |
| 3 | **私有 POINTER** | ✅ pass | `golden/` 仅摘要 + 公开 PR 链 · 无 invoke 全文 |
| 4 | **试点脱敏** | ✅ pass | `examples/oss-fork/` 无凭据 · 工作区路径改通用表述 |
| 5 | **工作区耦合** | ✅ pass | README 无私有 workspace 硬链 · STRATEGY 为 POINTER |
| 6 | **License** | ✅ pass | 根目录 [`LICENSE`](../LICENSE) MIT |
| 7 | **npm 包名** | ✅ pass | `package.json` → `@cyning/harness` |
| 8 | **安装自测** | ✅ pass | 空目录 `node bin/harness.js init --yes` · manifest 写入（见 30 invoke） |

---

## 复检命令（维护者 CLOSE 前复跑）

```bash
cd cyning-harness
npm test
rg -n '/Users/cyning|kimi-code-meta|cyning-ink-workspace|Desktop/Projects' . \
  --glob '!node_modules' --glob '!_sandbox' --glob '!.git'
npm pack --dry-run | head -30
```

---

## 不进 public 树（§5.3 确认）

- 工作区 `docs/harness/prompts` 全量帽
- invoke/review 正文 bulk
- `examples/demo_checkout/_sandbox/`（`.gitignore` + npm files 排除）
- 维护者个人 fork 元数据

---

## 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-06-15 | A3 30 首版审计表 |
