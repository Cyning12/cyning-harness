# SPEC：Post-G4 / N1–N4 欠账复盘与下一 Epic 点菜（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收」）  
> **track**：`docs`（评估轨 · 非改码 Epic）  
> **关联图谱**：无（文档复盘；不改 `_tech_graph`）  
> **上游**：[`PLAN_post_g4_next_mechanization_v1_zh.md`](../../../docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md)（**closed**）· rethink [`2026-07-mechanization-rate/`](../rethink/2026-07-mechanization-rate/)（01–04）  
> **前置**：G1–G4 ✅ · N1–N4 `@cyning/harness@2.7.0–2.9.0` published · CLOSE ✅  
> **下游**：00 已起草 task（HG-TASK-DRAFT pending）→ 20-task-audit → HG-AUDIT-R1 → 30 写复盘文；**不**直接发版

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `post-g4-debt-retro` |
| **test_strategy** | `not_applicable` |
| **test_strategy_note** | 交付物为复盘文档 + 欠账表 + ≤3 条下一 Epic 点菜建议；不改引擎/CLI/包版本；无可失败自动化测试对象 |
| **entry_invoke_10_spec** | `Projects/docs/harness/invokes/by-task/cyning-harness-post-g4-debt-retro/invoke_20260725_10_spec_post_g4_debt_retro.md` |
| **entry_invoke_00_draft** | `Projects/docs/harness/invokes/by-task/cyning-harness-post-g4-debt-retro/invoke_20260725_00_draft_post_g4_debt_retro.md` |

---

## 1. 背景与目标

2026-07-24～25 完成文档层主链机械化收口：

| 波次 | 版本 | 要点 |
|------|------|------|
| G1+G3 | 2.3.0 | `task lint` 结构 / 绝对路径 |
| G2 | 2.5.0 | reviews 留档（`--task` / close） |
| G4 | 2.6.0 | 思考轮结构（条件触发） |
| N1+N2 | 2.7.0 | `lifecycle.yaml` + `verify --task` lint **WARN** |
| N3 | 2.8.0 | `verify --spec` |
| N4 | 2.9.0 | 裸 `verify` 全量 reviews + 双路径 active |

[`PLAN_post_g4_next_mechanization_v1_zh.md`](../../../docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md) 已 **closed**。维护者指令：**针对最近欠账与更新做复盘**；须 **多轮思考防遗漏**（禁止 early_stop）。

**问题（PLAN 关闭后真空）**：候选下一棒（方向二引擎 / 方向三 git·契约 / dogfood 修齐 / N2-C block）散落在 PLAN §1–§3、rethink 03–04、各 SPEC residual、dogfood 口头结论中，**无单一复盘真值** → 点菜易漏项或重复立项。

**目标**：产出一份可签收的复盘交付包，使维护者能在「不改码、不发版」前提下完成点菜决策；并显式点名全部已知欠账与双仓发布态。

---

## 2. 范围（R2 裁定后）

### D1 · 复盘文落盘

- 主文路径（二选一 · 实现 task 时定稿，本 SPEC 推荐见 R2）：  
  - **推荐 A**：`docs/harness/guides/RETRO_post_g4_n1n4_debt_v1_zh.md`（工作区编排可见 · 与 PLAN 同层）  
  - **备选 B**：`cyning-harness/docs/rethink/2026-07-post-g4-debt-retro/`（产品仓 rethink 续篇）  
- 正文须含：时间线摘要、机械化率叙事更新（Starter 文档闸主链已覆盖 vs 仍 prompt-only）、PLAN closed 后真空说明。

### D2 · 欠账清单表（强制四栏分类）

| 分类 | 必须点名的项（最低集 · 复盘可增「新发现」行） |
|------|-----------------------------------------------|
| **已关账** | G1–G4；N1–N4 `@2.7–2.9`；PLAN closed |
| **未修齐** | dogfood 缺审查文 **3**：`a5_cli_verify` · `hat_chain_pointer_sync` · `task_validate_human_gate_ci_gate`（闸可 30；N4 不强制修齐） |
| **暂缓** | N2-C（lint→block）；G7 执行证据；G6 git 行为；HGM G2 查询；全量模式不跑 lint/D5（N2/N4 刻意非范围）；20 帽内容质量 / 40「真跑过」prompt-only |
| **新发现 / 运维态** | 产品仓 tag/`main`/npm 时序核对；编排仓 Projects **ahead origin**（复盘时点名实测；本波不强制 push） |

### D3 · 下一 Epic 点菜建议（≤3 条）

- 每条：一句话目标 · 归属方向（一/二/三/运维）· 理由 · **不做清单**（防膨胀）  
- 候选池（复盘文从中点菜，不必全开）：方向二状态机引擎骨架；G7；N2-C；dogfood 3 文修齐；方向三契约/G6；`discipline-coverage.yaml` 资产化；Projects push 卫生

### D4 · 双仓与发布态核对（只读报告）

- 复盘文内一小节：`@cyning/harness` 当前 version / tag `v2.9.0` / npm 是否对齐；Projects `origin/main` ahead 计数（复盘执行时重测）  
- **不**代推、不改 npm 脚本

### D5 · task 路径预告（仅指针）

- 建议 task_slug：`cyning-harness-post-g4-debt-retro`  
- 建议 active 路径：`docs/harness/tasks/active/task_cyning_harness_post_g4_debt_retro_v1.md`（**正文由 00 起草**；本 SPEC 不写 §5）

---

## 3. 非范围

- 本波 **不**实现引擎 / 不改 `packages` 或产品仓 CLI 行为  
- **不**强制修齐 3 个缺审查文 task（可列入点菜建议）  
- **不**发版（无 2.9.x / 2.10.0）  
- **不**把 lint 升 block（N2-C）、**不**做 G6/G7 实现、**不**开 HGM G2  
- **不**代签 `HG-SPEC-SIGNOFF` / 任何人闸  
- **不**更新 rethink 01–04 数字为「再审计」（可在复盘文注明「矩阵数字仍为 2026-07-24 快照，未重盘」）

---

## 4. 验收标准

- [ ] 复盘主文已落盘于 D1 裁定路径，简体中文，可独立阅读  
- [ ] 欠账表含四栏：已关账 / 未修齐 / 暂缓 / 新发现；最低集（§2 D2）无遗漏行  
- [ ] 明确写出 PLAN closed 后「点菜真空」与闭环方式（本复盘 + 点菜 ≤3）  
- [ ] 下一 Epic 建议 **≤3** 条，每条含理由 + 不做清单  
- [ ] dogfood 3 task basename 与双仓发布态（npm/tag/ahead）有专节或表行  
- [ ] 机械化率叙事：主链已机械 vs 20 内容质量 / 40 真跑过仍 prompt-only  
- [ ] `test_strategy: not_applicable` 理由在 task 元信息回填（与本 SPEC 一致）  
- [ ] 无产品代码 diff；无新版本号声称

---

## 5. failure_paths

| 触发条件 | 系统行为 / 文档行为 | 可重试 |
|----------|---------------------|--------|
| 复盘文漏写某已知欠账 | 20-spec-audit / 维护者退回 · 补表行 | 是 |
| 点菜建议 >3 条 | 拒签收 · 合并或降为「观察项」附录 | 是 |
| 把实现/发版写进本波范围 | 00/30 拒开工 · 拆独立 SPEC | — |
| 双仓状态与复盘时实测不符 | 复盘文标注「时点快照」· 不阻断签收 | 重测更新表 |
| 误将 3 缺审 task 当作本波必做 | 对照 §3 非范围 · 仅建议栏 | — |

---

## 6. 依赖与引用

- PLAN（closed）：`docs/harness/guides/PLAN_post_g4_next_mechanization_v1_zh.md`  
- rethink：`cyning-harness/docs/rethink/2026-07-mechanization-rate/{01..04,README}.md`  
- 最近 SPEC：`SPEC-verify-full-reviews-gate_v1.md`（N4 · dogfood 15/4/3）  
- N2 residual：lint block（选项 C）须 FAIL 率下降  
- dogfood active：  
  - `docs/harness/tasks/active/task_cyning_harness_a5_cli_verify_v101_v1.md`  
  - `docs/harness/tasks/active/task_harness_cyning_harness_hat_chain_pointer_sync_v1.md`  
  - `docs/harness/tasks/active/task_harness_task_validate_human_gate_ci_gate_v1.md`  
- 产品仓 `@2.9.0` · 编排仓 Harness 落盘惯例

---

## 7. 思考轮（10-spec 回填 · R0–R5 · 形态 A · 禁止 early_stop）

### R0 · 读入与约束

**读入**：维护者「新建任务 · 欠账与更新复盘 · 多轮防遗漏」；PLAN closed（N1–N4 published）；rethink 01（四方向排序）· 03（G7/G6 仍 P2/P3）· 04（lifecycle 文档先行已兑现；discipline YAML 仍建议）；N4 SPEC dogfood 3 缺审；用户明示欠账清单 1–8。

**约束**：

1. 只 SPEC + invoke；不实现、不发版、不代签。  
2. `early_stop=no` · 跑满 R5（防遗漏优先于省轮）。  
3. track=`docs` · `test_strategy=not_applicable`。  
4. 交付可观测：落盘路径 + 表 + ≤3 点菜，而非「聊过就算」。

**时点快照（10-spec 起草日 2026-07-25）**：产品仓 `main` 与 `origin/main` 对齐 · tag `v2.9.0` 存在 · npm `@cyning/harness@2.9.0`；编排仓 Projects **ahead origin 29**（含未追踪 interview/sim 文档等）——复盘执行须重测，防漂移。

### R1 · 范围 / 非范围 / 场景

**角色与场景**：

| 场景 | 谁 | 要什么 |
|------|-----|--------|
| S1 点菜 | 维护者 | 一张欠账全景 + ≤3 可开 Epic，避免 PLAN 关闭后口头漂移 |
| S2 考古 | 未来 10-spec / 面试叙事 | 「为何暂缓 G6/G7/N2-C」有单一出处 |
| S3 dogfood 卫生 | 编排 Agent | 知道 3 缺审是已知债非 N4 回归失败 |
| S4 发布卫生 | 维护者 | 双仓 tag/npm/ahead 是否再欠一刀 push |

**范围边界**：复盘 + 建议；**不**消化债本身。非范围见 §3——尤其「不修 3 文 / 不发版 / 不做引擎」防止复盘 task 膨胀成隐藏 30。

**遗漏扫描清单（R1 强制过一遍）**：

1. 发布流程：npm ↔ tag ↔ CHANGELOG ↔ 本地 vs origin  
2. 双仓：产品仓已同步 vs Projects ahead  
3. dogfood：3 缺审 + N4「不强制修齐」语义  
4. 机械化率：主链 ✅ vs 20 质量 / 40 真跑过 / 全量 lint·D5  
5. PLAN 真空：closed 后下一动作入口 = 本复盘  
6. 方向二/三接口：lifecycle 文档先行已有 → 引擎仍空  
7. HGM G2：无消费者暂缓（方向四）  
8. N2-C：warn→block 前置条件（FAIL 率）

### R2 · 方案对比

| 决策点 | 选项 | 裁定 | 理由 |
|--------|------|------|------|
| 复盘主文落点 | A 工作区 `guides/` · B 产品仓 `rethink/` · C 两者镜像 | **推荐 A 为主**；B 可作「索引一小段」链回 A（task 阶段二选一，勿双真值） | PLAN/点菜消费者在 Projects；rethink 01–04 已声明「非 SPEC」；镜像易漂移 |
| 形态 | 仅聊天纪要 / 正式 SPEC+复盘文 / 直接开引擎 Epic | **SPEC（本文件）→ 签收 → 00 task → 复盘文** | 维护者要「新建任务」；防遗漏须可审计；引擎 Epic 须点菜后再独立 SPEC |
| 点菜条数 | 开放列表 / 硬顶 3 / 只排序不建议 | **硬顶 ≤3** + 附录「观察项」可选 | 防同时开多 Epic；与 PLAN「点菜」语气一致 |
| 3 缺审处理 | 本波必修 / 仅列表 / 忽略 | **仅列表 + 可进点菜候选** | N4 已裁定不强制；复盘职责是可见化 |
| 是否重跑机械化率盘点 | 全量重盘 02/03 / 叙事增量 | **叙事增量**（主链已覆盖陈述） | 全量重盘另 Epic；本波防遗漏靠清单非重审计 |
| test_strategy | recommended / N/A | **`not_applicable`** | 无改码；验收=文档勾选 |

**弃选**：C 双落盘镜像（维护成本）；直接跳过 SPEC 开 30（违反帽链 · 且无范围闸）。

### R3 · 边界 / 失败语义 / 安全

- **边界**：复盘文不得声称「机械化率 XX%」新数字，除非附重盘方法；沿用 03 快照 +「主链已机械」定性即可。  
- **失败**：漏项 → 书面审退回；把实现塞进范围 → 拒开工。  
- **安全**：只读 git/npm 状态；不写密钥；不 push。  
- **依赖**：签收本 SPEC 前，00 **不得**把复盘做成改 CLI 的 task。  
- **误伤**：点菜若选「dogfood 修齐」勿与 N4 回归混淆——那是存量卫生，非 verify bug。

### R4 · 验收 / 可测性 / test_strategy

- 可测性 = **文档可勾选**（§4），非 pytest。  
- `test_strategy: not_applicable` + note（元信息已填）。  
- 建议 40 自检（task 阶段）：对 §2 D2 最低集做 diff 核对；`git status -sb` / `npm view` 结果贴进复盘「时点」节。  
- 不要求新建自动化测试文件。

### R5 · SPEC 签收就绪 · 是否可交 00 出 task

**自足性**：背景、范围/非范围、欠账最低集、落盘推荐、点菜硬顶、failure_paths、双仓注意均已写入。

**可交 00**：是。建议单 task：`cyning-harness-post-g4-debt-retro`（lightweight 文档 task · `test_strategy=not_applicable`）。图谱无需 bootstrap。

**签收后链路**：人签本 SPEC（或轻量 20-spec-audit）→ 00 起草 task → 10-task（可 early_stop 若仅投影本 §2）→ 20-task-audit → HG-AUDIT-R1 → 30 写复盘文。

**下一棒 Prompt 要点**：00 勿扩 scope 至 N2-C/G7 实现；点菜结论写进复盘文末「维护者待勾选」表即可。

### 思考轮控制

| 字段 | 值 |
|------|-----|
| `actual_last_round` | `R5` |
| `early_stop` | `no` |
| `early_stop_reason` | — |
| `residual_risks` | ① 复盘执行时双仓 ahead/npm 可能已变——须时点重测；② 点菜 ≤3 仍可能争议排序（方向二 vs dogfood 卫生）——留给维护者勾选非 Agent 代决；③ rethink 03 数字未重盘，对外叙事若引用百分比须标注快照日；④ Projects 未追踪文档与 ahead 29 混杂，复盘勿误判「全是 Harness 债」；⑤ 若维护者坚持复盘落产品仓 rethink，须避免与 guides 双真值 |
| `round_extension_note` | 维护者要求多轮防遗漏 · **禁止 early_stop** · 已跑满 R0–R5；未扩 R6 |

---

## 8. 建议点菜池（供复盘文精炼至 ≤3 · 非本波范围）

| ID | 候选 | 方向 | 一句话理由 | 典型不做 |
|----|------|------|------------|----------|
| P1 | 方向二：lifecycle **转移引擎**最小骨架 | 二 | YAML 已先行；挂点决策下一台阶 | 不做完整 runner / G7 同波硬塞 |
| P2 | dogfood：补齐 3 缺审查文 | 运维/卫生 | 裸 verify 工作区可绿；成本低 | 不改 verify 语义 |
| P3 | N2-C：`verify --task` lint **block** | 一 | WARN 债转真闸；须先证明 FAIL 率下降 | 不做全量 lint |
| P4 | G7 执行证据（`harness run`） | 二 | 40「真跑过」最大黑洞 | 不做 grep 伪证据 |
| P5 | 方向三：`--json` 契约收敛 / G6 调研 | 三 | Agent 消费者放大前置 | 不上 MCP |
| P6 | `discipline-coverage.yaml` 资产化 | 一 | 04 已建议；改进路线可版本化 | 不做重盘全量人工周 |

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-07-25 | 10-spec R0–R5（形态 A · early_stop=no）· 维护者指令「欠账复盘 · 多轮防遗漏」 |
| 2026-07-25 | 维护者签收（对话「签收」）→ `signed` · 00 起草 task |
