#!/usr/bin/env bash
# 上游 Issue 扫描（gh CLI · 无 Agent）
# 用途：OSS fork 选题 · 检查 PR 占坑 · 可落盘 Markdown 报告
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRESETS_FILE="${PRESETS_FILE:-$SCRIPT_DIR/profiles/issue-scan-presets.json}"

REPO=""
STATE="open"
LIMIT=120
LABELS=()
EXCLUDE_ISSUES=()
CHECK_PR=1
ONLY_NO_PR=0
USER_SET_CHECK_PR=0
USER_SET_ONLY_NO_PR=0
USER_SET_LIMIT=0
USER_SET_STATE=0
USER_SET_REPO=0
FORMAT="table"
OUTPUT=""
SEARCH_EXTRA=""
PRESET=""

usage() {
  cat <<'EOF'
用法:

  scan-upstream-issues.sh --repo OWNER/NAME [选项]

  scan-upstream-issues.sh --preset kimi-c2-candidate
  scan-upstream-issues.sh --preset kimi-open-bug --limit 20

选项:
  --repo OWNER/NAME       目标仓库（必填，除非 --preset 内含）
  --preset NAME           读取 profiles/issue-scan-presets.json
  --state open|closed|all 默认 open
  --label NAME            可重复；与 gh label 过滤一致
  --limit N               默认 120（gh 自动分页；2026-06 kimi-code open 约 118）
  --exclude-issues N,N    跳过已知 issue 号（如 565,566）
  --check-pr              为每条 issue 查关联 PR（默认开启）
  --no-check-pr           不查 PR（更快）
  --only-no-pr            仅输出「无 open PR」的 issue
  --search QUERY          追加 gh issue list 搜索词
  --format table|markdown|json|text
  --output PATH           写入文件（markdown/json 推荐）
  --presets-file PATH     自定义预设 JSON

预设（profiles/issue-scan-presets.json）:
  kimi-open-bug        open + label bug
  kimi-c2-candidate    open + bug + 排除 565/566 + only-no-pr
  kimi-open-all        open 全标签
  kimi-open-enhancement open + enhancement

依赖: gh（已 auth）、jq

示例:
  "$CYNING_HARNESS/wizard/scan-upstream-issues.sh" --preset kimi-c2-candidate \
    --format markdown --output /tmp/kimi-scan.md

  "$CYNING_HARNESS/wizard/scan-upstream-issues.sh" \
    --repo MoonshotAI/kimi-code --state open --label bug --check-pr --limit 15
EOF
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "错误: 需要 $1" >&2; exit 1; }
}

load_preset() {
  local name="$1"
  [[ -f "$PRESETS_FILE" ]] || { echo "错误: 无预设文件 $PRESETS_FILE" >&2; exit 1; }
  local data
  data="$(jq -r --arg p "$name" '.presets[$p] // empty' "$PRESETS_FILE")"
  [[ -n "$data" && "$data" != "null" ]] || {
    echo "错误: 未知 preset '$name'" >&2
    jq -r '.presets | keys[]' "$PRESETS_FILE" | sed 's/^/  - /' >&2
    exit 1
  }

  if [[ "$USER_SET_REPO" == 0 ]]; then REPO="$(jq -r '.repo // empty' <<<"$data")"; fi
  if [[ "$USER_SET_STATE" == 0 ]]; then STATE="$(jq -r '.state // "open"' <<<"$data")"; fi
  if [[ "$USER_SET_LIMIT" == 0 ]]; then LIMIT="$(jq -r '.limit // 30' <<<"$data")"; fi
  if [[ "$USER_SET_CHECK_PR" == 0 ]]; then
    CHECK_PR="$(jq -r '.check_pr // true' <<<"$data")"
    if [[ "$CHECK_PR" == "true" ]]; then CHECK_PR=1; else CHECK_PR=0; fi
  fi
  if [[ "$USER_SET_ONLY_NO_PR" == 0 ]]; then
    ONLY_NO_PR="$(jq -r '.only_no_pr // false' <<<"$data")"
    if [[ "$ONLY_NO_PR" == "true" ]]; then ONLY_NO_PR=1; else ONLY_NO_PR=0; fi
  fi

  if [[ ${#LABELS[@]} -eq 0 ]]; then
    local preset_labels
    preset_labels="$(jq -r '.labels[]? // empty' <<<"$data")"
    while IFS= read -r lb; do
      [[ -n "$lb" ]] && LABELS+=("$lb")
    done <<<"$preset_labels"
  fi

  if [[ ${#EXCLUDE_ISSUES[@]} -eq 0 ]]; then
    local preset_exclude
    preset_exclude="$(jq -r '.exclude_issues[]? // empty' <<<"$data")"
    while IFS= read -r num; do
      [[ -n "$num" ]] && EXCLUDE_ISSUES+=("$num")
    done <<<"$preset_exclude"
  fi
}

is_excluded() {
  local n="$1"
  [[ ${#EXCLUDE_ISSUES[@]} -eq 0 ]] && return 1
  for e in "${EXCLUDE_ISSUES[@]}"; do
    [[ "$e" == "$n" ]] && return 0
  done
  return 1
}

find_prs_for_issue() {
  local num="$1"
  # 搜索标题/正文含 issue 号的 PR；可能有多条
  gh pr list --repo "$REPO" --search "$num in:title,body" --state all \
    --limit 5 --json number,state,title,url 2>/dev/null || echo '[]'
}

labels_to_string() {
  jq -r '[.labels[]?.name] | join(", ")' <<<"$1"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; USER_SET_REPO=1; shift 2 ;;
    --preset) PRESET="$2"; shift 2 ;;
    --state) STATE="$2"; USER_SET_STATE=1; shift 2 ;;
    --label) LABELS+=("$2"); shift 2 ;;
    --limit) LIMIT="$2"; USER_SET_LIMIT=1; shift 2 ;;
    --exclude-issues)
      IFS=',' read -ra _ex <<<"$2"
      EXCLUDE_ISSUES+=("${_ex[@]}")
      shift 2
      ;;
    --check-pr) CHECK_PR=1; USER_SET_CHECK_PR=1; shift ;;
    --no-check-pr) CHECK_PR=0; USER_SET_CHECK_PR=1; shift ;;
    --only-no-pr) ONLY_NO_PR=1; USER_SET_ONLY_NO_PR=1; shift ;;
    --search) SEARCH_EXTRA="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --output) OUTPUT="$2"; shift 2 ;;
    --presets-file) PRESETS_FILE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

[[ -n "$PRESET" ]] && load_preset "$PRESET"
[[ -n "$REPO" ]] || { echo "错误: 须指定 --repo 或 --preset" >&2; exit 1; }

need_cmd gh
need_cmd jq

GH_ARGS=(issue list --repo "$REPO" --state "$STATE" --limit "$LIMIT")
GH_ARGS+=(--json number,title,labels,createdAt,url)
if [[ ${#LABELS[@]} -gt 0 ]]; then
  for lb in "${LABELS[@]}"; do
    GH_ARGS+=(--label "$lb")
  done
fi
if [[ -n "$SEARCH_EXTRA" ]]; then
  GH_ARGS+=(--search "$SEARCH_EXTRA")
fi

ISSUES_JSON="$(gh "${GH_ARGS[@]}")"
ISSUE_COUNT="$(jq 'length' <<<"$ISSUES_JSON")"

# 逐条 enrich：PR 占坑（勿用 for+$(jq) 以免标题空格拆碎 JSON）
RESULTS='[]'
while IFS= read -r row; do
  [[ -z "$row" ]] && continue
  num="$(jq -r '.number' <<<"$row")"
  if is_excluded "$num"; then continue; fi

  prs_json='[]'
  pr_open=0
  pr_summary=""
  if [[ "$CHECK_PR" == 1 ]]; then
    prs_json="$(find_prs_for_issue "$num")"
    pr_open="$(jq '[.[] | select(.state=="OPEN")] | length' <<<"$prs_json")"
    pr_summary="$(jq -r '[.[] | "#\(.number)(\(.state))"] | join(", ")' <<<"$prs_json")"
    if [[ -z "$pr_summary" ]]; then pr_summary="—"; fi
  else
    pr_summary="(未检查)"
  fi

  if [[ "$ONLY_NO_PR" == 1 && "$pr_open" -gt 0 ]]; then continue; fi

  enriched="$(jq -c --argjson prs "$prs_json" --arg prs_summary "$pr_summary" \
    --argjson pr_open "$pr_open" \
    '. + {linked_prs: $prs, pr_summary: $prs_summary, pr_open_count: $pr_open}' <<<"$row")"
  RESULTS="$(jq -c --argjson e "$enriched" '. + [$e]' <<<"$RESULTS")"
done < <(jq -c '.[]' <<<"$ISSUES_JSON")

FILTERED_COUNT="$(jq 'length' <<<"$RESULTS")"
SCAN_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

emit_table() {
  printf "=== Issue scan ===\n"
  printf "repo: %s | state: %s | fetched: %s | shown: %s (excluded/filtered)\n" \
    "$REPO" "$STATE" "$ISSUE_COUNT" "$FILTERED_COUNT"
  local labels_display="（无）"
  if [[ ${#LABELS[@]} -gt 0 ]]; then
    labels_display="$(IFS=,; echo "${LABELS[*]}")"
  fi
  printf "labels: %s | check_pr: %s | only_no_pr: %s\n" \
    "$labels_display" "$CHECK_PR" "$ONLY_NO_PR"
  printf "\n"
  printf "%-6s %-12s %-8s %s\n" "#" "labels" "PR" "title"
  printf "%-6s %-12s %-8s %s\n" "------" "------------" "--------" "-----"
  jq -r '.[] | [
    (.number|tostring),
    ([.labels[]?.name] | join(",")),
    .pr_summary,
    .title
  ] | @tsv' <<<"$RESULTS" | while IFS=$'\t' read -r num labs prs title; do
    printf "%-6s %-12s %-8s %s\n" "$num" "$labs" "$prs" "$title"
  done
}

emit_json() {
  jq -n \
    --arg repo "$REPO" \
    --arg state "$STATE" \
    --arg scanned_at "$SCAN_TIME" \
    --argjson fetched "$ISSUE_COUNT" \
    --argjson shown "$FILTERED_COUNT" \
    --argjson issues "$RESULTS" \
    '{repo: $repo, state: $state, scanned_at: $scanned_at, fetched: $fetched, shown: $shown, issues: $issues}'
}

emit_markdown() {
  local labels_display="（无）"
  if [[ ${#LABELS[@]} -gt 0 ]]; then
    labels_display="$(IFS=,; echo "${LABELS[*]}")"
  fi
  cat <<EOF
# Issue scan · ${REPO}

| 项 | 值 |
|----|-----|
| **扫描时间** | ${SCAN_TIME} |
| **state** | ${STATE} |
| **labels** | ${labels_display:-（无）} |
| **gh 拉取** | ${ISSUE_COUNT} 条 |
| **输出** | ${FILTERED_COUNT} 条 |
| **check_pr** | ${CHECK_PR} |
| **only_no_pr** | ${ONLY_NO_PR} |
| **preset** | ${PRESET:-（无）} |

## 结果

| # | labels | linked PR | title |
|---|--------|-----------|-------|
EOF
  jq -r '.[] | "| [\(.number)](\(.url)) | \([.labels[]?.name] | join(", ")) | \(.pr_summary) | \(.title | gsub("|"; "/")) |"' \
    <<<"$RESULTS"
  cat <<EOF

---

_由 \`cyning-harness/wizard/scan-upstream-issues.sh\` 生成_
EOF
}

OUTPUT_BODY=""
case "$FORMAT" in
  table) OUTPUT_BODY="$(emit_table)" ;;
  text) OUTPUT_BODY="$(emit_table)" ;;
  json) OUTPUT_BODY="$(emit_json)" ;;
  markdown) OUTPUT_BODY="$(emit_markdown)" ;;
  *) echo "错误: 未知 format $FORMAT（可用 table|text|markdown|json）" >&2; exit 1 ;;
esac

if [[ -n "$OUTPUT" ]]; then
  printf '%s\n' "$OUTPUT_BODY" >"$OUTPUT"
  echo "已写入: $OUTPUT (${FILTERED_COUNT} issues)" >&2
else
  printf '%s\n' "$OUTPUT_BODY"
fi
