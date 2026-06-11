#!/usr/bin/env bash
# 已为手工接入的五轨仓 · 仅写入 profile 并 sync（不重复 bootstrap task）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$(pwd)"
PRESET="ios-cursor"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --preset) PRESET="$2"; shift 2 ;;
    -h|--help)
      echo "用法: adopt-existing.sh --target /path/to/project --preset ios-cursor|harness-only"
      exit 0
    ;;
    *) echo "未知: $1" >&2; exit 1 ;;
  esac
done

CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"
PRESET_FILE="$SCRIPT_DIR/profiles/${PRESET}.json"
[[ -f "$PRESET_FILE" ]] || { echo "未知 preset: $PRESET" >&2; exit 1; }
refuse_if_product_root "$TARGET" "$HARNESS_ROOT"

mkdir -p "$TARGET/.cyning-harness"
cp "$PRESET_FILE" "$TARGET/.cyning-harness/profile.json"
printf '%s\n' "{\"cyning_harness_root\":\"$CYNING_HARNESS\"}" > "$TARGET/.cyning-harness/local.json"

export CYNING_HARNESS TARGET
"$SCRIPT_DIR/harness-sync.sh" apply --target "$TARGET"

echo "已为存量仓写入 profile 并同步 harness 纪律层。"
echo "检查闸: $CYNING_HARNESS/wizard/gate-check.sh --target $TARGET"
