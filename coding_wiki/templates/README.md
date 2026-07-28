# coding_wiki · LLM 读序

复制本目录文件到用户仓 **`docs/coding_wiki/`**。

| 文件 | 层 | 说明 |
|------|-----|------|
| [`stable.md`](stable.md) | stable | 短摘要 · 规范十二条 · IDE 规则指针 |
| [`context.md`](context.md) | context | L2、PROJECT_CONFIG 类指针 |
| [`volatile.md`](volatile.md) | volatile | 本 task 必读（由 task 引用） |

invoke §3 应 **pointer** 到本目录，勿重复贴长文。

## 关账与晋升（v2.18+）

1. task 元信息填 **`wiki_delta`**：改了哪份 wiki / `none`+理由 / `n/a`（未启用 WikiTrack）。  
2. **`experience_capture=required` 且 `wiki_delta=path`**：经验节须含晋升指针（`Wiki:` / `wiki_promoted:` / `coding_wiki` 路径）。  
3. volatile：关账后归档要点或清空，避免 stale；可复用条目上移 **context** / **stable**。  
4. 导出关系图（供 Web/Obsidian 对照，本包不渲染）：

```bash
npx @cyning/harness wiki export --json [--root docs/coding_wiki]
```

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 关账晋升 + wiki export 指针 |