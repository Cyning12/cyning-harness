# SPEC：闭环硬闸升级（graph_delta · KPI close · experience · consumer ontology）（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `draft` · 待维护者签收或书面 `skip_10_spec` |
| **日期** | 2026-07-28 |
| **track** | `feature` · close/verify 行为增强 |
| **上游分析（工作区）** | `Projects/docs/harness/guides/ANALYSIS_cyning_harness_close_loop_hard_gates_gap_20260728_v1_zh.md` |
| **上游 PLAN（工作区）** | `Projects/docs/harness/guides/PLAN_cyning_harness_close_loop_hard_gates_upgrade_v1_zh.md` |
| **前置** | U0：`SPEC-verify-pre30-invoke-hats-gate_v1` 已合入 `main`（目标同窗发版 **2.17.0**） |
| **建议版本** | **v2.17.0**（与 U0 同 npm 发版窗口；若分开发则 U1≥2.17.0） |

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `close-loop-hard-gates` |
| **test_strategy** | `required` |
| **test_strategy_note** | close 缺 graph_delta note / 空 KPI / required 无经验节 → 可失败单测；verify graph_delta WARN；豁免旗留痕 |
| **skip_spec_audit** | `false`（维护者可书面 skip） |
| **graph_change_layer** | `none`（产品包自身无业务 `_tech_graph` 增量义务） |
| **review_hat** | `20` |

---

## 1. 背景与目标

Demo / dogfood 需要 close（及必要 WARN）**机械强制**：`graph_delta` 声明、KPI 打分形态、`experience_capture` 经验节、绿野仓 consumer ontology 模板。当前仅为模板字段或文档软约束。

**一句话**：把 G1 / G3 P0 / G4 / G2 P0 升为可机械执行；**不**削弱既有 invoke close / pre-30 verify 硬闸。

---

## 2. 范围（按 Gap）

### 2.1 G1 · `graph_delta`

1. 主 `harness/templates/TASK_TEMPLATE.md` 增加：
   - `graph_delta`: `path` \| `none`
   - `graph_delta_note`: `none` 时必填
2. `task close`（默认）：
   - 缺字段 → **WARN**（v1）
   - `none` 无 note → **BLOCK**
   - `≠ none`：声明路径相对仓根存在（或非空 `_tech_graph` 相对路径）；**不做** AST diff
3. `verify --task`：同规则 **WARN**（不挡 30）；可选 `--strict-graph-delta` → BLOCK
4. USER_GUIDE：改码 task 推荐「答 graph_delta → 必要时改图 → `verify --graph`」

### 2.2 G3 P0 · KPI close 最小打分

当 `kpi_aggregator` 为 `CLOSE`（默认）且执行 close：

1. 存在 `### KPI`（或既有 status 识别的 KPI 节）
2. 节内至少一种可解析分数标记：
   - `Task_KPI%` 行含数字；或
   - 表含 `D1`…`D5` 与档位/分数；或
   - 简表四维（质量/过程/可观测/回馈）各 1–5
3. 失败 → close **BLOCK**；`--allow-kpi-gap` 豁免留痕
4. **不**在 verify 挡 30

### 2.3 G4 · `experience_capture`

- `required`（或缺省且策略=required）：close 要求标题匹配 `### 经验` / `### Experience` / `### 经验总结` / `### lessons`（大小写不敏感）；节内非空（≥80 字符或 ≥3 条列表）
- `not_applicable`：须一行理由
- `recommended`：WARN only
- 失败 → **BLOCK**；`--allow-experience-gap` 豁免留痕

### 2.4 G2 P0 · Consumer ontology bootstrap

1. 模板：`harness/templates/ONTOLOGY_consumer_slice_v1.md`
2. ONBOARDING / 相关节：绿野推荐 `init` → 填 slice → `01_struct` → 签 `HG-GRAPH-MODULES`
3. `examples/demo_checkout` 最小切片样例
4. **不**把 consumer 并入产品 `ontology-check`

---

## 3. 非范围

- G1.b 代码↔图谱 AST 对齐
- G3 P1 全量 KPI_RUBRIC schema 嵌入 / `kpi_score_present` status 字段（可 U3）
- G2 P1 lint WARN（可选后续）
- 改 cyning-harness-web / Ops Desk 业务码
- PR/gh 合并逻辑进 CLI
- 放宽既有 invoke / pre-30 硬闸

---

## 4. 验收标准

- [ ] 单测：缺 graph_delta note / 路径不存在；空 KPI；required 无经验节 → close 失败；豁免旗留痕
- [ ] verify：graph_delta 缺省 WARN；`--strict-graph-delta` 可 BLOCK
- [ ] 金样 / fixture / 主 TASK_TEMPLATE 含新字段
- [ ] USER_GUIDE + CHANGELOG（归入 **2.17.0** 或维护者指定号）
- [ ] G2：模板 + ONBOARDING + demo_checkout 样例
- [ ] `npm test` 全绿
- [ ] **不**默认依赖 `--allow-*-gap` 作为绿路径

---

## 5. 失败路径（产品行为）

| 触发 | close / verify | 豁免 |
|------|----------------|------|
| `graph_delta=none` 无 note | close BLOCK | （无专用豁免；改正文） |
| KPI 节无分数 | close BLOCK | `--allow-kpi-gap` |
| `experience_capture=required` 无经验节 | close BLOCK | `--allow-experience-gap` |
| graph_delta 路径不存在 | close BLOCK（`≠none`） | （改正文或改路径） |

---

## 6. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 首稿 · 00 吸收 ANALYSIS/PLAN · 目标同窗 2.17.0 |
