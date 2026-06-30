#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATES_DIR="${REPO_ROOT}/graph/templates"

echo "== verify-template-compile =="
echo "repo_root: ${REPO_ROOT}"
echo "templates_dir: ${TEMPLATES_DIR}"
echo ""

# 1. 检查 js-yaml 是否可解析
cd "${REPO_ROOT}"

# 2. 运行编译脚本的 --check 模式
echo "-- 1/3 运行 graph_yaml_compile.js --check --"
node scripts/graph_yaml_compile.js --check

echo ""
echo "-- 2/3 检查无残留 .ai.md --"
AI_MD_FILES=$(find "${TEMPLATES_DIR}" -maxdepth 1 -name '*.ai.md' -print || true)
if [ -n "${AI_MD_FILES}" ]; then
  echo "ERROR: 发现残留 .ai.md 文件："
  echo "${AI_MD_FILES}"
  exit 1
fi
echo "OK：未在 ${TEMPLATES_DIR} 下发现 .ai.md"

echo ""
echo "-- 3/3 检查每个 .graph.yaml 都有同名 .md --"
MISSING=0
for yaml_file in "${TEMPLATES_DIR}"/*.graph.yaml; do
  [ -e "${yaml_file}" ] || continue
  base=$(basename "${yaml_file}" .graph.yaml)
  expected_md="${TEMPLATES_DIR}/${base}.md"
  if [ ! -f "${expected_md}" ]; then
    echo "ERROR: ${yaml_file} 缺少生成物 ${expected_md}"
    MISSING=1
  else
    echo "OK: ${base}.graph.yaml -> ${base}.md"
  fi
done

if [ "${MISSING}" -ne 0 ]; then
  exit 1
fi

echo ""
echo "== verify-template-compile PASSED =="
