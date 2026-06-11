# FRAGMENT · 思考轮结论回填 task（mandatory）

> 嵌入 `docs/harness/invokes/by-task/<slug>/PROMPT_kimi_agent_rethink_*.md` 与 `docs/tasks/TASK_TEMPLATE_upstream_pr_v1.md` §4。

## 问题

Agent 仅在聊天输出 `## R1 结论` **不算完成**；须 task §4 真值才能签 `HG-AUDIT-R1`。

## 回填协议（Agent 必执行）

### 允许修改（仅此）

| 路径 | 操作 |
|------|------|
| `<meta-worktree>/docs/tasks/active/<task>.md`（或 `done/`） | 写入 §4 **回填区** |
| `docs/harness/invokes/by-task/<slug>/invoke_*_rethink_*.md` | 可选：思考快照 |

双 worktree 时 Open Folder 在产品仓，task 路径示例：`@../your-fork-meta/docs/tasks/active/...`

### 禁止

- 产品仓 `packages/**`、`apps/**` 等源码
- `git commit` / `git push`

### 步骤

1. 完成 R0～Rn 思考。
2. **编辑 task 文件** §4，将各 `**回填区：**` 下 `（待填）` 替换为结论（保留 ` ```text ` 围栏）。
3. 回复末尾输出 **回填自检表** + `回填完成 · 未 commit · 未改产品代码`。
4. 无法写文件时：输出 `## BACKFILL_PACK` 供维护者粘贴。

## task §4 标记

`### Rk` → `**回填区：**` → ` ```text ` 内 `（待填）` 或结论正文。
