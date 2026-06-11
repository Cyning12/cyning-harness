# cyning-harness · wizard 脚本共享函数（source 用，勿直接执行）
# shellcheck shell=bash

MARKER_BEGIN='<!-- cyning-harness:begin -->'
MARKER_END='<!-- cyning-harness:end -->'

# 规范化绝对路径
abs_path() {
  cd "$1" && pwd
}

# 判断目标路径是否为产品包根目录
is_product_root_path() {
  local target="$1" harness_root="$2"
  [[ "$(abs_path "$target")" == "$(abs_path "$harness_root")" ]]
}

# 禁止对产品包自身执行 install/sync（误在 cyning-harness 根目录 apply 时拦截）
refuse_if_product_root() {
  local target="$1" harness_root="$2"
  local target_abs harness_abs
  target_abs="$(abs_path "$target")"
  harness_abs="$(abs_path "$harness_root")"
  if is_product_root_path "$target" "$harness_root"; then
    echo "错误: 目标路径不能是 cyning-harness 产品包自身: ${harness_abs}" >&2
    echo "提示: 在业务仓升级；或在产品包目录运行 wizard/upgrade.sh 按提示输入业务仓路径。" >&2
    exit 1
  fi
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

# 从 profile 读取 preset 名（无 jq）
profile_preset_name() {
  local file="$1"
  grep '"preset"' "$file" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/'
}

# 从 profile 拼 IDE 勾选展示
profile_ide_summary() {
  local file="$1"
  local parts=()
  if grep -q '"ide_cursor"[[:space:]]*:[[:space:]]*true' "$file"; then parts+=("cursor"); fi
  if grep -q '"ide_claude"[[:space:]]*:[[:space:]]*true' "$file"; then parts+=("claude"); fi
  if grep -q '"ide_agents"[[:space:]]*:[[:space:]]*true' "$file"; then parts+=("agents"); fi
  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "（无 IDE 轨启用）"
  else
    local IFS=,
    echo "${parts[*]}"
  fi
}

prompt_yes_no() {
  local prompt="$1" default="${2:-n}"
  local hint="y/N"
  if [[ "$default" == "y" ]]; then hint="Y/n"; fi
  local ans=""
  read -r -p "$prompt [$hint]: " ans
  ans="${ans:-$default}"
  [[ "$ans" =~ ^[yY] ]]
}

profile_json_bool() {
  local file="$1" key="$2"
  grep -q "\"$key\"[[:space:]]*:[[:space:]]*true" "$file"
}

profile_track_enabled() {
  local file="$1" key="$2" default="${3:-false}"
  if ! grep -q "\"$key\"" "$file"; then
    [[ "$default" == "true" ]]
    return
  fi
  profile_json_bool "$file" "$key"
}

profile_ide_cursor_rel() {
  local file="$1" rel=""
  if grep -q '"paths"' "$file"; then
    rel="$(sed -n '/"paths"/,/^  \}/p' "$file" | grep '"ide_cursor"' | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/')"
  fi
  [[ -z "$rel" ]] && rel=".cursor/rules/06-harness-pointer.mdc"
  echo "$rel"
}

# 从 CLAUDE.md / AGENTS.md 剥离 Harness marker 块；若仅剩空文件则删除
remove_harness_marker_file() {
  local dst="$1"
  if [[ ! -f "$dst" ]]; then
    return 0
  fi
  if ! grep -qF "$MARKER_BEGIN" "$dst"; then
    return 0
  fi
  local tmp_out
  tmp_out="$(mktemp)"
  awk -v begin="$MARKER_BEGIN" -v end="$MARKER_END" '
    BEGIN { inblock = 0 }
    index($0, begin) { inblock = 1; next }
    inblock {
      if (index($0, end)) inblock = 0
      next
    }
    { print }
  ' "$dst" > "$tmp_out"
  if [[ ! -s "$tmp_out" ]]; then
    rm -f "$dst" "$tmp_out"
    echo "  已删除（仅剩 Harness 内容）: $dst"
  else
    mv "$tmp_out" "$dst"
    echo "  已剥离 marker 块: $dst"
  fi
}
