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

预设定义：`wizard/profiles/issue-scan-presets.json`（可自行追加 preset）。

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
