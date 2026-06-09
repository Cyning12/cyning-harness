# Changelog

本仓库遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.0] - 2026-06-09

**freeze_id**: `freeze_cyning_harness_v0_1`

### Added

- **T1 图谱轨** `graph/templates/`：`00_main` 双轨、`01_struct` 模块表、`99_mermaid_protocol`、`10_flow_MAIN` 示例
- **T2 规范轨** `standards/`：L1/L2 TEMPLATE、`SOURCES`、`POINTER_workspace_truth`（不复制 Ink 全文）
- **T3 过程轨** `harness/templates/` · `prompts/` · `invokes/TEMPLATE_invoke`；`TASK_graph_bootstrap` 含 **HG-GRAPH-MODULES**
- **T4 Verify 轨** `ci/samples/`：`quality.yml.example`、`pytest.yml.example`
- **T5 IDE + wizard**：`cursor-harness-starter.mdc.example` · `wizard/ONBOARDING_wizard_v1_zh.md`
- **T6 golden**：`POINTER_gold_epic_serial.md` 链 M1 Epic（只读 POINTER）

### Changed

- 各轨 README 清单更新为 v0.1 已交付

## [0.0.1] - 2026-06-09

### Added

- 初始架构与 README（无业务代码、无内置 LLM）
