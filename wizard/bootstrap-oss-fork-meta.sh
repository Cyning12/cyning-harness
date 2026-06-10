#!/usr/bin/env bash
# OSS 个人 fork · cyning/meta 一键初始化（阶段 A+B 骨架）
# 不替代：01_struct 核对、HG-GRAPH-MODULES 人签、上游 PR 纪律
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$(pwd)"
BRANCH="cyning/meta"
ARCHETYPE="generic"
DRY_RUN=0
SKIP_BRANCH=0

usage() {
  cat <<'EOF'
用法:

  cd /path/to/your-fork
  CYNING_HARNESS=/path/to/cyning-harness \
    "$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh"

  "$CYNING_HARNESS/wizard/bootstrap-oss-fork-meta.sh" \
    --target /path/to/fork \
    --branch cyning/meta \
    --archetype generic|kimi-code \
    --skip-branch \
    --dry-run

步骤（自动化）:
  1. 检出/创建 cyning/meta（可 --skip-branch 跳过）
  2. preset oss-fork-meta：harness prompts + 图谱模板 + Cursor pointer
  3. docs/tasks · POINTER · bootstrap task 草稿
  4. --archetype kimi-code 时覆盖 kimi 预填图谱 stub

仍需人工:
  - 核对并签 HG-GRAPH-MODULES（generic 须先改 01_struct）
  - cyning/meta 仅 push 到你的 fork；上游 PR 仅 feature/* 产品 diff
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --archetype) ARCHETYPE="$2"; shift 2 ;;
    --skip-branch) SKIP_BRANCH=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"
PRESET_FILE="$SCRIPT_DIR/profiles/oss-fork-meta.json"

[[ -d "$TARGET/.git" ]] || { echo "错误: $TARGET 不是 git 仓根" >&2; exit 1; }
[[ -f "$PRESET_FILE" ]] || { echo "错误: 缺少 preset $PRESET_FILE" >&2; exit 1; }

run() {
  if [[ "$DRY_RUN" == "1" ]]; then echo "[dry-run] $*"; else eval "$@"; fi
}

slug_from_path() {
  basename "$TARGET" | tr '[:upper:]' '[:lower:]' | tr '-' '_'
}

echo "=== bootstrap-oss-fork-meta ==="
echo "目标: $TARGET"
echo "分支: $BRANCH (skip=$SKIP_BRANCH)"
echo "archetype: $ARCHETYPE"
echo ""

if [[ "$SKIP_BRANCH" == "0" ]]; then
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] git checkout $BRANCH || git checkout -b $BRANCH"
  else
    cd "$TARGET"
    git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
  fi
fi

run mkdir -p "$TARGET/.cyning-harness"
run mkdir -p "$TARGET/docs/tasks/active" "$TARGET/docs/tasks/done"
run mkdir -p "$TARGET/docs/harness/reviews" "$TARGET/docs/harness/invokes/by-task"
run mkdir -p "$TARGET/docs/_tech_graph"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] cp preset + local.json"
else
  cp "$PRESET_FILE" "$TARGET/.cyning-harness/profile.json"
  printf '%s\n' "{\"cyning_harness_root\":\"$CYNING_HARNESS\"}" > "$TARGET/.cyning-harness/local.json"
fi

export CYNING_HARNESS TARGET FORCE_TRACKS=1
if [[ "$DRY_RUN" == "1" ]]; then
  "$SCRIPT_DIR/harness-sync.sh" plan --target "$TARGET"
else
  "$SCRIPT_DIR/harness-sync.sh" apply --target "$TARGET"
fi

# POINTER
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] cp POINTER -> docs/harness/"
else
  cp "$SCRIPT_DIR/templates/POINTER_PILOT_adoption_workspace.md" \
    "$TARGET/docs/harness/POINTER_PILOT_adoption_workspace_v1_zh.md"
fi

# harness README
if [[ "$DRY_RUN" != "1" ]]; then
  cat >"$TARGET/docs/harness/README.md" <<'EOF'
# docs/harness（个人 fork · 过程轨）

勿 PR 上游。由 `bootstrap-oss-fork-meta.sh` 初始化。
EOF
  cat >"$TARGET/docs/tasks/README.md" <<'EOF'
# docs/tasks

Harness task · `active/` 进行中 · `done/` 关账。
EOF
fi

# bootstrap task
SLUG="$(slug_from_path)"
TASK_FILE="$TARGET/docs/tasks/active/task_graph_bootstrap_${SLUG}_v1.md"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] task -> $TASK_FILE"
else
  sed "s/__REPO_SLUG__/${SLUG}/g" "$SCRIPT_DIR/templates/task_graph_bootstrap_v1.md" >"$TASK_FILE"
fi

# archetype stubs
STUB_DIR="$HARNESS_ROOT/graph/stubs/${ARCHETYPE}"
if [[ -d "$STUB_DIR" ]]; then
  echo "应用图谱 stub: $ARCHETYPE"
  for f in "$STUB_DIR"/*; do
    [[ -f "$f" ]] || continue
    dst="$TARGET/docs/_tech_graph/$(basename "$f")"
    if [[ "$DRY_RUN" == "1" ]]; then
      echo "[dry-run] cp $f -> $dst"
    else
      cp "$f" "$dst"
    fi
  done
else
  if [[ "$ARCHETYPE" != "generic" ]]; then
    echo "警告: 无 stub 目录 $STUB_DIR，保留 harness 通用模板" >&2
  fi
fi

# harness 通用 HTTP 示例 flow · 非 OSS fork / CLI 仓主路径 · 不保留
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] rm -f docs/_tech_graph/10_flow_MAIN.md docs/_tech_graph/10_flow_MAIN.ai.md"
else
  rm -f "$TARGET/docs/_tech_graph/10_flow_MAIN.md" "$TARGET/docs/_tech_graph/10_flow_MAIN.ai.md"
fi

echo ""
echo "=== 完成（骨架）==="
echo "1. 打开 docs/_tech_graph/01_struct.md — generic 须对照 AGENTS.md 填写"
echo "2. 签 task: docs/tasks/active/task_graph_bootstrap_${SLUG}_v1.md → HG-GRAPH-MODULES approved"
echo "3. 检查: $CYNING_HARNESS/wizard/gate-check.sh --target $TARGET"
echo "4. git add + commit + git push -u origin $BRANCH  # 仅你的 fork"
echo "5. 上游 PR：仅从 main 拉 feature/*，不含 docs/harness"
