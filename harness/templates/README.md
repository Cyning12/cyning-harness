# harness/templates

复制到用户仓 **`docs/tasks/`** 或 **`docs/harness/tasks/active/`**（按仓约定）。

## v0.1 已交付（T3 · M2）

| 模板 | 状态 | 说明 |
|------|------|------|
| [`TASK_TEMPLATE.md`](./TASK_TEMPLATE.md) | ✅ | 单 task · Harness 元信息 · human_gate |
| [`TASK_epic.md`](./TASK_epic.md) | ✅ | Epic 总纲 + §3.1 编排主表 + 00 入口 |
| [`TASK_graph_bootstrap.md`](./TASK_graph_bootstrap.md) | ✅ | D4-a · **`HG-GRAPH-MODULES`** blocks **30** |

## 嵌入步骤

```bash
mkdir -p docs/tasks/active docs/harness/reviews docs/harness/invokes/by-task
cp harness/templates/TASK_TEMPLATE.md docs/tasks/active/task_<slug>.md
# 存量首次：优先 TASK_graph_bootstrap.md
```

## 关联

- 图谱模板：[`graph/templates/`](../../graph/templates/README.md)
- ONBOARDING：[`docs/ONBOARDING.md`](../../docs/ONBOARDING.md) §3
