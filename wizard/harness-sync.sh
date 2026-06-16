#!/usr/bin/env bash
# cyning-harness · 将产品包选定轨道同步到已接入业务仓（不覆盖业务 task / reviews / 自定义图谱正文）
set -euo pipefail

MODE="${1:-}"
TARGET="${TARGET:-$(pwd)}"
SYNC_FORCE=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MARKER_BEGIN='<!-- cyning-harness:begin -->'
MARKER_END='<!-- cyning-harness:end -->'

usage() {
  cat <<'EOF'
用法（从业务仓根，或指定 TARGET）：

  CYNING_HARNESS=/path/to/cyning-harness \
  TARGET=/path/to/ios_buy \
  "$CYNING_HARNESS/wizard/harness-sync.sh" plan

  "$CYNING_HARNESS/wizard/harness-sync.sh" apply

  "$CYNING_HARNESS/wizard/harness-sync.sh" --index --target /path/to/project

或：

  "$CYNING_HARNESS/wizard/harness-sync.sh" plan --target /path/to/project
  "$CYNING_HARNESS/wizard/harness-sync.sh" apply --target /path/to/project
  "$CYNING_HARNESS/wizard/harness-sync.sh" apply --target /path/to/project --force   # 跳过 S5 git-clean

依赖：业务仓已有 .cyning-harness/profile.json（由 install.sh 生成）

plan   — 仅打印将复制的文件
apply  — 执行复制（S5：git 仓须工作区干净，或 --force）
--index — 生成 .cyning-harness/invoke_index.json（只读聚合 invokes/by-task，不覆盖 S2 域）
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    plan|apply) MODE="$1"; shift ;;
    --index) MODE="index"; shift ;;
    --target) TARGET="$2"; shift 2 ;;
    --force) SYNC_FORCE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

[[ "$MODE" == "plan" || "$MODE" == "apply" || "$MODE" == "index" ]] || { usage; exit 1; }

CYNING_HARNESS="${CYNING_HARNESS:-$HARNESS_ROOT}"
refuse_if_product_root "$TARGET" "$HARNESS_ROOT"
PROFILE_FILE="$TARGET/.cyning-harness/profile.json"

if [[ "$MODE" == "index" ]]; then
  if [[ ! -d "$TARGET" ]]; then
    echo "错误: 目标目录不存在 $TARGET" >&2
    exit 1
  fi
  node "$SCRIPT_DIR/lib/generate-invoke-index.js" "$TARGET"
  exit 0
fi

if [[ ! -f "$PROFILE_FILE" ]]; then
  echo "错误: 未找到 $PROFILE_FILE" >&2
  echo "请先运行: $CYNING_HARNESS/wizard/install.sh --target $TARGET --preset <name>" >&2
  exit 1
fi

# 简易 JSON 布尔/字符串读取（无 jq 依赖）
json_bool() { grep -q "\"$1\"[[:space:]]*:[[:space:]]*true" "$PROFILE_FILE"; }

track_enabled() {
  local k="$1" default="${2:-false}"
  if ! grep -q "\"$k\"" "$PROFILE_FILE"; then
    [[ "$default" == "true" ]]
    return
  fi
  json_bool "$k"
}

json_str() {
  local k="$1" def="$2"
  local line
  line="$(grep "\"$k\"" "$PROFILE_FILE" | head -1)"
  if [[ -z "$line" ]]; then echo "$def"; return; fi
  sed -E 's/.*:[[:space:]]*"([^"]*)".*/\1/' <<<"$line" | head -1
}

IDE_REL=""
if grep -q '"paths"' "$PROFILE_FILE"; then
  IDE_REL="$(sed -n '/"paths"/,/^  \}/p' "$PROFILE_FILE" | grep '"ide_cursor"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/')"
fi
[[ -z "$IDE_REL" ]] && IDE_REL=".cursor/rules/06-harness-pointer.mdc"
CI_TRACK="$(json_str ci none)"

OPS=()

add_cp() {
  local src="$1" dst="$2" note="${3:-}"
  OPS+=("cp|$src|$dst|$note")
}

merge_action_label() {
  local dst="$1"
  if [[ ! -f "$dst" ]]; then
    echo "merge(create)"
  elif grep -qF "$MARKER_BEGIN" "$dst"; then
    echo "merge(replace marker)"
  else
    echo "merge(append marker)"
  fi
}

add_merge() {
  local src="$1" dst="$2" note="${3:-}"
  local action
  action="$(merge_action_label "$dst")"
  OPS+=("merge|$src|$dst|$note|$action")
}

merge_fragment_apply() {
  local src="$1" dst="$2"
  local tmp_block tmp_out

  tmp_block="$(mktemp)"
  {
    printf '%s\n' "$MARKER_BEGIN"
    cat "$src"
    printf '%s\n' "$MARKER_END"
  } > "$tmp_block"

  if [[ ! -f "$dst" ]]; then
    cp "$tmp_block" "$dst"
    rm -f "$tmp_block"
    return
  fi

  if grep -qF "$MARKER_BEGIN" "$dst"; then
    tmp_out="$(mktemp)"
    awk -v begin="$MARKER_BEGIN" -v end="$MARKER_END" -v blockfile="$tmp_block" '
      BEGIN {
        while ((getline line < blockfile) > 0) block = block line "\n"
        close(blockfile)
        inblock = 0
        replaced = 0
      }
      index($0, begin) && !replaced {
        printf "%s", block
        inblock = 1
        replaced = 1
        next
      }
      inblock {
        if (index($0, end)) inblock = 0
        next
      }
      { print }
    ' "$dst" > "$tmp_out"
    mv "$tmp_out" "$dst"
  else
    printf '\n' >> "$dst"
    cat "$tmp_block" >> "$dst"
  fi
  rm -f "$tmp_block"
}

if track_enabled harness_prompts false; then
  for f in "$CYNING_HARNESS/harness/prompts/"*.md; do
    [[ -f "$f" ]] || continue
    add_cp "$f" "$TARGET/docs/harness/prompts/$(basename "$f")" "harness prompts"
  done
fi

if track_enabled harness_invoke_template false; then
  add_cp "$CYNING_HARNESS/harness/invokes/TEMPLATE_invoke.md" \
    "$TARGET/docs/harness/invokes/TEMPLATE_invoke.md" "invoke 模板"
fi

if track_enabled ide_cursor true; then
  add_cp "$CYNING_HARNESS/ide/adapters/cursor-harness-starter.mdc.example" \
    "$TARGET/$IDE_REL" "Cursor 规则"
fi

if track_enabled ide_claude false; then
  add_merge "$CYNING_HARNESS/ide/adapters/CLAUDE.md.fragment.example" \
    "$TARGET/CLAUDE.md" "Claude IDE"
fi

if track_enabled ide_agents false; then
  add_merge "$CYNING_HARNESS/ide/adapters/AGENTS.md.fragment.example" \
    "$TARGET/AGENTS.md" "Agents IDE"
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

if [[ "$MODE" == "apply" ]]; then
  check_git_clean "$TARGET" "$SYNC_FORCE"
fi

echo "=== cyning-harness sync ($MODE) ==="
echo "产品包: $CYNING_HARNESS"
echo "目标仓: $TARGET"
echo "profile: $PROFILE_FILE"
echo ""

for op in "${OPS[@]}"; do
  IFS='|' read -r kind src dst note extra <<<"$op"
  if [[ "$kind" == "merge" ]]; then
    echo "[$note · $extra] $src -> $dst"
    if [[ "$MODE" == "apply" ]]; then
      merge_fragment_apply "$src" "$dst"
    fi
  else
    echo "[$note] $src -> $dst"
    if [[ "$MODE" == "apply" ]]; then
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
    fi
  fi
done

if [[ "$MODE" == "apply" ]]; then
  echo ""
  echo "完成。建议: $CYNING_HARNESS/wizard/gate-check.sh --target $TARGET"
fi
