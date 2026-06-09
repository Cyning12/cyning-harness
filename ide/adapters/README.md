# ide/adapters

**单源 POINTER**：真值在 `docs/coding_wiki/` + `docs/standards/` + `AGENTS.md`；本目录仅 **IDE 入口片段**。

## v0.1 已交付（T5 · M2）

| 文件 | 状态 | 勾选 IDE | 嵌入路径 |
|------|------|----------|----------|
| [`cursor-harness-starter.mdc.example`](./cursor-harness-starter.mdc.example) | ✅ | **Cursor**（默认推荐） | `.cursor/rules/05-harness-starter.mdc` |

## 规划（v0.2+）

| 勾选 | 输出 | 状态 |
|------|------|------|
| Claude Code | `CLAUDE.md.fragment` | 待补 |
| 通用 Agent | `AGENTS.md.fragment` | 待补 |

由 [`wizard/ONBOARDING_wizard_v1_zh.md`](../wizard/ONBOARDING_wizard_v1_zh.md) 步骤 3 合并写入用户仓。

## 嵌入命令

```bash
mkdir -p .cursor/rules
cp cyning-harness/ide/adapters/cursor-harness-starter.mdc.example .cursor/rules/05-harness-starter.mdc
```

## 纪律（D3）

- **多入口仅 POINTER** — 不在各 IDE 文件重复 L1/L2 全文
- 过程轨（task、invoke、CI）**与 IDE 无关**
- 向导 **默认不全选** IDE；按实际编辑器勾选
