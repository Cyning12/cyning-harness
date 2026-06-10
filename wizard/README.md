# wizard · 安装与同步

> **v0.1.1+**：脚本化接入与 **已接入仓升级**（替代纯手工 `cp` 清单）

---

## 1. 首次接入

```bash
cd /path/to/your-project
/path/to/cyning-harness/wizard/install.sh --preset ios-cursor
```

| preset | 用途 |
|--------|------|
| `harness-only` | 仅 prompts + Cursor 规则（最小） |
| `ios-cursor` | iOS S2 五轨 · 无 Node CI |
| `fullstack-node-py` | 全栈 + quality + pytest |
| `oss-fork-meta` | OSS 个人 fork · `cyning/meta`：harness + 图谱骨架 |

### 1.1 OSS 个人 fork 一键初始化（阶段 A+B 骨架）

```bash
git clone git@github.com:YOU/some-oss-fork.git
cd some-oss-fork
git remote add upstream git@github.com:ORG/original.git  # 若无

CYNING_HARNESS=/path/to/cyning-harness \
  "$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh" \
  --archetype generic    # 或 kimi-code（预填 Moonshot kimi-code 模块表）

git add -A && git commit -m "chore(harness): cyning/meta bootstrap"
git push -u origin cyning/meta
```

**脚本不做**：`01_struct` 核对（generic）、`HG-GRAPH-MODULES` 人签、向上游 PR harness 文件。

生成：

- `.cyning-harness/profile.json` — 同步轨道配置
- `.cyning-harness/local.json` — 产品包路径

---

## 2. 拉取产品包后 · 升级到已用项目（常用）

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

**不覆盖**：`docs/tasks/`、`docs/harness/reviews/`、`invokes/by-task/*`、已填 `01_struct.md`。

强制重拷图谱/wiki（慎用）：

```bash
FORCE_TRACKS=1 "$CYNING_HARNESS/wizard/harness-sync.sh" apply --target /path/to/project
```

---

## 3. 人工闸检查（30 前）

```bash
"$CYNING_HARNESS/wizard/gate-check.sh" --target /path/to/project
```

- `HG-AUDIT-R1` 非 `approved` → 退出码 2 · **30 不可开工**
- 辅助维护者，**不替代** Agent 闸扫描表

---

## 4. 与 ECC install-manifest（B2）的关系

| ECC | cyning-harness |
|-----|----------------|
| `install-plan.js` | `harness-sync.sh plan` |
| `install-apply.js` | `harness-sync.sh apply` |
| npm 全局包 | 本地 clone + profile.json |
| 261 skills 选择性装 | **五轨勾选** + 默认只升 harness 纪律层 |

脚本解决 **「产品包更新 → 已接入仓同步」**；**不解决**人签 `HG-AUDIT-R1`（须维护者改 task 表）。

---

## 5. 文档问卷

交互问卷仍见 [`ONBOARDING_wizard_v1_zh.md`](./ONBOARDING_wizard_v1_zh.md)；**推荐以本目录脚本为准**。
