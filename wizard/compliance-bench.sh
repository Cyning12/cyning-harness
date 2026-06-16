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

  --all     运行 S1–S4（默认输出含公理解释与摘要表）
  --quiet   CI/脚本模式：stdout 仅打印合规率数字；摘要说明走 stderr

说明：
  合规率 = PASS 场景数 ÷ 总场景数 × 100。
  100 表示 S1–S4 全部通过，即 gate-check / sync 行为符合 SDD 公理；
  不是 LLM 解题正确率，也不是业务项目胜率。

示例：
  ./wizard/compliance-bench.sh --all              # 维护者人工验收（推荐）
  ./wizard/compliance-bench.sh --quiet --all      # 关账勾选 / CI（解析 stdout 数字）
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

# 非 quiet → stdout 全量；quiet → 场景静默，摘要走 stderr
log() {
  if [[ "$QUIET" == "1" ]]; then
    echo "$@" >&2
  else
    echo "$@"
  fi
}

log_scenario() {
  [[ "$QUIET" == "1" ]] || echo "$@"
}

print_banner() {
  [[ "$QUIET" == "1" ]] && return 0
  log_scenario "╔══════════════════════════════════════════════════════════════╗"
  log_scenario "║  SDD-Compliance micro-bench · v1 · S1–S4                    ║"
  log_scenario "╚══════════════════════════════════════════════════════════════╝"
  log_scenario ""
  log_scenario "性质  机械合规测试 · 合成夹具 · 不调用 LLM"
  log_scenario "公理  D2 HumanGate · D3 30 前置闸 · S2 sync 域边界"
  log_scenario "夹具  $BENCH_DIR/"
  log_scenario "场景  ${SCENARIOS[*]}"
  log_scenario ""
}

PASS=0
FAIL=0
# 每行: id|status|detail
RESULTS=()

scenario_header() {
  local id="$1" title="$2" axiom="$3" fixture="$4" expect="$5"
  log_scenario "──────────────────────────────────────────────────────────────"
  log_scenario "[$id] $title"
  log_scenario "  公理    $axiom"
  log_scenario "  夹具    $fixture"
  log_scenario "  期望    $expect"
}

scenario_footer() {
  local id="$1" status="$2" detail="$3" explain="$4"
  if [[ "$status" == "PASS" ]]; then
    log_scenario "  结果    ✅ PASS · $detail"
  else
    log_scenario "  结果    ❌ FAIL · $detail"
  fi
  log_scenario "  说明    $explain"
  log_scenario ""
}

scenario_S1() {
  local dir="$BENCH_DIR/S1_r1_pending"
  scenario_header "S1" "R1 未签 · 30 应被拒" \
    "D2 HumanGate · D3 30 前置闸" \
    "examples/compliance_bench/S1_r1_pending/" \
    "HG-AUDIT-R1=pending 时 gate-check 必须 exit≠0（拒 30）"

  local gate_exit=0
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1 || gate_exit=$?

  if [[ "$gate_exit" -ne 0 ]]; then
    scenario_footer "S1" "PASS" "gate-check exit=$gate_exit" \
      "未审核任务不得进入 30 执行编码 · 人闸有效"
    PASS=$((PASS+1))
    RESULTS+=("S1|PASS|gate-check exit=$gate_exit · 30 被拒")
  else
    scenario_footer "S1" "FAIL" "gate-check exit=0" \
      "pending R1 仍放行 30 · 违反 D3 · 须修 gate-check"
    FAIL=$((FAIL+1))
    RESULTS+=("S1|FAIL|gate-check exit=0 · 未拦截 pending R1")
  fi
}

scenario_S2() {
  local dir="$BENCH_DIR/S2_r1_no_review"
  scenario_header "S2" "R1 已签但无 review 落盘" \
    "D2/D3 · 审核制品完整性" \
    "examples/compliance_bench/S2_r1_no_review/" \
    "task 表 HG-AUDIT-R1=approved 但 reviews/ 无 *_audit_R1_* → bench 判非合规"

  local gate_exit=0
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1 && gate_exit=0 || gate_exit=$?
  local review_exists=0
  [[ -n "$(find "$dir/reviews" -type f -name '*_audit_R1_*' 2>/dev/null)" ]] && review_exists=1 || true

  if [[ "$review_exists" == "0" ]]; then
    scenario_footer "S2" "PASS" "review 缺失 · gate-check exit=$gate_exit" \
      "仅改 task 表不算真审核 · 22 须落盘 review 文件（本夹具测 bench 判定逻辑）"
    PASS=$((PASS+1))
    RESULTS+=("S2|PASS|无 review 文件 · bench 判非合规")
  else
    scenario_footer "S2" "FAIL" "夹具不应含 review 文件" \
      "夹具数据错误 · 检查 S2_r1_no_review/reviews/"
    FAIL=$((FAIL+1))
    RESULTS+=("S2|FAIL|夹具含不应存在的 review")
  fi
}

scenario_S3() {
  local dir="$BENCH_DIR/S3_r1_with_review"
  scenario_header "S3" "R1 已签且 review 已落盘" \
    "D2/D3 · 审核闭环" \
    "examples/compliance_bench/S3_r1_with_review/" \
    "HG-AUDIT-R1=approved 且 reviews/*_audit_R1_* 存在 → gate-check exit=0"

  local gate_exit=0
  "$HARNESS_ROOT/wizard/gate-check.sh" --target "$dir" --task task.md >/dev/null 2>&1 && gate_exit=0 || gate_exit=$?
  local review_exists=0
  [[ -n "$(find "$dir/reviews" -type f -name '*_audit_R1_*' 2>/dev/null)" ]] && review_exists=1 || true

  if [[ "$gate_exit" == "0" && "$review_exists" == "1" ]]; then
    scenario_footer "S3" "PASS" "gate-check exit=0 · review 存在" \
      "审核链完整 · 允许进入 30（Happy Path 闸口）"
    PASS=$((PASS+1))
    RESULTS+=("S3|PASS|gate-check 放行 · review 落盘")
  else
    scenario_footer "S3" "FAIL" "gate_ok=$([[ $gate_exit -eq 0 ]] && echo 1 || echo 0) review=$review_exists" \
      "完整审核场景未通过 · 检查 gate-check 或夹具 review 路径"
    FAIL=$((FAIL+1))
    RESULTS+=("S3|FAIL|gate exit=$gate_exit review=$review_exists")
  fi
}

scenario_S4() {
  local dir="$BENCH_DIR/S4_sync_domain"
  scenario_header "S4" "sync plan 不得覆盖业务域" \
    "S2 · 纪律层与 task/reviews 分离" \
    "examples/compliance_bench/S4_sync_domain/ + 临时目标仓" \
    "harness-sync.sh plan 输出不得含 docs/tasks/ 或 docs/harness/reviews/"

  local tmp
  tmp="$(mktemp -d)"
  mkdir -p "$tmp/.cyning-harness"
  cp "$dir/profile.json" "$tmp/.cyning-harness/profile.json"
  mkdir -p "$tmp/docs/harness/prompts" "$tmp/docs/harness/invokes" "$tmp/.cursor/rules"

  local plan="$tmp/plan.txt"
  "$HARNESS_ROOT/wizard/harness-sync.sh" plan --target "$tmp" >"$plan" 2>&1 || true

  local bad=0 bad_lines=""
  if bad_lines="$(grep -E 'docs/tasks/|docs/harness/reviews/' "$plan" 2>/dev/null || true)" && [[ -n "$bad_lines" ]]; then
    bad=1
  fi
  rm -rf "$tmp"

  if [[ "$bad" == "0" ]]; then
    scenario_footer "S4" "PASS" "sync plan 无 task/reviews 路径" \
      "upgrade 不会覆盖用户 task 与审核记录 · S2 边界成立"
    PASS=$((PASS+1))
    RESULTS+=("S4|PASS|sync plan 未越界")
  else
    scenario_footer "S4" "FAIL" "plan 含 task/reviews 路径" \
      "sync 会污染业务数据 · 须修 harness-sync 写路径"
    FAIL=$((FAIL+1))
    RESULTS+=("S4|FAIL|plan 含 docs/tasks 或 reviews")
  fi
}

print_summary() {
  local total=$((PASS+FAIL))
  local rate=0
  [[ "$total" -gt 0 ]] && rate=$((PASS*100/total))

  log "══════════════════════════════════════════════════════════════"
  log "摘要 · SDD-Compliance bench"
  log "══════════════════════════════════════════════════════════════"
  log "$(printf '%-6s %-10s %s' '场景' '结果' '详情')"
  for r in "${RESULTS[@]}"; do
    IFS='|' read -r id status detail <<<"$r"
    local mark="✅"
    [[ "$status" == "FAIL" ]] && mark="❌"
    log "$(printf '%-6s %-8s %s' "$id" "$mark $status" "$detail")"
  done
  log ""
  log "合规率  $PASS/$total = ${rate}%"
  log ""
  if [[ "$FAIL" -eq 0 ]]; then
    log "解读    ${rate} = 全部 ${total} 个场景行为符合 SDD 公理（gate-check / sync 回归通过）"
    log "        不是 LLM 解题分数 · 不是业务 CI 绿率 · 不可外推为「AI 胜率」"
  else
    log "解读    ${rate} = ${FAIL} 个场景未通过 · 须修 gate-check / sync 或夹具后再跑"
    log "        失败场景见上表 ❌ 行"
  fi
  log ""
  log "用途    发布关账证据 · 改 wizard 脚本后回归 · 与 B2 试点 retro 互补"
  log "文档    examples/compliance_bench/README.md"
  log "══════════════════════════════════════════════════════════════"

  # quiet 模式：stdout 仅数字（供 CI / 勾选表解析）
  if [[ "$QUIET" == "1" ]]; then
    echo "$rate"
  fi
}

print_banner

for s in "${SCENARIOS[@]}"; do
  case "$s" in
    S1) scenario_S1 ;;
    S2) scenario_S2 ;;
    S3) scenario_S3 ;;
    S4) scenario_S4 ;;
  esac
done

print_summary

[[ "$FAIL" -eq 0 ]]
