# cyning-harness · VersionManifest 读写（source 用）
# shellcheck shell=bash

manifest_file_path() {
  echo "$1/.cyning-harness/manifest.json"
}

# 从 profile.json 推导 IDE 列表
manifest_ide_from_profile() {
  local profile="$1"
  local parts=()
  if grep -q '"ide_cursor"[[:space:]]*:[[:space:]]*true' "$profile"; then parts+=("cursor"); fi
  if grep -q '"ide_claude"[[:space:]]*:[[:space:]]*true' "$profile"; then parts+=("claude"); fi
  if grep -q '"ide_agents"[[:space:]]*:[[:space:]]*true' "$profile"; then parts+=("agents"); fi
  local IFS=,
  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "[]"
  else
    local json="["
    local first=1
    for p in "${parts[@]}"; do
      [[ $first -eq 1 ]] || json+=","
      json+="\"$p\""
      first=0
    done
    json+="]"
    echo "$json"
  fi
}

# 将逗号 IDE 列表转为 JSON 数组
manifest_ide_json_from_list() {
  local ide_list="$1"
  if [[ -z "$ide_list" ]]; then
    echo "[]"
    return
  fi
  local json="["
  local first=1
  IFS=',' read -ra parts <<< "$ide_list"
  for raw in "${parts[@]}"; do
    local p="${raw// /}"
    [[ -n "$p" ]] || continue
    [[ $first -eq 1 ]] || json+=","
    json+="\"$p\""
    first=0
  done
  json+="]"
  echo "$json"
}

manifest_now_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# init 后写入 manifest（VersionManifest）
write_manifest_init() {
  local target="$1" version="$2" preset="$3" ide_list="$4" profile="$5"
  local mf ide_json now
  mf="$(manifest_file_path "$target")"
  now="$(manifest_now_utc)"
  if [[ -n "$ide_list" ]]; then
    ide_json="$(manifest_ide_json_from_list "$ide_list")"
  else
    ide_json="$(manifest_ide_from_profile "$profile")"
  fi
  mkdir -p "$target/.cyning-harness"
  cat > "$mf" <<EOF
{
  "version": "$version",
  "preset": "$preset",
  "ide": $ide_json,
  "from_version": null,
  "upgraded_at": "$now"
}
EOF
  echo "已写入 manifest: $mf"
}

# upgrade apply 后更新 manifest
write_manifest_upgrade() {
  local target="$1" version="$2"
  local mf now from_ver preset ide_json
  mf="$(manifest_file_path "$target")"
  now="$(manifest_now_utc)"
  from_ver="null"
  preset="$(profile_preset_name "$target/.cyning-harness/profile.json")"
  ide_json="$(manifest_ide_from_profile "$target/.cyning-harness/profile.json")"

  if [[ -f "$mf" ]]; then
    local old_ver
    old_ver="$(grep '"version"' "$mf" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/')"
    if [[ -n "$old_ver" && "$old_ver" != "$version" ]]; then
      from_ver="\"$old_ver\""
    fi
    preset="$(grep '"preset"' "$mf" | head -1 | sed -E 's/.*:[[:space:]]*"([^"]+)".*/\1/' || echo "$preset")"
  fi

  mkdir -p "$target/.cyning-harness"
  cat > "$mf" <<EOF
{
  "version": "$version",
  "preset": "$preset",
  "ide": $ide_json,
  "from_version": $from_ver,
  "upgraded_at": "$now"
}
EOF
  echo "已更新 manifest: $mf"
}
