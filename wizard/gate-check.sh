#!/usr/bin/env bash
# 读取 active task 人工闸 · 判断 30 是否可开工（机械辅助，真值仍在 task 表）
set -euo pipefail

TARGET="${TARGET:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    -h|--help)
      echo "用法: gate-check.sh [--target /path/to/repo]"
      exit 0
    ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

ACTIVE_DIR="$TARGET/docs/tasks/active"
[[ -d "$ACTIVE_DIR" ]] || { echo "无 $ACTIVE_DIR" >&2; exit 1; }

TASK_FILES=("$ACTIVE_DIR"/task_*.md)
if [[ ! -e "${TASK_FILES[0]}" ]]; then
  echo "无 active task_*.md"
  exit 0
fi

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

echo "=== Harness gate-check ==="
echo "目标: $TARGET"
echo ""

BLOCKED=0
for tf in "$ACTIVE_DIR"/task_*.md; do
  [[ -f "$tf" ]] || continue
  echo "task: $(basename "$tf")"
  draft="$(gate_status "$tf" HG-TASK-DRAFT)"
  audit="$(gate_status "$tf" HG-AUDIT-R1)"
  graph="$(gate_status "$tf" HG-GRAPH-MODULES)"

  printf "| gate | status | 30 影响 |\n"
  printf "|------|--------|--------|\n"
  printf "| HG-TASK-DRAFT | %s | — |\n" "${draft:-?}"
  printf "| HG-AUDIT-R1 | %s | %s |\n" "${audit:-?}" \
    "$( [[ "$audit" == "approved" ]] && echo "✅ 可 30" || echo "❌ 拒 30" )"
  if [[ -n "$graph" && "$graph" != "—" && "$graph" != "?" ]]; then
    printf "| HG-GRAPH-MODULES | %s | %s |\n" "$graph" \
      "$( [[ "$graph" == "approved" ]] && echo "✅" || echo "❌ 若 pending 拒 30" )"
    if [[ "$graph" == "pending" ]]; then
      BLOCKED=1
      echo "→ 30 不可开工: HG-GRAPH-MODULES pending"
      echo ""
    fi
  fi
  echo ""

  if [[ "$audit" != "approved" ]]; then
    BLOCKED=1
    echo "→ 30 不可开工: HG-AUDIT-R1 非 approved（须维护者签 task 表）"
    echo ""
  fi
done

if [[ "$BLOCKED" == "1" ]]; then
  exit 2
fi
echo "闸检查: 未发现 HG-AUDIT-R1 阻塞（仍须 Agent 首输出闸扫描表）"
exit 0
