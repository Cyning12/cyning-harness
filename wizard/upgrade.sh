#!/usr/bin/env bash
# cyning-harness · 交互式升级向导（在产品包目录运行，引导输入业务仓路径）
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"

TARGET=""
IDE_LIST=""
ASSUME_YES=0
RUN_GATE=0

usage() {
  cat <<'EOF'
用法（推荐在 cyning-harness 产品包根目录执行）:

  cd /path/to/cyning-harness
  ./wizard/upgrade.sh

非交互（脚本 / CI）:

  ./wizard/upgrade.sh --target /path/to/project
  ./wizard/upgrade.sh --target /path/to/project --ide cursor,claude,agents --yes
  ./wizard/upgrade.sh --target /path/to/project --yes --gate-check

选项:
  --target PATH    业务仓根（交互模式下可省略，运行时会提示输入）
  --ide LIST       更新 IDE 勾选：cursor,claude,agents
  --yes            预览 plan 后不再确认，直接 apply
  --gate-check     同步后运行 gate-check.sh
  -h, --help       显示本帮助
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --ide) IDE_LIST="$2"; shift 2 ;;
    --yes) ASSUME_YES=1; shift ;;
    --gate-check) RUN_GATE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

VERSION="$(git -C "$HARNESS_ROOT" describe --tags --always 2>/dev/null || echo unknown)"

echo "=== cyning-harness 升级向导 ==="
echo "产品包: $HARNESS_ROOT"
echo "版本:   $VERSION"
echo ""

if [[ -z "$TARGET" ]]; then
  echo "请输入已接入 Harness 的业务仓路径（绝对路径，例: /Users/you/Projects/kimi-code-meta）"
  read -r -p "业务仓路径: " TARGET_INPUT
  [[ -n "$TARGET_INPUT" ]] || { echo "未输入路径，已取消。" >&2; exit 1; }
  TARGET="$TARGET_INPUT"
fi

[[ -d "$TARGET" ]] || { echo "错误: 目录不存在: $TARGET" >&2; exit 1; }
TARGET="$(abs_path "$TARGET")"
refuse_if_product_root "$TARGET" "$HARNESS_ROOT"

PROFILE_FILE="$TARGET/.cyning-harness/profile.json"

if [[ ! -f "$PROFILE_FILE" ]]; then
  echo ""
  echo "未找到 $PROFILE_FILE — 该仓似乎尚未接入 Harness。"
  if prompt_yes_no "是否改为首次安装（install.sh）？" "y"; then
    PRESET="harness-only"
    if [[ -z "$IDE_LIST" ]]; then
      read -r -p "preset [harness-only]: " PRESET_INPUT
      [[ -n "$PRESET_INPUT" ]] && PRESET="$PRESET_INPUT"
      read -r -p "IDE 勾选 cursor,claude,agents [cursor]: " IDE_INPUT
      IDE_LIST="${IDE_INPUT:-cursor}"
    fi
    INSTALL_ARGS=(--target "$TARGET" --preset "$PRESET")
    [[ -n "$IDE_LIST" ]] && INSTALL_ARGS+=(--ide "$IDE_LIST")
    echo ""
    echo ">>> install.sh ${INSTALL_ARGS[*]}"
    "$SCRIPT_DIR/install.sh" "${INSTALL_ARGS[@]}"
    exit 0
  fi
  echo "已取消。请先: $SCRIPT_DIR/install.sh --target $TARGET --preset harness-only" >&2
  exit 1
fi

echo "目标仓: $TARGET"
echo "preset: $(profile_preset_name "$PROFILE_FILE")"
echo "当前 IDE: $(profile_ide_summary "$PROFILE_FILE")"
echo ""

# 始终刷新 local.json，避免路径漂移（如 Desktop → Projects）
printf '%s\n' "{\"cyning_harness_root\":\"$CYNING_HARNESS\"}" > "$TARGET/.cyning-harness/local.json"
echo "已更新 local.json → cyning_harness_root=$CYNING_HARNESS"
echo ""

if [[ -z "$IDE_LIST" ]] && [[ "$ASSUME_YES" -eq 0 ]]; then
  if prompt_yes_no "是否更新 IDE 勾选（cursor / claude / agents）？" "n"; then
    read -r -p "IDE 列表 [$(profile_ide_summary "$PROFILE_FILE")]: " IDE_INPUT
    [[ -n "$IDE_INPUT" ]] && IDE_LIST="$IDE_INPUT"
  fi
fi

if [[ -n "$IDE_LIST" ]]; then
  patch_profile_ide "$PROFILE_FILE" "$IDE_LIST"
  echo "已更新 IDE 勾选: $IDE_LIST"
  echo ""
fi

export CYNING_HARNESS TARGET

echo ">>> 预览同步计划（plan）"
echo ""
"$SCRIPT_DIR/harness-sync.sh" plan --target "$TARGET"
echo ""

DO_APPLY=0
if [[ "$ASSUME_YES" -eq 1 ]]; then
  DO_APPLY=1
elif prompt_yes_no "确认执行同步（apply）？" "y"; then
  DO_APPLY=1
fi

if [[ "$DO_APPLY" -eq 1 ]]; then
  echo ""
  echo ">>> 执行同步（apply）"
  "$SCRIPT_DIR/harness-sync.sh" apply --target "$TARGET"
  echo ""
  echo "升级完成。"
else
  echo "已取消 apply（仅预览）。"
  exit 0
fi

if [[ "$RUN_GATE" -eq 1 ]]; then
  echo ""
  echo ">>> gate-check"
  "$SCRIPT_DIR/gate-check.sh" --target "$TARGET"
elif [[ "$ASSUME_YES" -eq 0 ]] && prompt_yes_no "是否运行 gate-check（30 前人工闸）？" "n"; then
  echo ""
  echo ">>> gate-check"
  "$SCRIPT_DIR/gate-check.sh" --target "$TARGET"
fi

echo ""
echo "日后可在产品包目录再次运行: $SCRIPT_DIR/upgrade.sh"
echo "清空重装: $SCRIPT_DIR/uninstall.sh --target $TARGET"
