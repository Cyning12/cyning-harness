# SPEC：wiki export 说明性伪链降噪（v1）

| 项 | 内容 |
|----|------|
| **状态** | `signed` · 维护者同会话授权（2.21.0 回填） |
| **日期** | 2026-07-28 |
| **建议版本** | **v2.21.0** |
| **来源** | F-218-07 · web/ops 2.20 dogfood（叙述伪链 → WARN 噪音） |

## 1. 目标

未解析的双括号链若为**说明性占位名**，不进入 `warnings`；真缺页仍 WARN。不改变已解析边。

## 2. 规则

占位名（大小写不敏感，可带 `.md`）：`wikilink` · `page` · `name` · `link` · `title` · `placeholder` · `example` · `foo` · `bar` · `baz` · 纯省略号 `…` / `...`。

输出增加可选计数 `skipped_illustrative`（整数 ≥0）。

## 3. 非范围

不静默吞掉真实缺页；不改 schema 名；不做 UI。

## 4. 验收

- 文档含 `[[wikilink]]` 且无对应页 → warnings 不含该条；`skipped_illustrative≥1`
- 缺真实页 `[[missing_real_page_xyz]]` → 仍 WARN
