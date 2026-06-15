# wizard · 安装与同步

> **v0.3.0+**：**npx 优先** · `npx @cyning/harness init|upgrade|check` · manifest.json  
> **v0.2.0+**：脚本化接入 · `--ide cursor,claude,agents` · OSS fork worktree · 上游 issue 扫描

---

## 0. npx CLI（v0.3+ · 推荐）

```bash
# 首次（业务仓根）
npx @cyning/harness@latest init --preset harness-only --ide cursor,agents

# 升级（等价 ./wizard/upgrade.sh --yes）
npx @cyning/harness upgrade
npx @cyning/harness upgrade --target /path/to/project --yes --force

# 仅检查版本
npx @cyning/harness check
```

- 内部单源：`wizard/install.sh` → `harness-sync.sh apply`（S2 写路径不变）
- manifest schema：[`schema/manifest.v1.schema.json`](../schema/manifest.v1.schema.json)
- 本地开发：`node bin/harness.js init --target /path/to/project --preset harness-only --ide cursor,agents --yes`

---

## 1. 首次接入

```bash
cd /path/to/your-project
/path/to/cyning-harness/wizard/install.sh --preset ios-cursor

# D3 IDE 勾选（v0.2+）
/path/to/cyning-harness/wizard/install.sh --preset harness-only --ide cursor,claude,agents
```

| preset | 用途 |
|--------|------|
| `harness-only` | **交互默认 1** · 仅过程轨 + IDE（kimi-code-meta 等） |
| `fullstack-node-py` | **交互 2** · Ink 类全栈五轨 + quality + pytest |
| `ios-cursor` | 遗留 · ios_buy；**不在 install 交互菜单** |
| `oss-fork-meta` | OSS fork `cyning/meta`；用 `bootstrap-oss-fork-meta.sh` 或 `--preset` |

### 1.1 OSS 个人 fork 一键初始化（阶段 A+B 骨架）

```bash
git clone git@github.com:YOU/some-oss-fork.git
cd some-oss-fork
git remote add upstream git@github.com:ORG/original.git  # 若无

CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh"

# 可选：复用某次试点快照（见 examples/oss-fork/README.md）
# --stub-dir "$CYNING_HARNESS/examples/oss-fork/kimi-code"

git add -A && git commit -m "chore(harness): cyning/meta bootstrap"
git push -u origin cyning/meta

# 推荐：过程轨只读 worktree（与 feature 产品分支并行）
git worktree add ../some-oss-fork-meta cyning/meta
```

**默认**：仅通用 `graph/templates` + 删 `10_flow_MAIN*`；**不**内置任何上游项目图谱。  
**脚本不做**：`01_struct` 核对、`HG-GRAPH-MODULES` 人签、向上游 PR harness 文件。

**双分支纪律**：见 [`examples/oss-fork/README.md`](../examples/oss-fork/README.md)（勿 merge `cyning/meta` → `main`）。

生成：

- `.cyning-harness/profile.json` — 同步轨道配置
- `.cyning-harness/local.json` — 产品包路径
- `docs/tasks/active/` + `docs/tasks/done/`（**v0.2.1+** 含 `done/<domain>/` · Hub · `_views` 薄指针，见 `install.sh`）
- `docs/harness/FRAGMENT_rethink_backfill_task_v1_zh.md`

---

## 2. 拉取产品包后 · 升级到已用项目（常用）

**推荐 · 交互向导**（在产品包目录运行，按提示输入业务仓路径）：

```bash
cd /path/to/cyning-harness && git pull
./wizard/upgrade.sh
```

非交互：

```bash
./wizard/upgrade.sh --target /path/to/kimi-code-meta --yes
./wizard/upgrade.sh --target /path/to/ios_buy --ide cursor,claude,agents --yes --gate-check
```

**禁止**对产品包自身 `apply`（误操作会被 `refuse_if_product_root` 拦截）。

### 2.1 清空纪律层 · 重新安装

交互清空（保留业务 `docs/tasks` · `reviews` · `invokes/by-task`）：

```bash
cd /path/to/cyning-harness
./wizard/uninstall.sh
```

非交互：

```bash
./wizard/uninstall.sh --target /path/to/kimi-code-meta --yes
./wizard/uninstall.sh --target /path/to/project --yes --with-ci --with-install-artifacts
./wizard/uninstall.sh --target /path/to/project --dry-run   # 仅预览
```

清空后：

```bash
./wizard/install.sh --target /path/to/project --preset harness-only --ide cursor,claude,agents
```

手动分步（与向导等价）：

```bash
cd /path/to/cyning-harness && git pull

cd /path/to/ios_buy   # 业务仓
CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/harness-sync.sh" plan

CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/harness-sync.sh" apply
```

**默认同步**（不洗业务数据）：

- `docs/harness/prompts/*.md`
- `docs/harness/invokes/TEMPLATE_invoke.md`
- `.cursor/rules/06-harness-pointer.mdc`（路径见 profile）
- `CLAUDE.md` / `AGENTS.md`（`ide_claude` / `ide_agents` 启用时 · marker merge）

**不覆盖**：`docs/tasks/`、`docs/harness/reviews/`、`invokes/by-task/*`、已填 `01_struct.md`。

强制重拷图谱/wiki（慎用）：

```bash
FORCE_TRACKS=1 "$CYNING_HARNESS/wizard/harness-sync.sh" apply --target /path/to/project
```

---

## 3. 人工闸检查（30 前）

```bash
"$CYNING_HARNESS/wizard/gate-check.sh" --target /path/to/project
# OSS fork meta worktree 时：--target /path/to/fork-meta
```

- `HG-AUDIT-R1` 非 `approved` → 退出码 2 · **30 不可开工**
- 辅助维护者，**不替代** Agent 闸扫描表

---

## 4. 上游 Issue 扫描（无 Agent · v0.1.2+）

依赖：`gh`（已登录）· `jq` · **任意** `OWNER/REPO`

```bash
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --help

# C2 候选（排除已占坑 #565/#566）
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --preset kimi-c2-candidate

# C3 候选（再排除 #583 · v0.1.3）
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --preset kimi-c3-candidate

# 任意上游仓
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" \
  --repo OWNER/REPO --state open --label bug --check-pr --limit 20

# 落盘 Markdown
"$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --preset kimi-c3-candidate \
  --format markdown --output /tmp/issue-scan.md
```

| 参数 | 说明 |
|------|------|
| `--preset` | `profiles/issue-scan-presets.json` |
| `--repo` | `OWNER/NAME` |
| `--label` | 可重复 |
| `--check-pr` / `--no-check-pr` | PR 占坑（逐条 gh，较慢） |
| `--only-no-pr` | 仅无 **open** PR 的 issue |
| `--exclude-issues` | `565,566` |
| `--format` | `table` · **`text`**（同 table）· `markdown` · `json` |

自定义 preset：编辑 `wizard/profiles/issue-scan-presets.json`。

---

## 5. 与 ECC install-manifest（B2）的关系

| ECC | cyning-harness |
|-----|----------------|
| `install-plan.js` | `harness-sync.sh plan` |
| `install-apply.js` | `harness-sync.sh apply` |
| npm 全局包 | 本地 clone + profile.json |
| 261 skills 选择性装 | **五轨勾选** + 默认只升 harness 纪律层 |

脚本解决 **「产品包更新 → 已接入仓同步」**；**不解决**人签 `HG-AUDIT-R1`（须维护者改 task 表）。

---

## 6. 文档问卷

交互问卷仍见 [`ONBOARDING_wizard_v1_zh.md`](./ONBOARDING_wizard_v1_zh.md)；**推荐以本目录脚本为准**。
