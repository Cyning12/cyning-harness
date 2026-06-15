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

# 安装向导 · preset 代号菜单（交互仅 1/2；CLI --preset 仍可用 profiles 下任意 json）
print_preset_menu() {
  cat <<'EOF'
preset 代号（回车=1）:

  1  harness-only
     · 仅 Harness 过程轨：prompts、invoke 模板、IDE 入口（Cursor / Claude / Agents）
     · 不写入图谱 / wiki / standards / CI；不覆盖已有业务 task / reviews / by-task invoke
     · 适合：kimi-code-meta、任意仓只要 SDD 帽子链与 invoke 纪律

  2  fullstack-node-py
     · Ink 类全栈五轨：图谱模板 + coding_wiki + L1/L2 规范 + Harness 过程轨 + Cursor
     · 附带 .github/workflows/quality.yml + pytest.yml（Next 前端 + Python API 后端 CI 样例）
     · 适合：ai-ink-brain + api-python 同类前后端分仓或 monorepo

  亦可输入全称：harness-only / fullstack-node-py
EOF
}

# 将代号或全称解析为 preset 文件名（不含 .json）
resolve_preset_choice() {
  local input="$1"
  local profiles_dir="${2:-}"
  case "${input:-1}" in
    1|h|harness|harness-only) echo "harness-only"; return ;;
    2|fs|full|fullstack|fullstack-node-py) echo "fullstack-node-py"; return ;;
  esac
  if [[ -n "$profiles_dir" && -f "$profiles_dir/${input}.json" ]]; then
    echo "$input"
    return
  fi
  echo "未知 preset 代号: $input（交互可用 1 或 2，或输入全称）" >&2
  exit 1
}

# 安装向导 · IDE 代号菜单
print_ide_menu() {
  cat <<'EOF'
IDE 代号（回车=1 全部）:
  1  全部（cursor + claude + agents）
  2  仅 cursor
  3  仅 claude
  4  仅 agents
  可组合: 2,3 或 c,cl,a
EOF
}

# 将代号解析为 install --ide 逗号列表
resolve_ide_choice() {
  local input="${1:-1}"
  local want_cursor=false want_claude=false want_agents=false

  if [[ -z "$input" || "$input" == "1" || "$input" == "all" ]]; then
    echo "cursor,claude,agents"
    return
  fi

  IFS=',' read -ra parts <<< "$input"
  for raw in "${parts[@]}"; do
    local p="${raw// /}"
    case "$p" in
      1|all) want_cursor=true; want_claude=true; want_agents=true ;;
      2|c|cursor) want_cursor=true ;;
      3|cl|claude) want_claude=true ;;
      4|a|agents) want_agents=true ;;
      *) echo "未知 IDE 代号: $p（可用 1–4 或 c/cl/a）" >&2; exit 1 ;;
    esac
  done

  local out=()
  [[ "$want_cursor" == true ]] && out+=("cursor")
  [[ "$want_claude" == true ]] && out+=("claude")
  [[ "$want_agents" == true ]] && out+=("agents")
  if [[ ${#out[@]} -eq 0 ]]; then
    echo "未选择任何 IDE" >&2
    exit 1
  fi
  local IFS=,
  echo "${out[*]}"
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
# S5 · sync/apply 前检测 Git 工作区干净（v0.3+）
# 非 git 仓跳过；--force 或 HARNESS_SYNC_FORCE=1 跳过
check_git_clean() {
  local target="$1" force="${2:-0}"
  if [[ "$force" == "1" || "${HARNESS_SYNC_FORCE:-0}" == "1" ]]; then
    return 0
  fi
  if ! git -C "$target" rev-parse --git-dir >/dev/null 2>&1; then
    return 0
  fi
  if git -C "$target" diff --quiet 2>/dev/null && git -C "$target" diff --cached --quiet 2>/dev/null; then
    return 0
  fi
  echo "错误(S5): Git 工作区不干净，sync apply 已中止。" >&2
  echo "请先 commit/stash，或使用 --force / HARNESS_SYNC_FORCE=1" >&2
  git -C "$target" status --short >&2 || true
  exit 1
}

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
