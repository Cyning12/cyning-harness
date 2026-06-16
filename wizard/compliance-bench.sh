#!/usr/bin/env bash
# SDD-Compliance micro-bench · v1 · S1–S4
# 输出合规率 %；不测 LLM 解题，只测 Orchestrate/Verify 可机械部分。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BENCH_DIR="$HARNESS_ROOT/examples/compliance_bench"

SCENARIOS=()
QUIET=0

usage() {
  cat <<'EOF'
用法：compliance-bench.sh [--all | S1 S2 S3 S4] [--quiet]

  --all     运行 S1–S4
  --quiet   仅输出最终合规率
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) SCENARIOS=(S1 S2 S3 S4); shift ;;
    --quiet) QUIET=1; shift ;;
    S1|S2|S3|S4) SCENARIOS+=("$1"); shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数: $1" >&2; usage; exit 1 ;;
  esac
done

[[ ${#SCENARIOS[@]} -gt 0 ]] || { usage; exit 1; }

log() { [[ "$QUIET" == "1" ]] || echo "$@"; }

PASS=0
FAIL=0
RESULTS=()

run_gate() {
  local target="$1" task="$2"
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$target" --task "$task" >/dev/null 2>&1 || true
  # 返回实际 exit code
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$target" --task "$task" >/dev/null 2>&1
}

scenario_S1() {
  local dir="$BENCH_DIR/S1_r1_pending"
  log "=== S1 · R1 pending 即 30（应拒） ==="
  if ! "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1; then
    log "S1 PASS · gate-check 非零，30 被拒"
    PASS=$((PASS+1))
    RESULTS+=("S1|PASS")
  else
    log "S1 FAIL · gate-check exit 0，未拦截 pending R1"
    FAIL=$((FAIL+1))
    RESULTS+=("S1|FAIL")
  fi
}

scenario_S2() {
  local dir="$BENCH_DIR/S2_r1_no_review"
  log "=== S2 · R1 approved 但无 review 文件（应非合规） ==="
  local gate_ok=0
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1 && gate_ok=1 || true
  local review_exists=0
  [[ -n "$(find "$dir/reviews" -type f -name '*_audit_R1_*' 2>/dev/null)" ]] && review_exists=1 || true

  if [[ "$review_exists" == "0" ]]; then
    log "S2 PASS · review 文件缺失 → 非合规（gate-check exit=$gate_ok）"
    PASS=$((PASS+1))
    RESULTS+=("S2|PASS")
  else
    log "S2 FAIL · 不应存在 review 文件"
    FAIL=$((FAIL+1))
    RESULTS+=("S2|FAIL")
  fi
}

scenario_S3() {
  local dir="$BENCH_DIR/S3_r1_with_review"
  log "=== S3 · R1 approved + review 落盘（应合规） ==="
  local gate_ok=0
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1 && gate_ok=1 || true
  local review_exists=0
  [[ -n "$(find "$dir/reviews" -type f -name '*_audit_R1_*' 2>/dev/null)" ]] && review_exists=1 || true

  if [[ "$gate_ok" == "1" && "$review_exists" == "1" ]]; then
    log "S3 PASS · gate-check exit 0 且 review 文件存在"
    PASS=$((PASS+1))
    RESULTS+=("S3|PASS")
  else
    log "S3 FAIL · gate_ok=$gate_ok review_exists=$review_exists"
    FAIL=$((FAIL+1))
    RESULTS+=("S3|FAIL")
  fi
}

scenario_S4() {
  local dir="$BENCH_DIR/S4_sync_domain"
  log "=== S4 · sync plan 不得含 task/reviews 路径 ==="
  # 构造临时目标仓结构
  local tmp
  tmp="$(mktemp -d)"
  mkdir -p "$tmp/.cyning-harness"
  cp "$dir/profile.json" "$tmp/.cyning-harness/profile.json"
  mkdir -p "$tmp/docs/harness/prompts" "$tmp/docs/harness/invokes" "$tmp/.cursor/rules"

  local plan
  plan="$tmp/plan.txt"
  "$HARNESS_ROOT/wizard/harness-sync.sh" plan --target "$tmp" >"$plan" 2>&1 || true

  local bad=0
  if grep -E 'docs/tasks/|docs/harness/reviews/' "$plan" >/dev/null 2>&1; then
    bad=1
  fi
  rm -rf "$tmp"

  if [[ "$bad" == "0" ]]; then
    log "S4 PASS · sync plan 未包含 task/reviews 路径"
    PASS=$((PASS+1))
    RESULTS+=("S4|PASS")
  else
    log "S4 FAIL · sync plan 包含不应同步的 task/reviews 路径"
    FAIL=$((FAIL+1))
    RESULTS+=("S4|FAIL")
  fi
}

for s in "${SCENARIOS[@]}"; do
  case "$s" in
    S1) scenario_S1 ;;
    S2) scenario_S2 ;;
    S3) scenario_S3 ;;
    S4) scenario_S4 ;;
  esac
done

TOTAL=$((PASS+FAIL))
RATE=0
[[ "$TOTAL" -gt 0 ]] && RATE=$((PASS*100/TOTAL))

log ""
log "=== SDD-Compliance bench summary ==="
for r in "${RESULTS[@]}"; do
  IFS='|' read -r id status <<<"$r"
  log "$id: $status"
done
log "合规率: $PASS/$TOTAL = $RATE%"

# 静默模式仅输出数字
if [[ "$QUIET" == "1" ]]; then
  echo "$RATE"
fi

[[ "$FAIL" -eq 0 ]]
