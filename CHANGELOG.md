# Changelog

本仓库遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.2.1] - 2026-06-13

### Added

- **done 分层索引模板**：`TASK_done_README.md` · `VIEW_done_by_domain.md` · `VIEW_done_thin_pointer.md` · `FRAGMENT_task_domain_infer_v1_zh.md`
- **`install.sh`**：创建 `done/<domain>/` 子目录 · 首次嵌入 Hub 与 `_views` 薄指针（文件不存在时）

### Changed

- `harness/templates/README.md`：关账纪律与嵌入步骤
- `docs/ONBOARDING.md` §6：task 关账与 done 分层索引

## [0.2.0] - 2026-06-11

### Added

- **D3 IDE 适配**：`ide/adapters/CLAUDE.md.fragment.example` · `AGENTS.md.fragment.example`（单源 POINTER）
- **`install.sh --ide`**：逗号列表 `cursor,claude,agents` → 写入 profile `tracks.ide_*`
- **`harness-sync.sh` marker merge**：`<!-- cyning-harness:begin/end -->` 合并至仓根 `CLAUDE.md` / `AGENTS.md`

### Changed

- `wizard/profiles/harness-only.json` · `fullstack-node-py.json`：增 `ide_claude` / `ide_agents`（默认 `false`）
- `ide/adapters/README.md` · `wizard/ONBOARDING_wizard_v1_zh.md` §3 · `docs/ONBOARDING.md`：v0.2 可执行勾选
- `wizard/README.md`：§1 增 `--ide` 示例
- `README.md` 当前版本 → **v0.2.0**

### Notes

- **backward-compat**：profile 无 `ide_claude`/`ide_agents` 时等同 v0.1.3（仅 `ide_cursor`）
- **freeze_id**：`freeze_cyning_harness_v0_2_d3`（tag 由 CLOSE 棒独立打）

## [0.1.3] - 2026-06-11

### Added

- **上游 PR task 模板**：`wizard/templates/TASK_TEMPLATE_upstream_pr_v1.md` — Harness 元信息 · 思考轮 §4 · 图谱闸 · 验收清单
- **思考回填 FRAGMENT**：`wizard/templates/FRAGMENT_rethink_backfill_task_v1_zh.md` — Agent 须写回 task §4 + **思考轮控制**；22 可退回 10 补思考
- **10/22 帽**：阶段 C task 预置 **R0+R1–R5** 五槽；可提前停/增轮须留 reason 与 residual_risks
- **扫描 preset**：`kimi-c3-candidate`（排除 #565/#566/#583 · 无 open PR）

### Changed

- `wizard/bootstrap-oss-fork-meta.sh`：初始化时复制 task 模板 + FRAGMENT 至 `docs/tasks/` · `docs/harness/`
- `examples/oss-fork/README.md`：§6 阶段 C3 工作流（思考回填 · 图谱闸 · PR 暂缓策略）
- `wizard/README.md` · `docs/ONBOARDING.md`：v0.1.3 · `kimi-c3-candidate` 交叉引用
- `wizard/scan-upstream-issues.sh`：`--format text` 作为 `table` 别名（修复 CLI 报错）

### Notes

- **试点证据**：MoonshotAI/kimi-code · C1 #622 merged · C2 #583 · C3 #580 local_done（PR 暂缓至 2026-06-13）
- **不含**：D3 `CLAUDE.md` / `AGENTS.md.fragment`（规划 v0.2）

## [0.1.2] - 2026-06-10

### Added

- **OSS fork 选题**：`wizard/scan-upstream-issues.sh` — `gh` + `jq` 扫描上游 issue、可选 PR 占坑检查、`table` / `markdown` / `json` 输出
- **扫描预设**：`wizard/profiles/issue-scan-presets.json`（`kimi-open-bug` · `kimi-c2-candidate` · `kimi-open-all` · `kimi-open-enhancement`；可自定义 `--repo`）
- **OSS fork 一键初始化**（v0.1.1 起累积、本版文档收口）：`wizard/bootstrap-oss-fork-meta.sh` · preset `oss-fork-meta` · 可选 `--stub-dir`
- **examples/oss-fork/**：kimi-code 图谱快照指针；**双 worktree** 拓扑与 issue 扫描说明

### Changed

- `wizard/README.md`：§4 上游 Issue 扫描 · OSS fork 工作流交叉引用
- `wizard/bootstrap-oss-fork-meta.sh`：完成提示含 worktree / `scan-upstream-issues` · 默认 `docs/tasks/done/`
- `examples/oss-fork/README.md`：过程轨 vs 产品 PR 纪律（v0.1.2）

### Notes

- **不含**：D3 `CLAUDE.md` / `AGENTS.md.fragment`（规划 v0.2）· Starter 仍 10/22/30
- **试点证据**：MoonshotAI/kimi-code fork · C1 PR #622 · 工作区 `ISSUE_SCAN_kimi_code_open_c2_v1_zh.md`

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
