#!/usr/bin/env bash
# cyning-harness · 清空已接入纪律层（便于删除后重新 install / upgrade）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"

TARGET=""
ASSUME_YES=0
WITH_CI=0
WITH_INSTALL_ARTIFACTS=0
DRY_RUN=0

usage() {
  cat <<'EOF'
用法（推荐在 cyning-harness 产品包目录执行）:

  cd /path/to/cyning-harness
  ./wizard/uninstall.sh

非交互:

  ./wizard/uninstall.sh --target /path/to/project --yes
  ./wizard/uninstall.sh --target /path/to/project --yes --with-ci --with-install-artifacts

选项:
  --target PATH              业务仓根（交互时可省略）
  --yes                      预览后不再确认，直接清空
  --with-ci                  额外删除与产品样例一致的 CI workflow（install preset 写入的）
  --with-install-artifacts   额外删除 install 时写入的图谱/wiki/standards 模板副本
  --dry-run                  仅预览，不删除
  -h, --help                 显示本帮助

默认保留（不删）:
  docs/tasks/ · docs/harness/reviews/ · docs/harness/invokes/by-task/
  docs/harness/FRAGMENT* · 业务自定义图谱正文

清空后重新安装:
  ./wizard/install.sh --target <业务仓> --preset harness-only --ide cursor,claude,agents
  或 ./wizard/upgrade.sh --target <业务仓>
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --yes) ASSUME_YES=1; shift ;;
    --with-ci) WITH_CI=1; shift ;;
    --with-install-artifacts) WITH_INSTALL_ARTIFACTS=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

echo "=== cyning-harness 清空向导 ==="
echo "产品包: $HARNESS_ROOT"
echo ""

if [[ -z "$TARGET" ]]; then
  echo "请输入要清空 Harness 纪律层的业务仓路径"
  read -r -p "业务仓路径: " TARGET_INPUT
  [[ -n "$TARGET_INPUT" ]] || { echo "未输入路径，已取消。" >&2; exit 1; }
  TARGET="$TARGET_INPUT"
fi

[[ -d "$TARGET" ]] || { echo "错误: 目录不存在: $TARGET" >&2; exit 1; }
TARGET="$(abs_path "$TARGET")"
refuse_if_product_root "$TARGET" "$HARNESS_ROOT"

PROFILE_FILE="$TARGET/.cyning-harness/profile.json"
if [[ ! -f "$PROFILE_FILE" ]]; then
  echo "未找到 $PROFILE_FILE — 该仓似乎未接入 Harness，无需清空。" >&2
  exit 0
fi

PRESET_NAME="$(profile_preset_name "$PROFILE_FILE")"
echo "目标仓: $TARGET"
echo "preset: $PRESET_NAME"
echo ""

PLAN_LINES=()

plan_remove_file() {
  local path="$1" note="${2:-}"
  if [[ -f "$path" ]]; then
    PLAN_LINES+=("rm|$path|$note")
  fi
}

plan_remove_marker() {
  local path="$1" note="${2:-}"
  if [[ -f "$path" ]] && grep -qF "$MARKER_BEGIN" "$path"; then
    PLAN_LINES+=("marker|$path|$note")
  fi
}

# harness-sync 同步项
if profile_track_enabled "$PROFILE_FILE" harness_prompts false; then
  for f in "$CYNING_HARNESS/harness/prompts/"*.md; do
    [[ -f "$f" ]] || continue
    plan_remove_file "$TARGET/docs/harness/prompts/$(basename "$f")" "harness prompts"
  done
fi

if profile_track_enabled "$PROFILE_FILE" harness_invoke_template false; then
  plan_remove_file "$TARGET/docs/harness/invokes/TEMPLATE_invoke.md" "invoke 模板"
fi

if profile_track_enabled "$PROFILE_FILE" ide_cursor true; then
  plan_remove_file "$TARGET/$(profile_ide_cursor_rel "$PROFILE_FILE")" "Cursor 规则"
fi

if profile_track_enabled "$PROFILE_FILE" ide_claude false; then
  plan_remove_marker "$TARGET/CLAUDE.md" "Claude IDE marker"
fi

if profile_track_enabled "$PROFILE_FILE" ide_agents false; then
  plan_remove_marker "$TARGET/AGENTS.md" "Agents IDE marker"
fi

# install 可选轨（须显式 flag）
if [[ "$WITH_INSTALL_ARTIFACTS" -eq 1 ]]; then
  if profile_json_bool "$PROFILE_FILE" graph || grep -q '"graph"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
    for f in "$CYNING_HARNESS/graph/templates/"*; do
      [[ -f "$f" ]] || continue
      plan_remove_file "$TARGET/docs/_tech_graph/$(basename "$f")" "graph 模板"
    done
  fi
  if profile_json_bool "$PROFILE_FILE" wiki || grep -q '"wiki"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
    for f in "$CYNING_HARNESS/coding_wiki/templates/"*; do
      [[ -f "$f" ]] || continue
      plan_remove_file "$TARGET/docs/coding_wiki/$(basename "$f")" "wiki 模板"
    done
  fi
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_CODING_BASELINE_L1*.md; do
    [[ -f "$f" ]] || continue
    plan_remove_file "$TARGET/docs/standards/$(basename "$f")" "standards L1"
  done
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_CODING_BASELINE_L2*.md; do
    [[ -f "$f" ]] || continue
    plan_remove_file "$TARGET/docs/standards/$(basename "$f")" "standards L2"
  done
  for f in "$CYNING_HARNESS/standards/"TEMPLATE_SOURCES*.md; do
    [[ -f "$f" ]] || continue
    plan_remove_file "$TARGET/docs/standards/$(basename "$f")" "standards sources"
  done
  plan_remove_file "$TARGET/docs/tasks/active/task_graph_bootstrap.md" "bootstrap task"
fi

if [[ "$WITH_CI" -eq 1 ]]; then
  plan_remove_file "$TARGET/.github/workflows/quality.yml" "CI quality（若存在）"
  plan_remove_file "$TARGET/.github/workflows/pytest.yml" "CI pytest（若存在）"
fi

# profile 元数据（最后删）
PLAN_LINES+=("rm_dir|$TARGET/.cyning-harness|接入配置")

if [[ ${#PLAN_LINES[@]} -eq 0 ]]; then
  echo "无待清空项。" >&2
  exit 0
fi

echo ">>> 将清空以下项（业务 task / reviews / by-task invoke 默认保留）"
echo ""
for line in "${PLAN_LINES[@]}"; do
  IFS='|' read -r kind path note <<<"$line"
  case "$kind" in
    rm) echo "  [删除文件 · $note] $path" ;;
    marker) echo "  [剥离 marker · $note] $path" ;;
    rm_dir) echo "  [删除目录 · $note] $path" ;;
  esac
done
echo ""

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "dry-run：未执行删除。"
  exit 0
fi

DO_UNINSTALL=0
if [[ "$ASSUME_YES" -eq 1 ]]; then
  DO_UNINSTALL=1
elif prompt_yes_no "确认清空以上 Harness 纪律层？" "n"; then
  DO_UNINSTALL=1
fi

if [[ "$DO_UNINSTALL" -eq 0 ]]; then
  echo "已取消。"
  exit 0
fi

echo ""
echo ">>> 执行清空"
for line in "${PLAN_LINES[@]}"; do
  IFS='|' read -r kind path note <<<"$line"
  case "$kind" in
    rm)
      rm -f "$path"
      echo "  已删除: $path"
      ;;
    marker)
      remove_harness_marker_file "$path"
      ;;
    rm_dir)
      rm -rf "$path"
      echo "  已删除目录: $path"
      ;;
  esac
done

echo ""
echo "清空完成。"
echo "重新安装: $SCRIPT_DIR/install.sh --target $TARGET --preset $PRESET_NAME"
echo "或升级向导: $SCRIPT_DIR/upgrade.sh --target $TARGET"
