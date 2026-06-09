# Changelog

本仓库遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.1.1] - 2026-06-09

### Added

- **人工闸 P0**（ios_buy 事故跟进）：`HG-AUDIT-R1` 写入 Cursor 规则 · `30` 拒开工 STOP 模板 · `22` pending 时不附 30 Prompt
- **wizard 脚本**：`install.sh` · `harness-sync.sh`（plan/apply）· `gate-check.sh` · `profiles/*.json`

### Changed

- `harness/prompts/30-execute-code.md`：输入改为「22 通过 **且** AUDIT approved」；强制首输出闸扫描
- `ide/adapters/cursor-harness-starter.mdc.example`：并列 `HG-AUDIT-R1` 与 `HG-GRAPH-MODULES`

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
