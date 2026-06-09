#!/usr/bin/env bash
# cyning-harness · 首次接入业务仓（生成 profile + 按 preset 复制）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$(pwd)"
PRESET="harness-only"
DRY_RUN=0

usage() {
  cat <<'EOF'
用法:

  cd /path/to/your-project
  /path/to/cyning-harness/wizard/install.sh --preset ios-cursor

  /path/to/cyning-harness/wizard/install.sh --target /path/to/project --preset harness-only

preset:
  harness-only       — 仅 harness prompts + Cursor 规则（升级常用）
  ios-cursor         — iOS 存量 S2 五轨（无 CI yaml）
  fullstack-node-py  — 全栈 + quality + pytest

选项:
  --target PATH   业务仓根（默认当前目录）
  --preset NAME   见 wizard/profiles/
  --dry-run       只打印，不写入
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --preset) PRESET="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"
PRESET_FILE="$SCRIPT_DIR/profiles/${PRESET}.json"

[[ -f "$PRESET_FILE" ]] || { echo "未知 preset: $PRESET" >&2; exit 1; }

run() {
  if [[ "$DRY_RUN" == "1" ]]; then echo "[dry-run] $*"; else eval "$@"; fi
}

echo "=== cyning-harness install ==="
echo "目标: $TARGET"
echo "preset: $PRESET"
echo ""

run mkdir -p "$TARGET/.cyning-harness"
run mkdir -p "$TARGET/docs/tasks/active" "$TARGET/docs/tasks/done"
run mkdir -p "$TARGET/docs/harness/prompts" "$TARGET/docs/harness/reviews" "$TARGET/docs/harness/invokes/by-task"
run mkdir -p "$TARGET/docs/_tech_graph" "$TARGET/docs/coding_wiki" "$TARGET/docs/standards"

if [[ "$DRY_RUN" == "1" ]]; then
  run cp "$PRESET_FILE" "$TARGET/.cyning-harness/profile.json"
else
  cp "$PRESET_FILE" "$TARGET/.cyning-harness/profile.json"
  # 写入 cyning-harness 路径供后续 sync
  printf '%s\n' "{\"cyning_harness_root\":\"$CYNING_HARNESS\"}" > "$TARGET/.cyning-harness/local.json"
fi

# 委托 sync（install 时 force 图谱/wiki）
export CYNING_HARNESS TARGET FORCE_TRACKS=1
if [[ "$DRY_RUN" == "1" ]]; then
  "$SCRIPT_DIR/harness-sync.sh" plan --target "$TARGET"
else
  "$SCRIPT_DIR/harness-sync.sh" apply --target "$TARGET"
fi

# CI
CI_MODE="$(grep '"ci"' "$PRESET_FILE" | sed -E 's/.*:[[:space:]]*"([^"]*)".*/\1/' | head -1)"
if [[ "$CI_MODE" == "both" ]]; then
  run mkdir -p "$TARGET/.github/workflows"
  run cp "$CYNING_HARNESS/ci/samples/quality.yml.example" "$TARGET/.github/workflows/quality.yml"
  run cp "$CYNING_HARNESS/ci/samples/pytest.yml.example" "$TARGET/.github/workflows/pytest.yml"
fi

# standards L1/L2
if grep -q '"standards_l1"[[:space:]]*:[[:space:]]*true' "$PRESET_FILE"; then
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_CODING_BASELINE_L1*.md; do
    [[ -f "$f" ]] || continue
    run cp "$f" "$TARGET/docs/standards/"
  done
fi
if grep -q '"standards_l2"[[:space:]]*:[[:space:]]*true' "$PRESET_FILE"; then
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_CODING_BASELINE_L2*.md; do
    [[ -f "$f" ]] || continue
    run cp "$f" "$TARGET/docs/standards/"
  done
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_SOURCES*.md; do
    [[ -f "$f" ]] || continue
    run cp "$f" "$TARGET/docs/standards/"
  done
fi

# bootstrap task（仅不存在时）
if grep -q '"harness_task_bootstrap"[[:space:]]*:[[:space:]]*true' "$PRESET_FILE"; then
  if [[ ! -f "$TARGET/docs/tasks/active/task_graph_bootstrap.md" ]] && [[ ! -f "$TARGET/docs/tasks/done/task_graph_bootstrap"*.md ]]; then
    run cp "$CYNING_HARNESS/harness/templates/TASK_graph_bootstrap.md" \
      "$TARGET/docs/tasks/active/task_graph_bootstrap.md"
  fi
fi

echo ""
echo "安装完成。profile: $TARGET/.cyning-harness/profile.json"
echo "日后升级: CYNING_HARNESS=$CYNING_HARNESS $CYNING_HARNESS/wizard/harness-sync.sh apply --target $TARGET"
