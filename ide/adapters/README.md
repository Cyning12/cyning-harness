# ide/adapters

**单源 POINTER**：真值在 `docs/coding_wiki/` + `docs/standards/` + `AGENTS.md`；本目录仅 **IDE 入口片段**。

## v0.2 已交付（D3 · M2 补完）

| 文件 | 状态 | 勾选 IDE | 嵌入路径 |
|------|------|----------|----------|
| [`cursor-harness-starter.mdc.example`](./cursor-harness-starter.mdc.example) | ✅ | **Cursor**（默认推荐） | `.cursor/rules/05-harness-starter.mdc` |
| [`CLAUDE.md.fragment.example`](./CLAUDE.md.fragment.example) | ✅ | **Claude Code** | 仓根 `CLAUDE.md`（marker merge） |
| [`AGENTS.md.fragment.example`](./AGENTS.md.fragment.example) | ✅ | **通用 Agent** | 仓根 `AGENTS.md`（marker merge） |

## 安装勾选

```bash
# 三类 IDE 一次勾选（dry-run 预览）
/path/to/cyning-harness/wizard/install.sh \
  --preset harness-only \
  --ide cursor,claude,agents \
  --dry-run --target /path/to/project

# 实装
/path/to/cyning-harness/wizard/install.sh \
  --preset harness-only --ide cursor,claude,agents
```

profile 字段：`tracks.ide_cursor` · `tracks.ide_claude` · `tracks.ide_agents`（缺省：cursor=true，其余 false）。

## marker merge 纪律（D3）

- 块标记：`<!-- cyning-harness:begin -->` … `<!-- cyning-harness:end -->`
- **不覆盖**用户仓已有 `CLAUDE.md` / `AGENTS.md` 全文；块外手写保持不变
- 由 [`wizard/install.sh`](../install.sh) + [`harness-sync.sh`](../harness-sync.sh) 执行

## 手工嵌入（备查）

```bash
mkdir -p .cursor/rules
cp cyning-harness/ide/adapters/cursor-harness-starter.mdc.example .cursor/rules/05-harness-starter.mdc
```

## 纪律（D3）

- **多入口仅 POINTER** — 不在各 IDE 文件重复 L1/L2 全文
- 过程轨（task、invoke、CI）**与 IDE 无关**
- 向导 **默认不全选** IDE；按实际编辑器勾选
