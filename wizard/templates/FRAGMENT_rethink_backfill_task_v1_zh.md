# FRAGMENT · 思考轮结论回填 task（mandatory）

> 嵌入 `docs/harness/invokes/by-task/<slug>/PROMPT_kimi_agent_rethink_*.md` 与 `docs/tasks/TASK_TEMPLATE_upstream_pr_v1.md` §4。

## 问题

Agent 仅在聊天输出 `## R1 结论` **不算完成**；须 task §4 真值 + **思考轮控制** 表，22 才能审、维护者才能签 `HG-AUDIT-R1`。

## 回填协议（Agent 必执行）

### 允许修改（仅此）

| 路径 | 操作 |
|------|------|
| `<meta-worktree>/docs/tasks/active/<task>.md`（或 `done/`） | 写入 §4 各轮 **回填区** + **思考轮控制** |
| `docs/harness/invokes/by-task/<slug>/invoke_*_rethink_*.md` | 可选：思考快照 |

双 worktree 时 Open Folder 在产品仓，task 路径示例：`@../your-fork-meta/docs/tasks/active/...`

### 禁止

- 产品仓 `packages/**`、`apps/**` 等源码
- `git commit` / `git push`

### 步骤

1. 完成 R0～Rn 思考（默认槽位 **R0 + R1–R5**；可提前停或增 R6+，见下）。
2. 填写 **思考轮控制**：`actual_last_round` · `early_stop` · `early_stop_reason` · `residual_risks`。
3. **编辑 task 文件** §4，将各 `**回填区：**` 下 `（待填）` 替换为结论；**跳过轮**写 `（跳过 · 见思考轮控制）`。
4. 回复末尾输出 **回填自检表** + `回填完成 · 未 commit · 未改产品代码`。
5. 无法写文件时：输出 `## BACKFILL_PACK` 供维护者粘贴。

## 提前停止 / 增轮

| 情况 | 必填 |
|------|------|
| **提前停止**（如 R3 已收敛） | `early_stop=yes` · reason · `residual_risks`（无则 `none`）· 未执行轮回填区写「跳过」 |
| **增 R6+** | 追加 `### R6 · …` + **扩展理由**；更新 `actual_last_round` |

**22 审查**：reason 不充分或 residual 未落入 §3/§5 → **退回 10 帽** 补思考。

## task §4 标记

`### Rk` → `**回填区：**` → ` ```text ` 内为 `（待填）`、结论正文或 `（跳过 · 见思考轮控制）`。
