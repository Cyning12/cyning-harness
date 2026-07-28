# SPEC：upgrade overlay 部分根治（local 块 · graph_modules_path · 提示）

| 项 | 内容 |
|----|------|
| **状态** | `signed` · 维护者会话签收开工 2026-07-28 |
| **建议版本** | **v2.22.0** |
| **来源** | ops-desk-api U2 · 产品评估「部分解决」 |

## 1. 目标

减少「upgrade 后 overlay 被冲须手恢复」：

1. **A**：文档 + 入口 POINTER — 仓内定制写在 `<!-- cyning-harness-local:begin/end -->`（产品 marker **外**）；sync **不**改 local 块。若 local 块误落在产品 marker 内，merge 时 **salvage** 到产品块外。
2. **B**：`profile.json` 可选 `"graph_modules_path"`（默认 `01_struct`）；sync 后替换 FRAGMENT 中 `__HARNESS_GRAPH_MODULES_PATH__`。
3. **E**：apply 结束打印 overlay 自检 hint +（若 git）`diff --stat` 相关路径。

## 2. 非范围

三方合并；`sync.preserve` 跳过整文件；削弱 S2/S5/close/wiki_delta/pre-30；擅自 publish；改 ops 业务仓。

## 3. failure_paths

| 触发 | 行为 |
|------|------|
| 无 `graph_modules_path` | 占位 → `01_struct`（与旧文案等价） |
| 定制仍写在产品 marker 内且无 local 包裹 | 仍被冲；hint 提示迁到 local 块 |
| path 含 sed 特殊字符 | 仅允许相对 path 字符集 `[A-Za-z0-9._/-]`，否则 WARN 跳过替换 |

## 4. 验收

- 无定制仓：upgrade 后行为与 2.21 一致（占位已展开为 `01_struct`）
- 定制仓：local 块关键词保留；`graph_modules_path=l1/01_modules` 时 FRAGMENT 含该串
- `npm test` 绿
