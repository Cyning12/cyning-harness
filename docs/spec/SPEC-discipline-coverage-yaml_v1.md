# SPEC：discipline-coverage.yaml 资产化（Post-G4 · T3）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收」）  
> **track**：`feature`（docs-first · 可 docs-only 发版）  
> **关联图谱**：无（纯 Harness 过程轨 / 机械化率资产）  
> **上游**：Epic [`EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md`](../../../docs/harness/guides/EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md) · RETRO 点菜 #3 · rethink [`03_coverage_matrix`](../rethink/2026-07-mechanization-rate/03_coverage_matrix.md) / [`04_next_steps`](../rethink/2026-07-mechanization-rate/04_next_steps.md) §4  
> **串行**：T1 CLOSE ✅ → T2 CLOSE ✅ → **本棒 T3** → 发版前复检  
> **下游**：00 已起草 task（HG-TASK-DRAFT pending）→ 10-task（可选）→ 20-task-audit → HG-AUDIT-R1 → 30（Open Folder：`cyning-harness/`）

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `discipline-coverage-yaml` |
| **test_strategy** | `required` |
| **test_strategy_note** | schema 正反例 + 包内 YAML 必须通过 schema；无 CLI 时仍以 `npm test` 锁形状，避免静默漂移 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-discipline-coverage-yaml/invoke_20260725_10_spec_discipline_coverage_yaml.md` |
| **entry_invoke_00_draft** | `Projects/docs/harness/invokes/by-task/cyning-harness-discipline-coverage-yaml/invoke_20260725_00_draft_discipline_coverage_yaml.md` |
| **拟发版窗口** | **`@cyning/harness@2.10.0`**（与 Epic T2 同窗；本棒无 CLI 亦可 docs/asset-only 记入同 CHANGELOG） |
| **Open Folder（实现）** | `cyning-harness/`（产品仓 · 资产 + schema + test + 文档） |
| **epic_serial** | T3（T1 dogfood → T2 lifecycle dry-run → **本棒**） |

---

## 1. 背景与目标

机械化率审计（2026-07）把 Starter 子集 **26 条**规范语句聚成矩阵（rethink 03），并写明：矩阵应落盘为 YAML，随版本维护，使「每个新闸落地 = 一行 ❌→✅」成为可版本化资产（04 §4）。G1–G4 / N1–N4 已关账后，03 正文仍是 **人工快照 md**——数字与状态会相对 `@2.9.0` 现实漂移，且无法被 schema / CI 钉住。

**一句话目标**：把 rethink 03 矩阵 **资产化** 为包内 `discipline-coverage.yaml`（+ schema + 文档挂点），成为方向一「改进路线可版本化」的实体；**不**在本波做全量重盘周，**不**做 `audit --discipline` 大 UI。

---

## 2. 范围

### D1 · 真值 YAML（随包分发）

- 路径：**`harness/discipline-coverage.yaml`**（与 `harness/lifecycle.yaml` 同级 · 进 npm `files`）
- 内容至少含：
  - `version`（资产 schema 版本，如 `"1"`）
  - `as_of_package_version`（快照对齐的包版本，首发填拟发布版或基线 `2.9.0`→发版时改 `2.10.0`）
  - `scope`：声明 **Starter 子集**（`harness/prompts/` · 与 rethink README 范围一致）
  - `statements[]`：每条至少 `id` · `source`（prompt/模板文件名）· `summary` · `status`（`mechanical` \| `partial` \| `prompt-only`）· `mechanism`（可空 · M1–M10 等）· `gap`（可空 · G1/G2/…）· `notes`（可空）
  - 预留字段：`mechanism_quality`（可空 · 本波不填实质审计）
  - 可选：`gaps[]` 汇总（id / title / status open|closed|deferred / closed_in / note）——便于一眼看缺口进度；若省略则须能从 statements 推导
- **种子策略（非重盘）**：以 rethink **02 条目 + 03 聚合** 为转录源；对已落地闸（G1–G4 及 PLAN §0 已列项）**更新 status/mechanism/gap 为当前现实**（反映 `@2.9.0` 已关闭项），**不**重新通读全部 prompt 做第二轮人工盘点周

### D2 · Schema

- **`schema/discipline-coverage.v1.schema.json`**
- 非法 fixture（缺 `statements` / 非法 `status` / 缺 `id`）须可失败定位

### D3 · 测试（无 CLI 亦必有）

- `test/discipline-coverage*.test.js`（或等价）：包内 YAML **通过** schema；至少 1 个非法 fixture **不通过**
- 建议轻断言：`statements.length >= 20`（防空文件）· 已知已关闭缺口（如 G1/G2）在 `gaps` 或 statements 映射中不为「仍 open 且无 closed_in」的自相矛盾（具体断言由 30 按 fixture 实现，SPEC 要求「不自相矛盾」可测）

### D4 · 文档挂点

- rethink **03** §5（或文首）：标明矩阵**运行时真值** → `harness/discipline-coverage.yaml`；md 表保留为历史/叙事，不再假装 SoT
- rethink **04** §4：链到本 SPEC / YAML 路径
- 产品仓 README 或 ONBOARDING / USER_GUIDE **一小节**：「机械化率覆盖资产」· 如何读 YAML · 新闸落地时须改哪一行
- CHANGELOG：**2.10.0** 条目（可与 T2 合并叙述；本棒无 CLI 则写 asset + schema）

### D5 · 维护约定（写进文档，非另开 task）

- 新闸合入 → 同 PR 或同版本更新对应 `statements[].status`（及 `gaps[]` / `as_of_package_version`）
- **禁止**本波要求「每周全量重盘」流程

---

## 3. 非范围

| 项 | 说明 |
|----|------|
| **全量人工重盘周** | 不重跑 02 式通读；不扩盘工作区 Extended 帽（00/10-spec/20-*/50） |
| **`harness audit --discipline` 大 UI / 视图** | 04 远期；本波不做渲染与 CLI 子命令（见 R2） |
| **机制质量审计** | `mechanical ≠ effective`（如 D5 只探文件存在）；仅预留 `mechanism_quality` |
| **改 `harness/prompts/` 纪律正文** | 非本棒；措辞随各闸 task |
| **T2 lifecycle 引擎 / G7 / G6 / N2-C** | 属其它棒或暂缓项 |
| **代发版 / 代签 human_gate** | Epic 级禁止 |

---

## 4. 验收标准

- [ ] `harness/discipline-coverage.yaml` 存在且通过 `discipline-coverage.v1` schema
- [ ] 种子覆盖 Starter 盘点主表条目（与 02 的 A–F 编号可对照；允许合并对照组 G 节为 notes，不要求逐字复制 03 统计表）
- [ ] 已落地缺口（至少 **G1、G2、G4** 及 PLAN 已 ✅ 的文档闸）在资产中体现为 **非**「仍纯 prompt-only 且 gap 未关闭」的过时叙述（status/gap/closed_in 之一须反映已机械）
- [ ] 非法 YAML fixture → 测试失败且信息可定位
- [ ] 文档挂点：从 rethink 03（或 README）可链到 YAML；CHANGELOG 有 **2.10.0** 叙述
- [ ] `npm test` 全绿
- [ ] **无** `audit --discipline` UI；**无**强制重盘脚本/周程

---

## 5. failure_paths

| 触发条件 | 系统行为 | 可重试 |
|----------|----------|--------|
| YAML 不符 schema | 测试 /（若将来 CLI）校验 exit ≠0 · 指出路径/字段 | 修 YAML |
| 种子与 02 编号明显漏行（空或极少） | 验收失败（length / 抽样 id） | 补转录 |
| 文档仍把 03 md 表当唯一真值 | 验收挂点失败 | 改 03/README 指针 |
| 误把本波做成 audit UI | 超出非范围 · 20/40 拒收 | 回退 UI |
| T2 未 CLOSE 却开 T3 改码 | Epic 串行违纪 · 00/人闸拦截 | 等 T2 CLOSE |
| 仅改 docs、未进 `harness/` 包路径 | 资产不可随 npm 分发 · 验收失败 | 移入 `harness/` |

---

## 6. 依赖与引用

- Epic：`docs/harness/guides/EPIC_post_g4_menu_serial_t1t2t3_v1_zh.md`
- RETRO 点菜 #3：`docs/harness/guides/RETRO_post_g4_n1n4_debt_v1_zh.md` §4
- rethink：`cyning-harness/docs/rethink/2026-07-mechanization-rate/{02,03,04,README}.md`
- 形态先例：`harness/lifecycle.yaml` + `schema/lifecycle.v1.schema.json`（本波 **可不**镜像 `lifecycle show` CLI）
- 机制编号：rethink README M1–M10
- 当前包版本基线：`@cyning/harness@2.9.0`

---

## 7. 思考轮（10-spec 回填 · R0–R5）

### R0 · 读入与约束

读入：Epic T3 行（`discipline-coverage.yaml` + 文档挂点）· RETRO #3 不做清单 · rethink 03 §5 / 04 §4 · PLAN closed 已落地表 · lifecycle 资产先例。  
约束：串行 T3；发版窗 **2.10.0**；可为无 CLI；**early_stop=no**；禁止重盘周与 audit UI。

### R1 · 范围 / 非范围 / 场景

**场景**：

1. **S1 维护者**：发版前问「Starter 还有哪些 prompt-only？」→ 打开 YAML / 将来工具读同一文件。  
2. **S2 补闸作者**：合入新闸 PR 时改一行 status（❌→✅），CHANGELOG 与矩阵同步。  
3. **S3 Agent/评审**：验收「资产是否在包内且 schema 绿」，而非再开一周盘点。

**范围**：D1–D5（YAML + schema + test + 文档 + 维护约定）。  
**非范围**：重盘 Extended、audit UI、机制质量、改 prompts、T2/G7 等。

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|--------|------|------|------|
| 落点 | 仅 rethink md 更新 / `docs/` 下 YAML / **`harness/` 包内 YAML** | **`harness/discipline-coverage.yaml`** | 与 lifecycle 同构；进 npm `files`；业务仓 upgrade 可见 |
| 消费者 | 无 / schema+test / + `discipline show` / + `audit --discipline` | **schema + npm test + 文档挂点** | 满足「资产化」与可测；CLI/UI 属膨胀；Lead 允许 docs-only |
| 种子方法 | 全量重盘周 / **转录 02+03 并刷新已落地状态** / 只写空壳 | **转录 + 状态刷新** | RETRO 禁止重盘；空壳无验收意义 |
| 与 03 md 关系 | 双真值并行 / **YAML=SoT·md 指针** / 删除 03 | **YAML SoT · 03 改指针** | 保留思考叙事；消漂移 |
| 发版 | 独立 patch / **同窗 2.10.0（T2）** | **2.10.0** | Epic 统一复检；无 CLI 亦不单开无意义版本号 |
| CLI show | 本波做 / **不做** | **不做（本波）** | 降低 T3 与 T2 抢实现带宽；预留下波 mirror lifecycle |

**弃选**：audit UI（Epic/RETRO 明文）；仅 md 统计不加 YAML（违背 04 §4）。

### R3 · 边界 / 失败语义 / 安全

- **挂点**：资产在「新闸已存在之后」更新（合入闸的同版本）——符合 03 反模式「挂点晚于产物」。  
- **误报**：schema 只锁形状与枚举，不锁「status 是否政治正确」；内容对错靠 20/人审与 dogfood。  
- **泄压**：无 BLOCKING 运行时闸；坏 YAML 只挡本仓 `npm test` / 发版复检。  
- **安全**：只读资产；不写用户仓；不含密钥。  
- **串行**：T3 30 须 T2 CLOSE（Epic）；SPEC/task 起草可先行，**改码合入**遵守串行。  
- **兼容**：旧版包无此文件 · 行为不变。

### R4 · 验收 / 可测性 / test_strategy

`test_strategy: required`：schema 正反例 + 包内文件必过。  
可观测：路径存在、校验绿、文档链接、CHANGELOG、无 UI 命令。  
不要求：覆盖率百分比与 03 历史数字逐格相等（因已落地闸会改写占比——以 YAML 新快照为准，03 可保留旧数字并注明过时）。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

SPEC 自足：D 包清晰、R2 弃选写死、非范围与 Epic 对齐、发版窗 2.10.0。  
**可交 00** 起草 task：`task_slug` 建议 `cyning-harness-discipline-coverage-yaml`；Open Folder `cyning-harness/`；`lightweight_task` 可由 00 裁量（投影清晰时可 yes + 10-task early_stop 理由）。  
图谱无需 bootstrap。  
**下一棒**：可选轻量 **20-spec-audit** → **HG-SPEC-SIGNOFF** → 00 draft task（若维护者直接签收可跳过书面审，链纪律上推荐轻量 20）。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 转录时 status 刷新可能与个别 prompt 细读不一致（非重盘的诚实边界，03 §5 同类）；② 无 CLI 时发现性弱，依赖文档挂点；③ 与 T2 同窗 2.10.0 时 CHANGELOG 合并叙述易漏写本资产——发版复检须勾；④ `gaps[]` 与 statements 双写可能漂移——30 宜单测一致性或只保留一层真值 |
| `round_extension_note` | — |

---

## 8. 给 00 的 task 投影提示（非 task 正文）

| 项 | 建议 |
|----|------|
| task_slug | `cyning-harness-discipline-coverage-yaml` |
| Open Folder | `cyning-harness/` |
| 交付文件 | `harness/discipline-coverage.yaml` · `schema/discipline-coverage.v1.schema.json` · `test/…` · 文档指针 · CHANGELOG |
| 依赖 | Epic：T2 CLOSE 后方可本棒 30；SPEC 本文件 signed |
| 版本 | 记入 **2.10.0**（可与 T2 同 PR 或同 tag 窗口） |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-25 | 10-spec R0–R5 · Post-G4 Epic T3 · early_stop=no · draft |
| 2026-07-25 | 维护者签收（对话「签收」）→ `signed` · 00 起草 task · N3 纸链审查文 |
