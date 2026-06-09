#!/usr/bin/env bash
# cyning-harness · 将产品包选定轨道同步到已接入业务仓（不覆盖业务 task / reviews / 自定义图谱正文）
set -euo pipefail

MODE="${1:-}"
TARGET="${TARGET:-$(pwd)}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

usage() {
  cat <<'EOF'
用法（从业务仓根，或指定 TARGET）：

  CYNING_HARNESS=/path/to/cyning-harness \
  TARGET=/path/to/ios_buy \
  "$CYNING_HARNESS/wizard/harness-sync.sh" plan

  "$CYNING_HARNESS/wizard/harness-sync.sh" apply

或：

  "$CYNING_HARNESS/wizard/harness-sync.sh" plan --target /path/to/project
  "$CYNING_HARNESS/wizard/harness-sync.sh" apply --target /path/to/project

依赖：业务仓已有 .cyning-harness/profile.json（由 install.sh 生成）

plan  — 仅打印将复制的文件
apply — 执行复制（harness prompts / invoke 模板 / IDE 规则；图谱/wiki 仅 install 时或 --force-tracks）
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    plan|apply) MODE="$1"; shift ;;
    --target) TARGET="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

[[ "$MODE" == "plan" || "$MODE" == "apply" ]] || { usage; exit 1; }

CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"
PROFILE_FILE="$TARGET/.cyning-harness/profile.json"

if [[ ! -f "$PROFILE_FILE" ]]; then
  echo "错误: 未找到 $PROFILE_FILE" >&2
  echo "请先运行: $CYNING_HARNESS/wizard/install.sh --target $TARGET --preset <name>" >&2
  exit 1
fi

# 简易 JSON 布尔/字符串读取（无 jq 依赖）
json_bool() { grep -q "\"$1\"[[:space:]]*:[[:space:]]*true" "$PROFILE_FILE"; }
json_str() {
  local k="$1" def="$2"
  local line
  line="$(grep "\"$k\"" "$PROFILE_FILE" | head -1)"
  if [[ -z "$line" ]]; then echo "$def"; return; fi
  sed -E 's/.*:[[:space:]]*"([^"]*)".*/\1/' <<<"$line" | head -1
}

IDE_REL="$(grep '"ide_cursor"' "$PROFILE_FILE" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/')"
[[ -z "$IDE_REL" ]] && IDE_REL=".cursor/rules/06-harness-pointer.mdc"
CI_TRACK="$(json_str ci none)"

OPS=()

add_cp() {
  local src="$1" dst="$2" note="${3:-}"
  OPS+=("$src|$dst|$note")
}

if json_bool harness_prompts || grep -q '"harness_prompts"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
  for f in "$CYNING_HARNESS/harness/prompts/"*.md; do
    [[ -f "$f" ]] || continue
    add_cp "$f" "$TARGET/docs/harness/prompts/$(basename "$f")" "harness prompts"
  done
fi

if json_bool harness_invoke_template || grep -q '"harness_invoke_template"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
  add_cp "$CYNING_HARNESS/harness/invokes/TEMPLATE_invoke.md" \
    "$TARGET/docs/harness/invokes/TEMPLATE_invoke.md" "invoke 模板"
fi

if json_bool ide_cursor || grep -q '"ide_cursor"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
  add_cp "$CYNING_HARNESS/ide/adapters/cursor-harness-starter.mdc.example" \
    "$TARGET/$IDE_REL" "Cursor 规则"
fi

# 图谱/wiki/standards：默认 sync 不覆盖（避免洗掉 01_struct）；install 时写入
FORCE_TRACKS="${FORCE_TRACKS:-0}"
if [[ "$FORCE_TRACKS" == "1" ]]; then
  if json_bool graph || grep -q '"graph"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
    for f in "$CYNING_HARNESS/graph/templates/"*; do
      [[ -f "$f" ]] || continue
      add_cp "$f" "$TARGET/docs/_tech_graph/$(basename "$f")" "graph（force）"
    done
  fi
  if json_bool wiki || grep -q '"wiki"[[:space:]]*:[[:space:]]*true' "$PROFILE_FILE"; then
    for f in "$CYNING_HARNESS/coding_wiki/templates/"*; do
      [[ -f "$f" ]] || continue
      add_cp "$f" "$TARGET/docs/coding_wiki/$(basename "$f")" "wiki（force）"
    done
  fi
fi

if [[ ${#OPS[@]} -eq 0 ]]; then
  echo "无同步项（检查 profile tracks）" >&2
  exit 1
fi

echo "=== cyning-harness sync ($MODE) ==="
echo "产品包: $CYNING_HARNESS"
echo "目标仓: $TARGET"
echo "profile: $PROFILE_FILE"
echo ""

for op in "${OPS[@]}"; do
  IFS='|' read -r src dst note <<<"$op"
  echo "[$note] $src -> $dst"
  if [[ "$MODE" == "apply" ]]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
  fi
done

if [[ "$MODE" == "apply" ]]; then
  echo ""
  echo "完成。建议: $CYNING_HARNESS/wizard/gate-check.sh --target $TARGET"
fi
