#!/usr/bin/env bash
# 读取 task 人工闸 · 判断 30 是否可开工（机械辅助，真值仍在 task 表）
set -euo pipefail

TARGET="${TARGET:-$(pwd)}"
TASK_FILE=""
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --task)
      TASK_FILE="$2"
      shift 2
      ;;
    -h|--help)
      echo "用法: gate-check.sh [--target /path/to/repo] [--task docs/tasks/active/task_*.md]"
      exit 0
    ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

gate_status() {
  local file="$1" gate="$2"
  awk -F'|' -v g="$gate" '
    index($0, g) > 0 {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $3)
      gsub(/\*/, "", $3)
      print $3
      exit
    }
  ' "$file"
}

gate_blocks() {
  local file="$1" gate="$2"
  awk -F'|' -v g="$gate" '
    index($0, g) > 0 {
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", $4)
      gsub(/\*/, "", $4)
      print $4
      exit
    }
  ' "$file"
}

check_one_task() {
  local tf="$1"
  echo "task: $(basename "$tf")"
  draft="$(gate_status "$tf" HG-TASK-DRAFT)"
  audit="$(gate_status "$tf" HG-AUDIT-R1)"
  graph="$(gate_status "$tf" HG-GRAPH-MODULES)"
  draft_blocks="$(gate_blocks "$tf" HG-TASK-DRAFT)"

  printf "| gate | status | blocks_30 | 30 影响 |\n"
  printf "|------|--------|-----------|--------|\n"
  printf "| HG-TASK-DRAFT | %s | %s | %s |\n" "${draft:-?}" "${draft_blocks:-?}" \
    "$( [[ "$draft" == "approved" ]] && echo "—" || { [[ "$draft_blocks" == *30* ]] && echo "❌ 拒 30" || echo "—"; } )"
  printf "| HG-AUDIT-R1 | %s | 30 | %s |\n" "${audit:-?}" \
    "$( [[ "$audit" == "approved" ]] && echo "✅ 可 30" || echo "❌ 拒 30" )"
  if [[ -n "$graph" && "$graph" != "—" && "$graph" != "?" ]]; then
    printf "| HG-GRAPH-MODULES | %s | — | %s |\n" "$graph" \
      "$( [[ "$graph" == "approved" ]] && echo "✅" || echo "❌ 若 pending 拒 30" )"
  fi
  echo ""

  local blocked=0
  if [[ "$audit" != "approved" ]]; then
    blocked=1
    echo "→ 30 不可开工: HG-AUDIT-R1 非 approved（须维护者签 task 表）"
  fi
  if [[ "$draft" != "approved" && "$draft_blocks" == *30* ]]; then
    blocked=1
    echo "→ 30 不可开工: HG-TASK-DRAFT pending 且 blocks 30"
  fi
  if [[ -n "$graph" && "$graph" == "pending" ]]; then
    blocked=1
    echo "→ 30 不可开工: HG-GRAPH-MODULES pending"
  fi
  echo ""
  return "$blocked"
}

echo "=== Harness gate-check ==="
echo "目标: $TARGET"

MANIFEST_FILE="$TARGET/.cyning-harness/manifest.json"
if [[ -f "$MANIFEST_FILE" ]]; then
  mf_version="$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$MANIFEST_FILE" | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
  mf_preset="$(grep -o '"preset"[[:space:]]*:[[:space:]]*"[^"]*"' "$MANIFEST_FILE" | head -1 | sed -E 's/.*"([^"]+)"$/\1/')"
  echo "manifest.version: ${mf_version:-?}"
  echo "manifest.preset: ${mf_preset:-?}"
  if [[ -n "${CYNING_HARNESS:-}" && -f "$CYNING_HARNESS/package.json" ]]; then
    pkg_version="$(grep '"version"' "$CYNING_HARNESS/package.json" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/')"
    if [[ -n "$pkg_version" && -n "$mf_version" && "$mf_version" != "$pkg_version" ]]; then
      echo "提示: manifest 版本 ($mf_version) 与产品包 ($pkg_version) 不一致 · 可运行 upgrade"
    fi
  fi
else
  echo "manifest: (未接入 · 无 $MANIFEST_FILE)"
fi
echo ""

BLOCKED=0

if [[ -n "$TASK_FILE" ]]; then
  if [[ "$TASK_FILE" != /* ]]; then
    TASK_FILE="$TARGET/$TASK_FILE"
  fi
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "错误: 未找到 --task 文件 $TASK_FILE" >&2
    exit 1
  fi
  check_one_task "$TASK_FILE" || BLOCKED=1
else
  ACTIVE_DIR="$TARGET/docs/tasks/active"
  [[ -d "$ACTIVE_DIR" ]] || { echo "无 $ACTIVE_DIR" >&2; exit 1; }
  TASK_FILES=("$ACTIVE_DIR"/task_*.md)
  if [[ ! -e "${TASK_FILES[0]}" ]]; then
    echo "无 active task_*.md"
    exit 0
  fi
  for tf in "$ACTIVE_DIR"/task_*.md; do
    [[ -f "$tf" ]] || continue
    check_one_task "$tf" || BLOCKED=1
  done
fi

if [[ "$BLOCKED" == "1" ]]; then
  exit 2
fi
echo "闸检查: 未发现阻塞（仍须 Agent 首输出 GATE_VERIFY · 不得采信 invoke 字面 approved）"
exit 0
