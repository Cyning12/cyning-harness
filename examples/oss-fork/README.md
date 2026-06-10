# examples/oss-fork（非产品默认 · 参考样例）

> **不在** `bootstrap-oss-fork-meta.sh` 默认路径中。各 OSS 项目的图谱真值应在 **该 fork 的 `cyning/meta` 分支** 或本工作区试点文档中维护。

## 用法

```bash
# 仅当需要复用某次试点已填图谱时，显式指定 stub 目录：
CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh" \
  --stub-dir "$CYNING_HARNESS/examples/oss-fork/kimi-code"
```

## 目录

| 子目录 | 说明 |
|--------|------|
| [`kimi-code/`](./kimi-code/) | Moonshot kimi-code 试点快照（2026-06-10）；**非**通用模板 |

新项目默认：**不加 `--stub-dir`** → 仅 harness 通用 `graph/templates/` + 人工填 `01_struct`。
