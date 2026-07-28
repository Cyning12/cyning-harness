# Changelog

本仓库遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.18.1] - 2026-07-28

### Added

- **USER_GUIDE §6.0b**：升级后 `wiki_delta` 存量迁移专节（`n/a` / `none` / `path` 决策树 · `rg -L` 扫描建议 · schema 字符串说明）。
- **coding_wiki/templates**：`stable` / `context` / `volatile` 最小 `[[wikilink]]` 互链样例，避免拷贝后 `wiki export` 空边（dogfood F-218-05）。

### Changed

- **ONBOARDING**：明示 `upgrade` **不**代写业务 task 元信息；破坏性迁移链到 USER_GUIDE §6.0b。
- **CHECKLIST_acceptance_2.18.0**：批注 web dogfood 对照（非最终人签）。

### Notes

- 消费者回填：`cyning-harness-web` FEEDBACK F-218-01..05 · **无** severity=block。
- **F-218-01**：本版以文档缓解（verify WARN ≠ 已迁移）；**CLI lint/list 缺 wiki_delta → 规划 2.19.0**，本版不做。
- **F-218-04**：保持 `schema: harness.wiki_graph.v1` 单字符串；不加 `schema_version`。
- **破坏性（仍自 2.18.0）**：存量 task 须自补 `wiki_delta`；`upgrade` 不代写。
- **已发布**：`@cyning/harness@2.18.1`（npm `latest` · 2026-07-28）· tag `v2.18.1` 已推送

## [2.18.0] - 2026-07-28

### Added

- **Wiki 反馈闭环 P0 · `wiki_delta`**：`TASK_TEMPLATE` / epic / graph_bootstrap 增加 `wiki_delta` / `wiki_delta_note`（可选 `wiki_promotion`）。`task close`：**缺字段 BLOCK**；`none`/`n/a` 无 note → BLOCK；path 须相对仓根存在。`--allow-wiki-gap` 豁免留痕。`verify --task` 默认 WARN；`--strict-wiki-delta` → BLOCK。
- **P1 · wiki 晋升指针**：`experience_capture=required` 且 `wiki_delta=path` 时，经验节须含 `coding_wiki` / `Wiki:` / `wiki_promoted:`（或与 path 相同子串）；否则 close BLOCK（同 `--allow-wiki-gap`）。
- **P2 · `wiki export --json`**：扫描 `docs/coding_wiki`（`--root` 可改）→ `{ schema: harness.wiki_graph.v1, nodes, edges }`（`[[wikilink]]` + 相对 `.md` 链）。供 harness-web / Obsidian 对照消费；本包不渲染。
- `lifecycle` close 增补 `close_wiki_delta` / `close_wiki_promotion`；`lib/wiki-export.js` · fixture `test/fixtures/wiki_graph_mini/`。

### Changed

- 30/40 Prompt · coding_wiki README/volatile · USER_GUIDE：关账前答 wiki_delta / 晋升指针。
- `discipline-coverage.yaml` `as_of_package_version` → **2.18.0**。

### Notes

- SPEC：`docs/spec/SPEC-experience-wiki-feedback_loop_v1.md`（signed · 缺字段 BLOCK · P0–P2 同窗）
- **破坏性（close）**：存量 task **必须**补 `wiki_delta`（无 wiki 轨填 `n/a` + note）。勿默认依赖 `--allow-wiki-gap`
- **已发布**：`@cyning/harness@2.18.0`（npm · 2026-07-28）· tag `v2.18.0` 已推送

## [2.17.0] - 2026-07-28

### Added

- **`verify --task` · pre-30 invoke 硬闸**：`required ∩ {10,20,00}` 缺失 → `VERIFY: BLOCKED · missing pre-30 invoke hats` · `may_start_30=false`（相对 v2.12 仅 WARN 升格）。
- **闭环硬闸 G1 · `graph_delta`**：主 `TASK_TEMPLATE` 增加 `graph_delta` / `graph_delta_note`；`task close`：缺字段 WARN；`none` 无 note → BLOCK；路径须相对仓根存在 → 否则 BLOCK。`verify --task` 同规则默认 WARN；`--strict-graph-delta` → fail 级 BLOCK。
- **闭环硬闸 G3 P0 · KPI**：`kpi_aggregator=CLOSE`（默认）时 close 要求 `### KPI` 内可解析分数（`Task_KPI%` / D1–D5 / 四维 1–5）；失败 BLOCK；`--allow-kpi-gap` 豁免留痕。**不**在 verify 挡 30。
- **闭环硬闸 G4 · experience**：`experience_capture=required` 时 close 要求经验节非空（≥80 字或 ≥3 列表项）；`recommended` → WARN；`not_applicable` 须 `experience_capture_note`；`--allow-experience-gap` 豁免留痕。
- **G2 P0 · Consumer ontology**：模板 `harness/templates/ONTOLOGY_consumer_slice_v1.md`；ONBOARDING「绿野推荐顺序」；`examples/demo_checkout/ONTOLOGY_consumer_slice_demo_v1.md`。**不**改 `ontology-check` 产品本体语义。
- `lib/close-loop-gates.js`；`lifecycle` close 增补 `close_graph_delta` / `close_kpi` / `close_experience`。

### Changed

- 缺 **40** / 缺 30 文件本身 **不挡** 30（仍 WARN）；`invoke_retention_profile: minimal`（无 preRequired）不挡。
- `--allow-invoke-gap`：pre-30 BLOCK **豁免为 WARN 放行**并留痕；`--json` handoff 增加 `invoke_pre30_ok` / `invoke_pre30_missing` 等。
- `lib/task-meta.js`：`evaluatePre30InvokeHats`；`parseHarnessMeta` 支持无反引号笔记单元格。
- FRAGMENT_30 / 30-execute / TEMPLATE_30_gate_stop · USER_GUIDE §6.0：写明「用户『开工』≠ 闸」+ 闭环硬闸表。
- `discipline-coverage.yaml` `as_of_package_version` → **2.17.0**。

### Notes

- SPEC：`docs/spec/SPEC-verify-pre30-invoke-hats-gate_v1.md` · `docs/spec/SPEC-close-loop-hard-gates_v1.md`
- **破坏性（verify）**：存量业务仓 **default + 仅有 30 invoke** → upgrade 后 **verify 将挡 30**。补救：补 `invoke_*_10_*`、改 `minimal` / 显式 `required_invoke_hats: 30`、或 `--allow-invoke-gap`
- **破坏性（close）**：缺省 `kpi_aggregator=CLOSE` 且 KPI 无可解析分数 → close BLOCK；`experience_capture=required` 无经验节 → BLOCK。勿默认依赖 `--allow-*-gap`
- 叠在已发布 `@cyning/harness@2.16.2` 之上；**勿**再占用 2.14.0
- **发版**：维护者 `npm publish`（本 PR 不 publish）

## [2.16.2] - 2026-07-27

### Added

- **CI 样例**：`ci/samples/tech-graph.yml.example`（`docs/_tech_graph` + `graph-compile.sh` · `package-manager-cache: false`）。

### Fixed

- `ci/samples/hgm-ingest.yml.example`：setup-node@v5 显式 `package-manager-cache: false`（npx-only job 遇 `packageManager=pnpm` 不再误找 pnpm）。
- `ci/samples/README.md`：登记 tech-graph；专节摩擦（setup-node × pnpm cache × npx-only vs quality 先 action-setup）。

### Notes

- patch · 仅 CI 样例 / 文档；不改变 CLI 行为
- **已发布**：`@cyning/harness@2.16.2`（npm `latest` · 2026-07-27）· tag `v2.16.2` 已推送

## [2.16.1] - 2026-07-27

### Added

- USER_GUIDE §6.0a：**跨壳过程观测边界** POINTER（工作区 `GUIDANCE_harness_process_observability_shell_boundary_v1_zh.md` · Epic P3a）。

### Notes

- patch · 产品仓仅文档指针；边界真值在工作区 Guides
- 不改变 CLI 行为
- **已发布**：`@cyning/harness@2.16.1`（npm `latest` · 2026-07-27）

## [2.16.0] - 2026-07-27

### Added

- **`status --check` 硬语义**：缺 R1 review 或 `may_start_30=false` → **exit 2**（须 `--task`）。
- **hook 样例（随包）**：`examples/hooks/pre-commit.graph-ingest.sample`（默认 warn 不挡 commit · init 不装）。
- **CI 样例**：`ci/samples/hgm-ingest.yml.example`（可选 · `continue-on-error`）。

### Changed

- USER_GUIDE §6.0a / §13.3：交叉链 hook + CI；`--check` 说明升级。
- `discipline-coverage.yaml` `as_of` → **2.16.0**。

### Notes

- SPEC / Epic P2 · **不**强制装 hook · **不**替代 verify
- minor · 相对 2.15：`--check` 从 WARN 升为可失败 exit
- 过程可观测 Epic 同窗发版收口于 **2.16.1**（见上）

## [2.15.0] - 2026-07-27

### Added

- **`harness timeline`**：按 task 投影 HGM 事件时间线（`--task` / `--json` / `--limit` / 可选 `--ingest`）。
- JSON 契约 `obs_timeline.v1`；无匹配事件时 exit 0 + WARN，提示 `graph ingest`（默认不写盘）。
- `lib/timeline.js` · `lib/obs-hgm.js`（与 `status.hgm` **同一** task 匹配规则）· `test/timeline.test.js`。

### Changed

- USER_GUIDE §6.0a 扩写 timeline；`status` 经 `obs-hgm` 复用过滤。
- `discipline-coverage.yaml` `as_of` → **2.15.0**。

### Notes

- SPEC：`docs/spec/SPEC-process-observability_status_timeline_v1.md` · Epic P1
- minor · 与 P0 `status`（2.14）同窗过程可观测；`--ingest` 为显式开关
- 禁止 Neo4j；不改 verify / status 退出语义
- **UX**：`--ingest` 先剥再解析，避免 `--task --ingest path` 误吞；帮助文含正确示例

## [2.14.0] - 2026-07-27

### Added

- **`harness status`**：过程可观测一屏投影（`--target` / `--task` / `--json` / `--check` WARN stub）。
- JSON 契约 `obs_status.v1`：闸表 · `may_start_30` · blockers · last_invoke · reviews(R1/CLOSE) · `verify_preview`（只读）· HGM 计数 · KPI 节存在性 · `next_hint`。
- `lib/status.js` + `test/status.test.js`。

### Changed

- USER_GUIDE：新增「过程可观测」小节；CLI 速查表登记 `status`。
- 明确纪律：**status 不替代** 正式 `harness verify`（30 前仍须跑 verify）。

### Notes

- SPEC：`docs/spec/SPEC-process-observability_status_timeline_v1.md` · Epic P0
- minor · `timeline` / `--check` 硬失败属后续棒；本版 `--check` 仅 WARN
- status **禁止**偷偷 `graph ingest` 写盘
- **fix**：`next_hint` 识别 post-30（last_invoke hat≥30）与 done/CLOSE，不再误提示「开 30」

## [2.13.0] - 2026-07-26

### Added

- **`lifecycle dry-run` 接线 `close_*`**：`--task` + `close` + `from=done` 时求值 `close_invoke` / `close_self_check` / `close_acceptance` / `close_slug` / `close_status` / `close_review`（与 `task close` 同语义 · 旁路 · 不 mv）。
- `evaluateCloseChecks`（`lib/task-close.js`）：close 与 dry-run 共用检查；CLI 透传 `--allow-invoke-gap` / `--allow-unchecked`。

### Changed

- README / USER_GUIDE / ONBOARDING / docs 索引：对齐 **2.12–2.13**（invoke hats · dry-run close）。
- `discipline-coverage.yaml` `as_of` → **2.13.0**。

### Notes

- SPEC：`docs/spec/SPEC-lifecycle-dry-run-close_v1.md`
- minor · 仍无 `--apply` / G7；`to_00` 仍可 unevaluated
- dry-run **不替代** `task close` 硬闸

## [2.12.1] - 2026-07-26

### Fixed

- **invoke 文件名 hat 扫描**：改为日期后的**前缀 hat run**；slug 中的 `10`/`40` 等不再误计为已覆盖；去掉整名 `/CLOSE/i` 裸匹配。
- `lifecycle.yaml`：删除 `invoke_hats_retention` 别名守卫，仅保留 `close_invoke`。

### Changed

- `verify` / 单测收紧：缺口 WARN 用例断言 exit 0；补误计负例与 lint **W6**。
- USER_GUIDE §6.0 · TEMPLATE_invoke 命名约束 · 10-task 提及 W6。
- `discipline-coverage.yaml` `as_of` → **2.12.1**。

### Notes

- patch · 对规范命名无影响；依赖 slug 误计的畸形文件名 close 可能新 BLOCK
- 迁移指引：[`docs/USER_GUIDE_v1.0_zh.md`](docs/USER_GUIDE_v1.0_zh.md) §6.0（不另造 RUNBOOK）
- **已发布**：`@cyning/harness@2.12.1`（npm `latest` · 2026-07-26）· tag `v2.12.1` 已推送

## [2.12.0] - 2026-07-26

### Added

- **多帽 invoke 留档硬闸**：task 元信息 `required_invoke_hats` / `invoke_retention_profile`（`default`=`10,30,40` · `minimal`=`30` · `full`=`00,10,20,30,40,CLOSE`）。
- `task close` 检查 1 按集合覆盖校验；文件名 `30_40` 可同时满足 30 与 40；`--allow-invoke-gap` 豁免留痕。
- `verify --task` 对 invoke hats 缺口 **WARN**（不挡 30）；`task lint` **W6** 提醒未设字段。
- `lib/task-meta.js`：`resolveRequiredInvokeHats` · `scanInvokeHats` · `evaluateInvokeHatsRetention` · `extractHatsFromInvokeFilename`。

### Changed

- `lifecycle.yaml` close 守卫升级 `close_invoke`（集合覆盖）；`discipline-coverage.yaml` `as_of` → **2.12.0** · gaps `INVOKE-HATS`。
- TASK_TEMPLATE / TEMPLATE_invoke / 10·20·30 帽文同步字段与纪律。

### Notes

- SPEC：`docs/spec/SPEC-invoke-hats-retention-gate_v1.md`
- **破坏性（close）**：无字段时按 default 要求 10+30+40；存量仅 30 的 active 须补档、改 `minimal` 或 `--allow-invoke-gap`
- minor · 建议业务仓 upgrade 后按 [`USER_GUIDE` §6.0](docs/USER_GUIDE_v1.0_zh.md) 勾选 invoke 集合
- **已发布**：`@cyning/harness@2.12.0`（npm `latest` · 2026-07-26）· tag `v2.12.0` 已推送

## [2.11.1] - 2026-07-25

### Fixed

- **F1 · `upgrade` 自绊 S5（ops-desk-web dogfood）**：`local.json` 改为 **sync apply 成功后** 写入（compare-before-write）。避免 npx 缓存路径变化时先脏工作区再被 git-clean 中止。
- **F2 · manifest 静默丢字段**：`write_manifest_upgrade` 重写前对 schema 外字段与 `ide` 裁剪打 **WARN** 清单（知情）；**仍不**合并保留（`additionalProperties: false`）。

### Notes

- 摩擦报告：`Projects/docs/harness/guides/ANALYSIS_upgrade_wizard_friction_20260725_v1_zh.md`
- patch · 2.3+ manifest 仅五字段：`version` / `preset` / `ide` / `from_version` / `upgraded_at`（`name` / `tech_graph_dir` / `tasks_dir` / `hooks` 等已废弃）
- **已发布**：`@cyning/harness@2.11.1`（npm `latest` · 2026-07-26）· tag `v2.11.1` 已推送

## [2.11.0] - 2026-07-25

### Added

- **`discipline show [--json]`（Post-2.10 Epic E）**：只读展示 `harness/discipline-coverage.yaml`（镜像 `lifecycle show`）。**无** `audit --discipline` UI。

### Changed

- **`lifecycle dry-run` 守卫扩面（Post-2.10 Epic A）**：`--task` + `to_30` 增接 `HG-TASK-DRAFT` · `audit_D5` · `task_lint`（与既有 `HG-AUDIT-R1` / `reviews_retention`）。`task_lint` 仍为 yaml **warn**；`--allow-lint-fail` 可将 fail 豁免为 warn。`close_*` 仍 `unevaluated`。**无** `--apply` / G7 / N2-C。

### Notes

- SPEC：`docs/spec/SPEC-lifecycle-guard-expand_v1.md` · `docs/spec/SPEC-discipline-show_v1.md`
- minor · `lifecycle show` / verify 硬闸语义不变
- `discipline-coverage.yaml` `as_of_package_version` → **2.11.0**
- **已发布**：`@cyning/harness@2.11.0`（npm `latest` · 2026-07-25）· tag `v2.11.0` 已推送

## [2.10.0] - 2026-07-25

### Added

- **`lifecycle dry-run`（方向二 · 转移引擎最小骨架 · Post-G4 Epic T2）**：消费 `harness/lifecycle.yaml` 做资格判定（结构 + 薄守卫 adapter）。
  - CLI：`lifecycle dry-run --transition <id> --from <state> [--task PATH] [--json] [--allow-no-review]…`
  - 本波接线（`--task` + `to_30`）：`HG-AUDIT-R1` · `reviews_retention`；其余守卫显式 `unevaluated`
  - exit：`0` 无 block fail（允许 unevaluated）· `2` 结构非法或 block fail · `1` 用法/yaml
  - **旁路报告**：不替代 `verify` / gate-check 作为 30 硬闸；**无** `--apply` / runner / G7
- 语义护栏：yaml 头与 schema 注明「登记真值 · 由 dry-run 消费 · yaml ≠ 引擎」
- **`harness/discipline-coverage.yaml`（方向一 · 机械化率资产 · Post-G4 Epic T3）**：Starter 子集 statements + gaps；schema `discipline-coverage.v1`；`npm test` 锁形状。**无** `audit --discipline` UI。种子自 rethink 02/03 转录并刷新 G1–G4/N 闸状态；03 md 改为历史叙事，SoT=本 YAML。

### Notes

- SPEC：`docs/spec/SPEC-lifecycle-engine-min_v1.md` · `docs/spec/SPEC-discipline-coverage-yaml_v1.md`
- minor · `lifecycle show` 行为不变
- **已发布**：`@cyning/harness@2.10.0`（npm `latest` · 2026-07-25）· tag `v2.10.0` 已推送

## [2.9.0] - 2026-07-25

### Changed

- **⚠ 行为变更 · 裸 `verify`（无 `--task`/`--spec`）纳入 reviews 留档闸（N4 · G2 residual）**：gate-check 通过后对每个 active 跑 `findReview`；任一缺失 → `VERIFY: BLOCKED · missing R<n> review（n/m tasks · basename…）` exit 2。豁免：`--allow-no-review`（WARN 放行）。
- **active 发现双路径**：`listActiveTasks` 与 `gate-check.sh` 同步扫描 `docs/tasks/active` ∪ `docs/harness/tasks/active`（同 basename 优先 Starter）。
- 全量 `--json`：每 task 的 `may_start_30` / `verify_ok` 纳入 `review_found`（与 `--task` 同构）。
- `lifecycle.yaml` `to_30` / `reviews_retention`：描述覆盖「`--task` 与全量」。

### Notes

- 全量模式仍**不**跑 task lint / audit D5（维持 N2）。
- SPEC：`docs/spec/SPEC-verify-full-reviews-gate_v1.md`
- minor · 行为更严 · 存量「闸表可 30 但无审查文」将被挡（可补审或 `--allow-no-review`）
- **已发布**：`@cyning/harness@2.9.0`（npm `latest` · 2026-07-25）· tag `v2.9.0` 已推送

## [2.8.0] - 2026-07-25

### Added

- **SPEC 审查文留档闸（N3 · G2 姊妹）**：`verify --spec FILE` 检查 `docs/harness/reviews/` 下 SPEC 审查文存在性（推荐 `spec_<slug>_audit_R*` · 兼容 `*_ACCEPT_*` / `task_*_spec_ACCEPT_*`）。缺失 → `VERIFY: BLOCKED · missing SPEC R<n> review` exit 2。
- 豁免：`--allow-no-spec-review`；元信息 `track: bugfix` / `skip_spec_audit: true`。
- `findSpecReview`（支持 `--workspace-root` 分仓）；handoff：`may_start_00` · `spec_review_found` · `spec_review_latest`。
- `lifecycle.yaml` 转移 `to_00` + guard `spec_reviews_retention`（只登记）。

### Notes

- 与 `--task` 互斥；**不**改 task 侧 verify/close。
- SPEC：`docs/spec/SPEC-spec-reviews-retention-gate_v1.md`
- minor · 行为新增（新模式）
- **已发布**：`@cyning/harness@2.8.0`（npm `latest` · 2026-07-25）· tag `v2.8.0` 已推送

## [2.7.0] - 2026-07-24

### Added

- **`harness/lifecycle.yaml`（方向二 · 文档先行）**：登记 task 状态 / 转移 / 守卫（`to_30` · `close`）；`task_lint` severity=`warn`。Schema：`schema/lifecycle.v1.schema.json`。
- **`harness lifecycle show [--json]`**：只读渲染包内 yaml（**不做**转移引擎、不写盘）。
- **`verify --task` ↔ task lint（N2）**：E 级仅 `WARN: task lint FAIL`（不改 exit / 不改 `may_start_30`）；`--allow-lint-fail` 抑制 WARN；handoff JSON 增加 `lint: { ok, errors, warnings, suppressed? }`；无 `--task` 全量模式不跑 lint。

### Notes

- 背景：Post-G4 方案 N1+N2 · rethink 方向二骨架；dogfood active lint FAIL 率高故本波不做 block。
- SPEC：`docs/spec/SPEC-lifecycle-and-verify-lint_v1.md`
- minor · `npm test` 含 lifecycle + verify-lint-warn
- **已发布**：`@cyning/harness@2.7.0`（npm `latest` · 2026-07-24）· tag `v2.7.0`

## [2.6.0] - 2026-07-24

### Added

- **task lint · 思考轮结构规则组（G4）**：条件触发（行首 `### R0` 或 `##/###` 标题含「思考轮」）后检查：
  - **E8** R0–R5 槽位标题齐全（`^### R\d` 前缀宽容）
  - **E9** 控制表字段 `actual_last_round` / `early_stop` / `residual_risks`
  - **E10** `early_stop=yes` 时 `early_stop_reason` 非空
  - **W4** 无思考轮节（SPEC 承载 / bugfix 合法豁免提示）
  - **W5** 存在 `### R6+` 但缺 `round_extension_note`
- 槽内容 `（待填）` / `（跳过 · 见思考轮控制）` 合法；**不**查思考内容质量（20 帽职责）。
- SPEC：`docs/spec/SPEC-task-lint-thinking-rounds_v1.md`

### Notes

- 背景：机械化率审计 G4（rethink 矩阵 P1 · 第三波）；与 G1 同命令、分开交付。
- minor · 无 verify 行为变更 · `npm test` 含既有回归全绿
- **已发布**：`@cyning/harness@2.6.0`（npm `latest` · 2026-07-24）· tag `v2.6.0` 已推送

## [2.5.0] - 2026-07-24

### Changed

- **⚠ 行为变更 · reviews 留档闸（G2）**：`verify --task` 新增 blocking 条件——`docs/harness/reviews/task_<base>_audit_R<n>_*.md`（n≥1）不存在时 `VERIFY: BLOCKED · missing R<n> review` exit 2（即使人工闸表全 approved）。职责切分：机器只查**存在性**，审查结论仍由维护者签 `HG-AUDIT-R1` 覆盖。**豁免**：`--allow-no-review`（warn 放行 · 留痕）。
- `task close` 新增**检查 6**：归档时 R<n> 审查文应存在（纸链完整）；同 `--allow-no-review` 豁免。
- `findReviewPath` 升级 `findReview`：glob `_audit_R1_` → `_audit_R` 多轮取最新；**匹配两侧剥离版本后缀**（合法变体 `task_x_v1.md` ↔ `task_x_audit_R1_*.md` · R1 审查实测案例）；`review_path` 字段兼容。
- verify `--json` handoff 新增 `review_found` / `review_latest` / `review_rounds`；`may_start_30` 纳入审查文条件。

### Notes

- 背景：机械化率审计 G2（rethink 矩阵 P0 最后一块）；22/20 帽自此脱离「全帽零机械」。
- dogfood：工作区 approved 任务全过（含版本后缀变体 ops_clarify · 恰好是 R1 审查抓出的案例）。
- minor · verify 行为变更（本版核心 · 见上）· `npm test` 118 全绿 · SPEC `docs/spec/SPEC-reviews-retention-gate_v1.md`
- **已发布**：`@cyning/harness@2.5.0`（npm `latest` · 2026-07-24）· tag `v2.5.0` 已推送

## [2.4.0] - 2026-07-24

### Changed

- **帽定义对齐 V2（拆分收编）**：
  - `10-requirements.md` → **`10-task-requirements.md`**（+ 新增 **`10-spec-requirements.md`**）
  - `22-task-audit.md` → **`20-task-audit.md`**（+ 新增 **`20-spec-audit.md`**）
  - 旧 2 文件**彻底删除不留别名**；包内 Starter 集 = 6 帽 + FRAGMENT/TEMPLATE。
  - 新增帽为工作区 V2 真值的 Starter 浓缩版（各文件修订记录注明来源）。

### Added

- **sync obsolete 检测**：`harness-sync.sh` 对 target `docs/harness/prompts/` 中已废弃帽文件（`OBSOLETE_HATS` 清单）输出 `warn: obsolete` 提示人工删除——sync 只写不删，避免升级后新旧帽双真值。
- 测试：`test/hat-v2-split.test.js`（帽集合断言 · 旧名活引用零残留 grep · sync obsolete fixture）。

### Fixed

- `harness-sync.sh` 变量后紧跟全角字符时 bash 将变量名解析为多字节序列（`set -u` 下 unbound）——`${f}` 花括号保护（本 task dogfood 发现）。
- `test/cli.integration.test.js` 旧帽名断言同步为新名。

### Notes

- **升级指引**：业务仓 `upgrade` 后若出现 `warn: obsolete`，按提示人工删除旧帽文件即可（sync 不会自动删）。
- 背景：三方对比（后端仓=V1 手工快照 · 包内=半途状态 · V2 真值仅在工作区）· task `cyning-harness-hat-v2-split-sync`。
- minor · 无 CLI breaking · `npm test` 111 全绿
- **已发布**：`@cyning/harness@2.4.0`（npm `latest` · 2026-07-24）· tag `v2.4.0` 已推送

## [2.3.0] - 2026-07-24

### Added

- **`harness task lint`**：task md 结构闸（G1）+ 文本规则包（G3）。E 级（exit 2）：E1 元信息/task_slug · E2 状态行 · E3 验收标准含勾选项 · E4 失败路径节 · E5 自检结论节 · E6 绝对本机路径（带行号）· E7 slug 一致性；W 级（仅 warn）：W1 状态词表外 token · W2 缺人工闸节 · W3 自检结论占位。`--json` 统一契约 `{ok, errors[], warnings[], file, slug}`（errors 元素 `{rule, message, line?}`）。
- 独立命令 · 不接入 `verify`（不误伤存量在途 task）；10 帽交接物新增「产出 task 须 task lint PASS」。

### Changed

- `lib/task-meta.js` 上提共享规则（`STATUS_RE` / `PLACEHOLDER_RE` / `UNCHECKED_RE` / `CHECKBOX_RE` / 状态词表），`task-close.js` 改调共享层（行为不变）。
- **`extractSection` 起始标记锚定行首**：修复表格/正文中「\`## 验收标准\`」式文本提及被误判为节（dogfood 自身 task 时发现；close 的检查 2/3 同享更稳）。

### Notes

- 背景：机械化率审计 `docs/rethink/2026-07-mechanization-rate/`（缺口 G1+G3 · 46% 规范零机械）。
- dogfood：工作区 17 个 active task 全量 lint，15 个存在真实结构缺口（E5×13 · E4×9 · E1×8 · E6×6 · E3×6 · E7×3 · E2×3）——矩阵预言被数据证实。
- minor · 无 CLI breaking · `npm test` 108 全绿 · SPEC `docs/spec/SPEC-task-lint-structure-gate_v1.md`
- **已发布**：`@cyning/harness@2.3.0`（npm `latest` · 2026-07-24）· tag `v2.3.0` 已推送

## [2.2.1] - 2026-07-22

### Fixed

- **slug 一致性误报**：`task close` 检查 4 与 `task lint-done` 的 slug 比较现在对下划线/连字符惯例等价（`task_cyning_harness_a5_*_v1.md` ↔ `cyning-harness-a5-*`，工作区实测命名惯例）。dogfood 本仓 task 时发现：2.2.0 严格相等比较会把全部工作区 task 误 BLOCKED。
- `lib/task-meta.js` 新增 `normalizeSlug`；两命令双侧规范化后比较。

### Notes

- patch · 无 CLI breaking · `npm test` 94 全绿
- **已发布**：`@cyning/harness@2.2.1`（npm `latest` · 2026-07-22）· tag `v2.2.1` 已推送

## [2.2.0] - 2026-07-22

### Added

- **`harness task close`**：受闸归档子命令（方案 A · invoke 留档机械闸）。5 项机械校验 —— invoke 留档（`docs/harness/invokes/by-task/<slug>/` 含 ≥1 个 `.md`）、`### 自检结论` 非占位符、`## 验收标准` 无未勾选项、文件名/元信息/invoke 目录 slug 一致、`> **状态**` ∈ {done, completed}；任一失败 exit 2 + `CLOSE: BLOCKED` 且**不执行** mv。默认 dry-run（只检不 mv），`--yes` 才归档到 `active/` 同级 `done/`（basename 保留，`--target` 可覆盖）。
- **`harness task lint-done`**：CI 一致性兜底（方案 C）。diff `docs/tasks/done/` + `docs/harness/tasks/done/`（递归）slug 集合 vs `invokes/by-task/` 目录名；done 有而 invokes 无 exit 2 列缺失，反向仅 warn。
- `lib/task-close.js` · `lib/task-lint-done.js`；`lib/task-meta.js` 新增导出 `extractSection` · `extractTaskSlug`。
- Prompt 纪律同步：`harness/prompts/30-execute-code.md`（归档只能走 `task close` PASS）、`harness/invokes/TEMPLATE_invoke.md`（close 机械闸行）。

### Notes

- 背景：ops-desk-api 连续 4 任务 30 漏落 invoke（2026-07-20 根因分析）——invoke 留档原是纯 Prompt 层纪律，本版补上机械闸。
- minor · 无 CLI breaking · `npm test` 91 全绿 · SPEC `docs/spec/SPEC-task-close-invoke-gate_v1.md`
- **已发布**：`@cyning/harness@2.2.0`（2026-07-22）· tag `v2.2.0` 已推送；**已被 2.2.1 取代**（slug 规范化修复，业务仓请直接升 2.2.1）

## [2.1.1] - 2026-06-30

### Fixed

- **task 人工闸解析**：`lib/task-meta.js` 与 `wizard/gate-check.sh` 现在会去除 Markdown 反引号，避免将 `` `approved` `` 误判为 pending。
- 影响命令：`verify`、`gate-check`。

### Notes

- **HG-RELEASE**：待维护者 publish `@cyning/harness@2.1.1` · tag `v2.1.1`
- patch · 无 CLI breaking · `npm test` 预期通过

## [2.1.0] - 2026-06-30

### Added

- **YAML-first 图谱模板**：`graph/templates/00_main.graph.yaml`、`10_flow_MAIN.graph.yaml`
- **编译脚本**：`scripts/graph_yaml_compile.js`（Node.js · `js-yaml`）从 `.graph.yaml` 生成 `.md`
- **校验脚本**：`scripts/verify-template-compile.sh` — 校验同步、无残留 `.ai.md`、生成物齐全
- **模板 v0.2**：`graph/templates/README.md` 更新复制流程；`99_mermaid_protocol.md` 升级 v3 YAML-first

### Changed

- **图谱模板**：删除 `graph/templates/00_main.ai.md`、`10_flow_MAIN.ai.md`；`00_main.md`、`10_flow_MAIN.md` 改为生成物
- **版本**：`package.json` → **2.1.0**

### Notes

- **HG-RELEASE**：待维护者 publish `@cyning/harness@2.1.0` · tag `v2.1.0`
- docs-only minor · 无 CLI breaking · `npm test` 预期通过

## [2.0.4] - 2026-06-21

### Added

- **[`SDD_HAT_FLOW_v2_zh.md`](docs/methodology/product/SDD_HAT_FLOW_v2_zh.md)**：V2 标准帽链真值（10-spec/10-task · 20-spec-audit/20-task-audit · 30⇄40 同 Agent · 50/CLOSE 打回）
- **复查落盘**：[`docs/methodology/execution/reviews/review_v2_hat_flow_20260621.md`](docs/methodology/execution/reviews/review_v2_hat_flow_20260621.md)

### Changed

- **[`DESIGN_ONTOLOGY_v1_zh.md`](docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md)** → **v1.3** · §3.2 / §4.1 / §8 与 V2 对齐
- **[`ontology.yaml`](ontology.yaml)**：`version: "1.3"` · `starter_hats` / `extended_hats` / D1·D2 公理
- **Starter prompts**：[`harness/prompts/README.md`](harness/prompts/README.md) · [`30-execute-code.md`](harness/prompts/30-execute-code.md) · [`40-self-check.md`](harness/prompts/40-self-check.md) · 30→40 同 Agent 闭环纪律
- **入口文档**：[`README.md`](README.md) · [`AGENTS.md`](AGENTS.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) 链 V2 流程
- **版本**：`package.json` · `ontology.yaml` `product_semver` → **2.0.4**

### Notes

- **HG-RELEASE**：待维护者 publish `@cyning/harness@2.0.4` · tag `v2.0.4`
- docs-only patch · 无 CLI breaking · `npm test` 72/72

## [2.0.2] - 2026-06-18

### Added

- **A6 Agent handoff**：`verify --json` · `--agent-hint` · `--workspace-root`
- **lib/task-meta.js**：解析 task Harness 表 `entry_invoke_*` · 人工闸 · `may_start_30`
- **schema/verify_result.v1.schema.json**：JSON 输出文档化
- **sync index**：索引 task `entry_points.{10,20,30}`
- **compliance-bench S6**：`S6_agent_handoff/` · `--all` 含 S6（6/6 = 100%）

### Changed

- **FRAGMENT_30**：verify 从「推荐」→ **「30 改码前必须」**
- **USER_GUIDE** §5.1 Agent handoff · **QUICKREF** 新 flags
- **版本**：`package.json` → **2.0.2**

### Notes

- **HG-RELEASE**：待维护者 publish `@cyning/harness@2.0.2`
- dogfood：`kimi-code-meta` · `task_meta_graph_issue_sync_gate_v1.md`

## [2.0.1] - 2026-06-17

### Added

- **D4-a 公理**：`checkAxioms()` 检测 in_progress + `HG-GRAPH-MODULES` pending/rejected · MUST_READ 缺 Inform 可选 warn
- **compliance-bench S5**：`S5_rejected_draft/` · rejected→draft 静态夹具 · `--all` 含 S5（5/5 = 100%）
- **optional pre-commit**：`.cyning-harness/hooks/pre-commit.sample` · USER_GUIDE §13.3 · 默认 init 不安装

### Changed

- **rejected→draft**：事件流精确匹配 `TaskStatusChanged(draft)` · 有回退则 pass · 缺则 error
- **版本**：`package.json` → **2.0.1**
- **USER_GUIDE**：§13 公理集 · optional Git hooks

### Notes

- **HG-RELEASE**：待维护者 publish `@cyning/harness@2.0.1`
- bench S5 语义向 HGM axioms 靠拢 · drift 时改夹具不改 axioms

## [2.0.0] - 2026-06-17

### Added

- **HGM G1**：`lib/graph-hgm.js` · 过程轨事件模型（Task / Gate / Review / Invoke / Sync / InformArtifact）
- **HGM Event Schema v1**：`docs/methodology/graph/schemas/hgm_event_v1.schema.json` · append-only JSONL
- **HGM CLI**：`harness graph ingest|snapshot|axioms check`（v2.0+）
- **InformArtifact 与 MUST_READ 边**：task → inform 节点 · 对齐 Track I-YAML 路径约定
- **HGM 公理子集**：D2（pending gate 阻塞 30）· D3（in_progress 缺 GateCheckRun）· S2（sync 禁止 touch S2）· rejected→draft 提醒
- **测试覆盖**：`test/graph-hgm.test.js` · 60/60

### Changed

- **版本**：`package.json` · `ontology.yaml` → **2.0.0**
- **README**：当前版本 → v2.0.0 · 补充 HGM 命令速查
- **USER_GUIDE**：新增 §13 HGM 过程轨章 · 版本 → v2.0.0

### Notes

- **HG-RELEASE**：tag v2.0.0 · npm `@cyning/harness@2.0.0` 已发布
- `gate-check --graph` 语义不变；HGM 独立子命令
- HGM v2.0 默认本地 JSONL + snapshot，不含 Neo4j / SQLite / 远端同步

## [1.1.0] - 2026-06-17

### Added

- **Inform Graph YAML v3**：`schema/inform_graph.v3.schema.json` · 对齐试点 `*.graph.yaml` 编辑源
- **Inform-YAML 迁移对照表**：`docs/methodology/graph/INFORM_YAML_MIGRATION_v1_zh.md` · 试点字段 → 产品字段
- **`harness graph yaml compile|check`**：YAML → Mermaid MD + 结构化表 · YAML ↔ graph.json slice diff
- **demo_checkout dogfood**：`examples/demo_checkout/00_main.graph.yaml` + `graph.json` + `00_main.md`
- **测试覆盖**：`test/graph-yaml.test.js` + `test/gate-check.graph.test.js` Inform-YAML 路径

### Changed

- **USER_GUIDE v1.0**：新增 §13 Inform-YAML 章 · 明确 MD / YAML / HGM 三轨边界
- **README**：当前版本 → **v1.1.0** · 补充 `graph yaml` 命令速查
- **`ontology.yaml`**：`product_semver: "1.1.0"`

### Notes

- **HG-RELEASE**（tag v1.1.0 · npm publish）仍留维护者人闸
- `gate-check --graph` 语义不变；Inform 模块闸仍读 `docs/_tech_graph/`
- HGM G1 v2.0 仍待 Y1 merge + npm 发布（或维护者书面豁免）后启动

## [1.0.2] - 2026-06-16

### Fixed

- **`verify` 无 `--task`**：摘要不再误匹配闸表行 `❌ 拒 30`；多 task 阻塞时摘要列出 blocked task 名
- **`verify` BLOCKED**：exit 2 时不再打印空 `Error` stack trace

## [1.0.1] - 2026-06-16

### Added

- **业务仓 CLI 入口**：`npx @cyning/harness gate-check` · `verify` · `sync index`（读 `.cyning-harness/local.json`，无需 clone 产品包）
- **`verify` 聚合命令**：30 前一条命令跑 gate-check + audit D5 + S5 warn + 可选 `--graph`
- **`--help` / `--version` / `-V`**：全局与各子命令帮助
- **Node 仓可选 `--with-scripts`**：`init|upgrade --with-scripts [--pm pnpm|npm|yarn|auto]` 写入 `devDependencies` 与 `scripts`（merge 不覆盖）
- **业务仓 QUICKREF**：`harness/templates/QUICKREF_v1_zh.md`，install/upgrade 后写入 `.cyning-harness/QUICKREF.md`

### Changed

- `lib/audit.js` 使用统一 `resolveHarnessRootForTarget`，修复无 `CYNING_HARNESS` 时的路径 bug
- `lib/cli.js` 子命令透传 `CYNING_HARNESS` 到 wizard 脚本
- `README.md` · `docs/ONBOARDING.md` · `docs/USER_GUIDE_v1.0_zh.md` · `wizard/README.md` · IDE 片段：同步 v1.0.1 CLI 与 `verify` 用法
- **`ontology.yaml`**：`product_semver: "1.0.1"`

### Notes

- **HG-RELEASE**（tag v1.0.1 · npm publish）仍留维护者人闸
- `verify --graph` 硬挡规则与 `gate-check --graph` 一致

## [1.0.0] - 2026-06-16

### Added

- **ICVO 机械审计 CLI**：`harness audit [--target PATH] [--task FILE]` · D3/D5/S5 子集
- **InvokeSnapshot 索引**：`schema/invoke_index.v1.schema.json` · `wizard/harness-sync.sh --index`
- **Inform 图谱闸**：`wizard/gate-check.sh --graph [--json]` · 读 `HG-GRAPH-MODULES` + `docs/_tech_graph/`
- **B2 试点证据**：README「试点证据（B2）」节 · 链 [`PILOT_EVIDENCE_B2_v1_zh.md`](docs/methodology/execution/PILOT_EVIDENCE_B2_v1_zh.md)
- **SDD-Compliance micro-bench**：`examples/compliance_bench/` · `wizard/compliance-bench.sh` · S1–S4 4/4

### Changed

- **README** · **ONBOARDING** · 文档：v1.0 stable 叙事 · ICVO 审计 · B2 证据
- **`ontology.yaml`**：`product_semver: "1.0.0"`

### Notes

- **HG-RELEASE**（tag v1.0.0 · npm publish · GitHub Release）仍留维护者人闸
- **Track G HGM**：v1.0 关账后评估，v2.0+ 另开 Epic

## [0.4.0] - 2026-06-15

### Added

- **MIT [`LICENSE`](LICENSE)** · 根目录开源许可
- **[`ontology.yaml`](ontology.yaml)** · 产品设计本体机器可读草案（对齐 DESIGN_ONTOLOGY v1.2）
- **[`docs/PUSH_AUDIT_a3_v1.md`](docs/PUSH_AUDIT_a3_v1.md)** · STRATEGY §5.1 push 前审计表
- **[`docs/ETCLOVG_MAPPING_v1_zh.md`](docs/ETCLOVG_MAPPING_v1_zh.md)** · 行业坐标摘要
- **D7 [`TEMPLATE_HG_RELEASE_v1_zh.md`](docs/methodology/execution/TEMPLATE_HG_RELEASE_v1_zh.md)** · 维护者 CLOSE 人闸 checklist

### Changed

- **`golden/`** · POINTER 化 · 移除内部 invoke 路径枚举
- **`examples/oss-fork/README.md`** · 脱敏工作区硬链
- **README** · 顶部 Quick Start 三行 · MIT public 叙事 · v0.4.0 状态

### Notes

- **GitHub public / npm publish** · 留维护者 **HG-RELEASE** CLOSE（OTP）
- demo 阶段 E（22 CLOSE 终轮）· 仍可选 · 不阻塞 A3 产品树

## [0.3.2] - 2026-06-15

### Added

- **Starter 40-self-check 帽**：[`harness/prompts/40-self-check.md`](harness/prompts/40-self-check.md) · Starter 闭包 **10/22/30/40**
- **`task.harness.v1.json` schema**：[`schema/task.harness.v1.schema.json`](schema/task.harness.v1.schema.json)
- **CLI `task check`**：`harness task check --file PATH [--no-circular] [--registry DIR]` · depends_on 环检测
- **gate-check manifest 版本**：输出 `manifest.version` / preset · 与产品包版本不一致时提示 upgrade
- **金样 sidecar**：[`examples/demo_checkout/task_demo_p0_golden_v1.harness.json`](examples/demo_checkout/task_demo_p0_golden_v1.harness.json)
- **测试**：`test/task.check.test.js` · `npm test` 扩展

### Changed

- `harness/prompts/README.md`：标注 Starter 四帽闭包
- 维护者本地验证：`npm run harness -- task check --file …`

## [0.3.1] - 2026-06-15

### Fixed

- **npm publish**：`bin` 路径格式（`bin/harness.js`）· 排除 `examples/demo_checkout/_sandbox` · 修复 `npx` 报 `harness: command not found`

## [0.3.0] - 2026-06-15

### Added

- **`@cyning/harness` npm CLI**：`init` · `upgrade` · `check`（薄封装 · 内部复用 `wizard/*.sh`）
- **`.cyning-harness/manifest.json`**：install/upgrade 写入 · schema [`schema/manifest.v1.schema.json`](schema/manifest.v1.schema.json)
- **S5 git-clean**：`harness-sync.sh apply` 前检测已跟踪文件变更 · `--force` / `HARNESS_SYNC_FORCE=1` 跳过
- **集成测试**：`npm test`（空目录 init · upgrade 等价 upgrade.sh · S5）

### Changed

- `docs/ONBOARDING.md` · `README.md` · `wizard/README.md`：**npx 优先**，clone 路径为维护者/离线
- `wizard/install.sh` · `wizard/upgrade.sh`：写入/更新 manifest · 支持 `HARNESS_VERSION`

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
