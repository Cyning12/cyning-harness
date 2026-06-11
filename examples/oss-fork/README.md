# examples/oss-fork（非产品默认 · 参考样例）

> **不在** `bootstrap-oss-fork-meta.sh` 默认路径中。各 OSS 项目的图谱活真值应在 **该 fork 的 `cyning/meta` 分支** 或工作区试点文档中维护。

---

## 1. 双分支 + worktree（推荐 · v0.1.2）

OSS 个人 fork 贡献上游时，**过程轨与产品 PR 分离**：

```text
upstream/main  ──►  本地 main（跟踪官方，保持干净）
                      │
                      └── feature/fix-*  ──► PR → 上游（仅产品 diff）

cyning/meta    ──►  过程轨（task · invoke · _tech_graph · harness）
                      └── 只 push 到你的 fork，不 PR 上游
```

**改码 Open Folder** 在 `feature/*`；**task / 图谱 / invoke** 在 `cyning/meta`。  
不要在 `feature` 上 commit harness 文件；不要 `merge cyning/meta` → `main`。

### worktree 示例

```bash
cd /path/to/your-fork
git worktree add ../your-fork-meta cyning/meta
```

| 路径 | 分支 | 用途 |
|------|------|------|
| `your-fork/` | `feature/fix-*` 或 `main` | 改产品、开上游 PR |
| `your-fork-meta/` | `cyning/meta` | task、签闸、invoke；Cursor `@` harness prompts |

30 会话示例（Open 在产品仓）：

```text
@../your-fork-meta/docs/tasks/active/task_*.md
@../your-fork-meta/docs/harness/prompts/30-execute-code.md
@../your-fork-meta/docs/_tech_graph/01_struct.md   # 按需
```

---

## 2. bootstrap 初始化

```bash
CYNING_HARNESS=/path/to/cyning-harness
cd /path/to/your-fork
git checkout -B cyning/meta   # 或已有 meta

"$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh"

# 可选：复用某次试点已填图谱快照
"$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh" \
  --stub-dir "$CYNING_HARNESS/examples/oss-fork/kimi-code"
```

生成：`docs/tasks/active/` + **`docs/tasks/done/`**、`docs/harness/`、`docs/_tech_graph/` 骨架。

---

## 3. 上游 Issue 选题（通用脚本）

不依赖 Agent；在 **产品包** 目录执行：

```bash
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --help

# 示例 preset（MoonshotAI/kimi-code）
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --preset kimi-c2-candidate

# 任意上游仓
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" \
  --repo OWNER/REPO --state open --label bug --check-pr --limit 20
```

预设定义：`wizard/profiles/issue-scan-presets.json`（`kimi-c2-candidate` · **`kimi-c3-candidate`** 等；可自行追加 preset）。

---

## 4. 目录

| 子目录 | 说明 |
|--------|------|
| [`kimi-code/`](./kimi-code/) | Moonshot kimi-code 试点图谱 **快照**（2026-06-10）；非通用模板 |

新项目默认：**不加 `--stub-dir`** → 仅 harness 通用 `graph/templates/` + 人工填 `01_struct`。

活真值优先：fork 上 `cyning/meta` 的 `docs/_tech_graph/`（worktree `your-fork-meta`）。

---

## 5. 试点文档（工作区）

工作区维护者扫描分级示例：  
`Projects/docs/harness/guides/ISSUE_SCAN_kimi_code_open_c2_v1_zh.md` ·  
`PILOT_kimi_code_fork_adoption_v1_zh.md`

---

## 6. 阶段 C3 工作流（v0.1.3 · 改码前纪律）

选题 → task → 思考轮 → 图谱闸 → 30 改码 → 关账。与 PILOT §5.2 对齐。

### 6.1 开 task

```bash
cp docs/tasks/TASK_TEMPLATE_upstream_pr_v1.md \
  docs/tasks/active/task_fix_<issue>_<short>_v1.md
```

填 Harness 元信息 · `graph_delta` · `human_gate` 表。

### 6.2 思考轮 + 强制回填（默认 R0 + R1–R5）

invoke 内嵌 `docs/harness/FRAGMENT_rethink_backfill_task_v1_zh.md`：

- 10 帽 task 草稿 **预置五槽思考轮** + **思考轮控制** 表（C1–C3 实证：≥4 轮实质思考后方案才稳）
- Agent **必须**将结论写入 task **§4 回填区**；**可提前停**（填 reason + residual_risks）或 **增 R6+**
- 未闭合 §4 → **22 退回 10** · `HG-AUDIT-R1` 不得签 · 30 拒开工

### 6.3 图谱闸（触模块时）

| 时点 | 动作 |
|------|------|
| **30 前** | `10_flow_*.md` skeleton commit（`graph_gate: skeleton_before_30`） |
| **关账** | partial/final flow + `02_version` 增量 |

`graph_delta=none` 须在 task 注明理由。

### 6.4 PR 策略（可选 · 试点 C3 #580）

| 模式 | 何时 |
|------|------|
| 常规 | 验证通过 → 开 upstream PR · `Fixes #issue` |
| **暂缓 PR** | 等 maintainer / 撞车窗口 → 先 issue comment + 本地 `local_done`；到期再开 PR |

过程轨（task / invoke / 图谱）**永不**进 upstream PR diff。
