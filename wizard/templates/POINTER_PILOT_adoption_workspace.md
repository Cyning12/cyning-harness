# POINTER · Harness 试点（工作区真值）

| 项 | 内容 |
|----|------|
| **性质** | 个人 fork · **`cyning/meta` 分支** 过程轨 |
| **勿 PR 上游** | `docs/harness/`、`docs/tasks/`、`.cyning-harness/`、`.cursor/rules/06-*` |

## 初始化脚本

`cyning-harness/wizard/bootstrap-oss-fork-meta.sh`

## 分支

- 过程开发：`cyning/meta`（push 仅到 **你的 fork**）
- 上游 PR：仅从干净 `main` → `feature/*`，**仅产品 diff**

## worktree（v0.1.2）

```bash
git worktree add ../<fork>-meta cyning/meta
```

产品改码 Open `<fork>/`；task / invoke / 图谱 `@` `<fork>-meta/`。详见 `cyning-harness/examples/oss-fork/README.md`。
