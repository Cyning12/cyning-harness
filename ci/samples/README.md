# ci/samples · Verify 轨

复制并改写为用户仓 **`.github/workflows/`** workflow。

## v0.1 已交付（T4 · M2）

| 样例 | 状态 | 适用栈 | 三门禁 |
|------|------|--------|--------|
| [`quality.yml.example`](./quality.yml.example) | ✅ | Node/TS · Next 等 | install → lint → test → build |
| [`pytest.yml.example`](./pytest.yml.example) | ✅ | Python · FastAPI 等 | install → pytest |

## 嵌入步骤

```bash
mkdir -p .github/workflows
cp cyning-harness/ci/samples/quality.yml.example .github/workflows/quality.yml
# 或
cp cyning-harness/ci/samples/pytest.yml.example .github/workflows/pytest.yml
```

按 `package.json` / `requirements.txt` / Node 版本 / env 变量 **裁剪注释块**。

## 金样 POINTER（Ink · 只读对照）

| 栈 | 路径（工作区） |
|----|----------------|
| 前端 | `ai-ink-brain/.github/workflows/quality.yml` |
| 后端 | `ai-ink-brain-api-python/.github/workflows/pytest.yml` |

Ink workflow 含图谱 export、跨仓 checkout 等 **业务专有** 步骤；Starter 样例为 **最小三门禁**，按需从金样增量合并。

## 与 Harness 关系

- task `test_strategy: required` → 本地/CI 须与 workflow 命令一致
- L2 模板 CI 对齐节：[`standards/TEMPLATE_CODING_BASELINE_L2_*.md`](../standards/)
- ONBOARDING §5：五轨检查清单含 CI 样例已适配

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-06-09 | T4 M2 首版样例 |
