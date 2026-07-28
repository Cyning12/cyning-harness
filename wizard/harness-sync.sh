#!/usr/bin/env bash
# cyning-harness · 将产品包选定轨道同步到已接入业务仓（不覆盖业务 task / reviews / 自定义图谱正文）
set -euo pipefail

MODE="${1:-}"
TARGET="${TARGET:-$(pwd)}"
SYNC_FORCE=0

# V2 改名后已废弃的帽文件（只 warn 提示人工删除 · 永不自动删业务仓文件）
OBSOLETE_HATS="10-requirements.md 22-task-audit.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# MARKER_* / LOCAL_MARKER_* 来自 lib/common.sh

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

# 若产品 marker 内误嵌 local 块，抽出其正文（不含 local 标记行）
extract_nested_local_body() {
  local file="$1"
  awk -v pbegin="$MARKER_BEGIN" -v pend="$MARKER_END" \
      -v lbegin="$LOCAL_MARKER_BEGIN" -v lend="$LOCAL_MARKER_END" '
    index($0, pbegin) { in_product = 1; next }
    in_product && index($0, pend) { in_product = 0; next }
    in_product && index($0, lbegin) { in_local = 1; next }
    in_product && in_local && index($0, lend) { in_local = 0; next }
    in_product && in_local { print }
  ' "$file"
}

merge_fragment_apply() {
  local src="$1" dst="$2"
  local tmp_block tmp_out salvage nested

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

  salvage=""
  if grep -qF "$MARKER_BEGIN" "$dst"; then
    nested="$(extract_nested_local_body "$dst" || true)"
    if [[ -n "${nested// }" ]]; then
      salvage="$(mktemp)"
      {
        printf '%s\n' "$LOCAL_MARKER_BEGIN"
        printf '%s\n' "$nested"
        printf '%s\n' "$LOCAL_MARKER_END"
      } > "$salvage"
      echo "warn: overlay · 产品 marker 内发现 local 块，已 salvage 到块外: $dst"
    fi

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

    # 块外已有完整 local 标记则不再追加 salvage（避免重复）
    if [[ -n "$salvage" ]]; then
      if grep -qF "$LOCAL_MARKER_BEGIN" "$dst"; then
        echo "warn: overlay · 目标已有 local 块，跳过追加 salvage（请人工核对）: $dst"
      else
        printf '\n' >> "$dst"
        cat "$salvage" >> "$dst"
      fi
      rm -f "$salvage"
    fi
  else
    printf '\n' >> "$dst"
    cat "$tmp_block" >> "$dst"
  fi
  rm -f "$tmp_block"
}

# profile.graph_modules_path → FRAGMENT 占位（缺省 01_struct）
apply_graph_modules_substitution() {
  local fragment="$TARGET/docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md"
  local path token='__HARNESS_GRAPH_MODULES_PATH__'
  local tmp

  [[ -f "$fragment" ]] || return 0
  grep -qF "$token" "$fragment" || return 0

  path="$(json_str graph_modules_path 01_struct)"
  if [[ ! "$path" =~ ^[A-Za-z0-9._/-]+$ ]]; then
    echo "warn: overlay · graph_modules_path 非法（仅允许 [A-Za-z0-9._/-]），跳过替换: $path" >&2
    return 0
  fi

  tmp="$(mktemp)"
  sed "s|$token|$path|g" "$fragment" > "$tmp"
  mv "$tmp" "$fragment"
  echo "overlay · FRAGMENT graph_modules_path → $path"
}

print_overlay_hint() {
  local rels=(
    AGENTS.md
    CLAUDE.md
    "$IDE_REL"
    docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md
  )
  echo ""
  echo "hint · overlay（v2.22+）:"
  echo "  · 仓内定制 → <!-- cyning-harness-local:begin/end -->（产品 cyning-harness:begin/end **外**）"
  echo "  · G-L 布局 → .cyning-harness/profile.json 可选 \"graph_modules_path\": \"l1/01_modules\"（默认 01_struct）"
  echo "  · 自检: git diff HEAD -- AGENTS.md CLAUDE.md ${IDE_REL} docs/harness/prompts/FRAGMENT_30_gate_verify_v1_zh.md"
  if git -C "$TARGET" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "  · 本波 diff --stat:"
    git -C "$TARGET" --no-pager diff --stat HEAD -- "${rels[@]}" 2>/dev/null | sed 's/^/      /' || true
  fi
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

# obsolete 帽文件检测（V2 拆分改名遗留 · warn only）
for f in $OBSOLETE_HATS; do
  if [[ -f "$TARGET/docs/harness/prompts/$f" ]]; then
    echo "warn: obsolete 帽文件残留 docs/harness/prompts/${f}（V2 已拆分改名 · 双真值风险）· 建议人工删除: rm \"$TARGET/docs/harness/prompts/${f}\""
  fi
done

if [[ "$MODE" == "apply" ]]; then
  apply_graph_modules_substitution
  print_overlay_hint
  echo ""
  echo "完成。建议: $CYNING_HARNESS/wizard/gate-check.sh --target $TARGET"
fi
