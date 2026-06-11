#!/usr/bin/env bash
# cyning-harness · 首次接入业务仓（生成 profile + 按 preset 复制）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$(pwd)"
PRESET="harness-only"
DRY_RUN=0
IDE_LIST=""

usage() {
  cat <<'EOF'
用法:

  cd /path/to/your-project
  /path/to/cyning-harness/wizard/install.sh --preset ios-cursor

  /path/to/cyning-harness/wizard/install.sh --target /path/to/project --preset harness-only

  /path/to/cyning-harness/wizard/install.sh --preset harness-only --ide cursor,claude,agents

preset:
  harness-only       — 仅 harness prompts + Cursor 规则（升级常用）
  ios-cursor         — iOS 存量 S2 五轨（无 CI yaml）
  fullstack-node-py  — 全栈 + quality + pytest

选项:
  --target PATH   业务仓根（默认当前目录）
  --preset NAME   见 wizard/profiles/
  --ide LIST      逗号分隔：cursor,claude,agents（写入 profile tracks）
  --dry-run       只打印，不写入（profile 仍会写入供 sync plan）
EOF
}

# 更新 profile.json tracks 布尔（无 jq）
set_json_track_bool() {
  local file="$1" key="$2" val="$3"
  local tmp
  tmp="$(mktemp)"
  if grep -q "\"$key\"" "$file"; then
    sed -E "s/\"$key\"[[:space:]]*:[[:space:]]*(true|false)/\"$key\": $val/" "$file" > "$tmp"
  else
    sed "/\"ci\"/i\\
    \"$key\": $val,
" "$file" > "$tmp"
  fi
  mv "$tmp" "$file"
}

patch_profile_ide() {
  local profile="$1" ide_list="$2"
  local want_cursor=false want_claude=false want_agents=false

  IFS=',' read -ra parts <<< "$ide_list"
  for raw in "${parts[@]}"; do
    local p="${raw// /}"
    case "$p" in
      cursor) want_cursor=true ;;
      claude) want_claude=true ;;
      agents) want_agents=true ;;
      *) echo "未知 IDE: $p（允许: cursor, claude, agents）" >&2; exit 1 ;;
    esac
  done

  set_json_track_bool "$profile" ide_cursor "$want_cursor"
  set_json_track_bool "$profile" ide_claude "$want_claude"
  set_json_track_bool "$profile" ide_agents "$want_agents"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --preset) PRESET="$2"; shift 2 ;;
    --ide) IDE_LIST="$2"; shift 2 ;;
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
[[ -n "$IDE_LIST" ]] && echo "ide: $IDE_LIST"
echo ""

run mkdir -p "$TARGET/.cyning-harness"
run mkdir -p "$TARGET/docs/tasks/active" "$TARGET/docs/tasks/done"
run mkdir -p "$TARGET/docs/harness/prompts" "$TARGET/docs/harness/reviews" "$TARGET/docs/harness/invokes/by-task"
run mkdir -p "$TARGET/docs/_tech_graph" "$TARGET/docs/coding_wiki" "$TARGET/docs/standards"

PROFILE_DST="$TARGET/.cyning-harness/profile.json"

# profile 须真实写入，供 harness-sync plan/apply 读取（含 dry-run）
mkdir -p "$TARGET/.cyning-harness"
cp "$PRESET_FILE" "$PROFILE_DST"
if [[ -n "$IDE_LIST" ]]; then
  patch_profile_ide "$PROFILE_DST" "$IDE_LIST"
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] profile: $PROFILE_DST"
else
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
echo "安装完成。profile: $PROFILE_DST"
echo "日后升级: CYNING_HARNESS=$CYNING_HARNESS $CYNING_HARNESS/wizard/harness-sync.sh apply --target $TARGET"
