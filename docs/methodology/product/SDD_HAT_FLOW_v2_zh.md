# SDD 帽链流程（V2 · 产品仓真值）

| 项 | 内容 |
|----|------|
| **版本** | **v2.1** |
| **日期** | 2026-07-29 |
| **关联** | [`DESIGN_ONTOLOGY_v1_zh.md`](./DESIGN_ONTOLOGY_v1_zh.md) §3.2 · §4.1 · §8 · [`../../../harness/prompts/README.md`](../../../harness/prompts/README.md) |
| **工作区 Extended** | `docs/harness/guides/GUIDANCE_harness_hat_v2_chain_v1_zh.md`（Ink monorepo · POINTER） |
| **自描述图谱 SPEC** | 工作区 `docs/harness/spec/cyning_harness_self_glayer_v1/`（meta · 非本文件双写长文） |

---

## 1. 标准流程（功能 / Epic · 路径 A）

```text
人 + 00 chat 生成大纲
  → 10-spec R0–R9（回填 SPEC · 可多轮）
  → 20-spec-audit（规格验收 · reviews/）
       ↔ HG-SPEC-SIGNOFF（人签 · 未过则回到 10-spec 或 20 再审）
  → 00 起草 P0 task（自 SPEC 投影）
  → 10-task（回填 task）
  → 20-task-audit R1（reviews/ · 可打回 10-task）
       ↔ HG-AUDIT-R1（人签）
  → 30 实现
  → 40 自检（通常由 30 同一 Agent 连续执行 · 失败自修并重跑 40 直至通过 · 无需单独开 40 对话）
  → 50 独立复检（可选 · 未过打回 30）
  → CLOSE（关账 · KPI）
```

**10 / 20 配对**

| 10 | 20 | 人闸 |
|----|-----|------|
| 10-spec | 20-spec-audit | HG-SPEC-SIGNOFF（或 task 声明的等价闸，如 `HG-SPEC-SELF-GLAYER`） |
| 10-task | 20-task-audit | HG-AUDIT-R1 |

历史别名：`10-requirements`→10-task · `22-task-audit`→20-task-audit。

---

## 2. 路径变体（强制选型 · 写进 task）

| 路径 | 适用 | 帽序摘要 |
|------|------|----------|
| **A · 完整** | 新功能 / Epic | §1 全文 |
| **B · bugfix** | Issue ≈ mini-SPEC 且已签 | **跳过** 10-spec / 20-spec-audit → 00 task → 10-task → 20-task-audit → … |
| **C · 轻量 task** | SPEC **已 signed** · task 仅为投影 | 00 草稿 → 10-task（可 early_stop）→ **不得跳** 20-task-audit → HG-AUDIT-R1 → 30 |
| **D · Inform / 图谱分期** | 文档 · `_tech_graph` · meta worktree · **无运行时改码** 或仅脚手架目录 | 见 **§5**（本版新增） |

**禁止**：聊天「继续 / 开工」代替人闸；`HG-*` 的 `pending→approved` **仅人**。

---

## 3. 打回与关账

| 节点 | 常见打回 | 说明 |
|------|----------|------|
| 20-spec-audit | → **10-spec** | 规格缺口 · 人闸 pending / rejected |
| 20-task-audit | → **10-task** | task 验收 / failure_paths 不可执行 |
| 50 | → **30** | 独立视角发现实现问题 |
| CLOSE | → **下一 task / SPEC 增量** | 小问题留后续迭代 |
| CLOSE | → **10-spec 或 10-task** | 结果与预期相差太远 · 维护者决策重开 |

**30→40**：不强制新对话；30 Agent 跑验证命令、回填 `### 自检结论（执行者）`，不通过则改码再跑，直到 task 所列命令绿。

**00**：编排层 · **不写产品实现码**（`lib/` · `bin/` 业务逻辑）· 起草 SPEC/task · 派下一棒 Prompt · 可改编排文档 / POINTER / 帽链本文。

---

## 4. 开工硬闸（与 CLI 对齐 · 摘要）

> 真值在包行为与 `docs/spec/`；本文只定帽序关系，避免与 USER_GUIDE 双写细则。

| 闸 / 检查 | 挡谁 | 说明 |
|-----------|------|------|
| **人闸表** `pending` | 声明的 `blocks_hats` | 遇 pending **停** · 只输出 `gate_id` + 路径 |
| **verify · pre-30 invoke** | `may_start_30` | 缺 required ∩ {10,20,00} 的 invoke → BLOCK（`minimal` / `--allow-invoke-gap` 例外见产品 SPEC） |
| **gate-check --graph** | 改码类 30（用户仓 D4-a） | `HG-GRAPH-MODULES` + `docs/_tech_graph` 模块表；**Inform 分期** 在模块表未签前 **只允许** 建树/填表类 task |
| **close · invoke / reviews** | CLOSE | 集合硬闸 · 与 verify 语义分工见产品 SPEC |

30 帽首出须含 GATE_VERIFY（含 `graph_change_layer` / `review_hat` 若 task 已启用这些字段）。

---

## 5. 路径 D · Inform / 自描述图谱 / meta worktree（v2.1）

### 5.1 何时用 D

- 产品仓 **自身** `docs/_tech_graph`（如 `cyning/meta` · 本地目录常名 `cyning-harness-meta/`）  
- 用户仓 graph bootstrap / G-L 物理分层迁入  
- **仅** Markdown / YAML 图谱 · 目录脚手架 · POINTER；**不**改 `lib/*.js` 行为  

与 **模板回灌**（改 `graph/templates/` 给用户）正交：后者走路径 **A**（行为/模板变更），前者走 **D** 或 A（若同时改编译器）。

### 5.2 编排壳 vs 阶段子 task

```text
00（工作区）签收 SPEC（如 HG-SPEC-SELF-GLAYER）
  → 00 更新本帽链真值（若缺口）· 起草分期子 task
  → 每阶段一个子 task（建议）：
       P1  worktree + 空物理树
       P2  G-L0 索引 + POINTER
       P3  G-L1 01_modules
       P4  G-L1 flow（每轮 ≥1 · 禁止一次画满）
       P5  G-L2 indexes（按需）
       P6  graph.json / gate-check dogfood
  → 每子 task：路径 C 或 D′（下）→ 30 → 40 → CLOSE
```

**编排壳 task**（epic 级）：可只签 `HG-TASK-DRAFT` + SPEC 闸；**不**在壳上直接 30 写树。  
**子 task**：须自有 `HG-AUDIT-R1`（或维护者书面 skip）后方可 30。

### 5.3 D′ · 文档 30 的约定

| 项 | 约定 |
|----|------|
| **Open Folder** | meta：`cyning-harness-meta/`；主线实现：`cyning-harness/`；编排：`Projects/` |
| **worktree_root / git_branch** | task 头必填且与 cwd 一致 |
| **graph_change_layer** | `none` \| `G-L0` \| `G-L1` \| `G-L2`（不可省语义） |
| **review_hat** | 默认 `20`；高风险 G-L0 跨仓语义可 `50` + 一行理由 |
| **test_strategy** | 纯文档常 `not_applicable` + 一行理由；P6 校验命令可改 `required` |
| **40 自检** | 目录存在性 · yaml/md 成对 ·（若有）`npx @cyning/harness graph yaml check` |

### 5.4 人闸（自描述图谱实例）

| human_gate_id | 挡 | 备注 |
|---------------|----|------|
| HG-SPEC-SELF-GLAYER（或 HG-SPEC-SIGNOFF） | P1+ | SPEC 签收 |
| HG-GRAPH-MODULES | P4+ 加深 flow / 改码自举 | 模块表维护者签 |
| HG-META-MERGE | meta → main | 默认长驻 meta · 另议 |

Git 命名纪律：本地目录 `*-meta/` ≠ 新 GitHub 仓名（见工作区 POINTER）。

---

## 6. Starter 包与用户仓

| 帽 | 产品仓 Starter | 完整 Prompt |
|----|----------------|-------------|
| 10-task | `harness/prompts/10-task-requirements.md` | 工作区 Extended |
| 10-spec | `harness/prompts/10-spec-requirements.md` | 同上 |
| 20-task-audit | `harness/prompts/20-task-audit.md` | 同上 |
| 20-spec-audit | `harness/prompts/20-spec-audit.md` | 同上 |
| 30 / 40 | ✅ Starter（含 GATE_VERIFY fragment） | 同上 |
| 00 / 50 / 链式 | POINTER | 工作区 `docs/harness/prompts/` |

工作区 Ink 全量库：[`GUIDANCE_harness_hat_v2_chain_v1_zh.md`](../../../../docs/harness/guides/GUIDANCE_harness_hat_v2_chain_v1_zh.md)（POINTER · 私有 monorepo）。

---

## 7. 00 派棒检查单（开工前）

- [ ] 路径 A/B/C/D 已写进 task  
- [ ] 挡本棒的 `human_gate` 均为 **approved**（或书面 skip）  
- [ ] `worktree_root` / Open Folder / 分支无冲突（尤其 `cyning/meta` vs `task/*`）  
- [ ] 改码类：verify pre-30 / graph 闸已理解  
- [ ] Inform 分期：本轮只承诺 **一个** 阶段（P1…P6 之一）  

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v2.0 | 2026-06-21 | 与 Ink 工作区 V2 对齐 · 30→40 同 Agent · 50/CLOSE 打回规则 |
| v2.1 | 2026-07-29 | 路径 B/C/D · verify/pre-30/graph 摘要 · Inform/meta 分期 · 00 检查单 · Starter 文件名对齐 |
