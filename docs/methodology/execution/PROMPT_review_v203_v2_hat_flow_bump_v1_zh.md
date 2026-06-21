# cyning-harness · V2 帽链复查 + 小版本升级 Prompt

> **Open Folder**：**`cyning-harness/`**（产品仓根 · **非** `Projects/` 工作区根）  
> **角色**：维护者 Agent · **文档/纪律包**复查 · 可选 **patch 发版**  
> **触发提交**：`b868671` · `docs(product): V2 帽链 SDD_HAT_FLOW_v2 与本体/Starter 对齐`  
> **当前版本**：`package.json` → **2.0.3**

| 项 | 值 |
|----|-----|
| **task_slug** | `cyning-harness-v2-hat-flow-review` |
| **auditor_hat** | 自检 + 维护者 CLOSE（**非** 工作区 20-task-audit） |
| **目标版本（若通过）** | **2.0.4**（docs-only patch · 无 CLI breaking） |
| **HG-RELEASE** | npm publish / GitHub Release **须人签** · Agent **仅** bump + CHANGELOG + tag + push（若用户授权 push） |

---

## 用法

1. Cursor **Open Folder** → `cyning-harness/`  
2. **新对话** · 复制下方 **§ 可复制 Prompt 正文**  
3. Agent 落盘复查结论 → 无阻塞则执行 **2.0.4** 升级清单  

---

## 复查范围（须逐项 pass / fail）

### A · 帽链真值一致性

| # | 核对项 | 路径 |
|---|--------|------|
| A1 | **标准流程** 与人描述一致（00→10-spec→20-spec→HG-SPEC-SIGNOFF→00 task→10-task→20-task→HG-AUDIT→30⇄40→50→CLOSE） | [`../product/SDD_HAT_FLOW_v2_zh.md`](../product/SDD_HAT_FLOW_v2_zh.md) |
| A2 | §3.2 / §4.1 / §8 与 A1 **无矛盾** | [`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) |
| A3 | `ontology.yaml` **version 1.3** · `starter_hats` / `extended_hats` / D1·D2 与 A1 一致 | [`../../../ontology.yaml`](../../../ontology.yaml) |
| A4 | `harness/prompts/README` + **30/40** 写明 **同 Agent 闭环** | [`../../../harness/prompts/`](../../../harness/prompts/README.md) |
| A5 | 入口文档链到 V2 流程 | [`../../../README.md`](../../../README.md) · [`../../../AGENTS.md`](../../../AGENTS.md) · [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md) |

### B · 残留旧编号（应为别名或已更新）

| # | 核对项 |
|---|--------|
| B1 | 无 **唯一真值**仍写「10→22→30 金样」且无 V2 上下文 |
| B2 | `22-task-audit` / `10-requirements` 文件 **HEADER** 标明 V2 hat_id |
| B3 | `lib/` · `test/` · `golden/` · `examples/demo_checkout/` · `docs/USER_GUIDE*.md` 中 **blocks 30 / D2** 语义仍正确（pending gate 禁 30） |
| B4 | [`../pointers/SDD_HAT_FLOW_v1_zh.md`](../pointers/SDD_HAT_FLOW_v1_zh.md) 指向 **SDD_HAT_FLOW_v2** |

### C · 机械验证（须跑命令 · 贴退出码）

```bash
cd /path/to/cyning-harness
npm test
node bin/harness.js check --target examples/demo_checkout 2>/dev/null || true
npm pack --dry-run 2>&1 | head -20
```

| # | 通过标准 |
|---|----------|
| C1 | `npm test` 全绿 |
| C2 | `harness check` 无新增 error（warn 须列出） |
| C3 | `npm pack` 无 `_sandbox` / `.env` / 密钥路径 |

---

## 落盘（必须）

路径：`docs/methodology/execution/reviews/review_v2_hat_flow_YYYYMMDD.md`

文内结构：

1. 元信息（base commit · 审查 Agent · 日期）  
2. **A/B/C 核对表**（每项 pass / fail + 一行证据）  
3. **阻塞 / 非阻塞** 清单  
4. **结论**：`ready_for_2.0.4` | `needs_fix`（附修复文件列表）  

---

## 若无阻塞 · 2.0.4 升级清单（顺序执行）

> **范围**：仅 docs/ontology/prompts/版本号 · **不改** CLI 行为除非测试失败迫使修 bug。

- [ ] `package.json` → `"version": "2.0.4"`  
- [ ] `ontology.yaml` → `product_semver: "2.0.4"`（若字段存在）  
- [ ] `CHANGELOG.md`：将 [`Unreleased`] 下写入 **2.0.4** 节（Added/Changed · 链 `SDD_HAT_FLOW_v2` · DESIGN_ONTOLOGY v1.3 · 30⇄40 纪律）  
- [ ] 修复 B 节发现的 **阻塞** 文档漂移（若有）  
- [ ] `npm test` 再跑一遍  
- [ ] `git commit`（type: `docs(release)` 或 `chore(release)`）  
- [ ] `git tag v2.0.4` · **仅当用户明确要求 push 时** `git push origin main && git push origin v2.0.4`  
- [ ] **npm publish**：**禁止 Agent 自动执行** · 输出 [`TEMPLATE_HG_RELEASE_v1_zh.md`](./TEMPLATE_HG_RELEASE_v1_zh.md) 勾选提醒给人  

---

## 禁止什么

- **Open 工作区根**改 Ink `docs/harness/`（本 Prompt 只动 **cyning-harness** 仓）  
- 未跑 C 节就宣称 ready  
- 无复查 md 就 bump 版本  
- 擅自 `npm publish` · 改 GitHub visibility  

---

## 可复制 Prompt 正文

```text
你是 cyning-harness 维护者复查 Agent。Open Folder 必须是 cyning-harness 产品仓根。

## 背景
刚合并 V2 帽链文档（commit b868671）：SDD_HAT_FLOW_v2、DESIGN_ONTOLOGY v1.3、ontology.yaml、Starter prompts 30⇄40 同 Agent 纪律。当前 package 版本 2.0.3。

## 必读
@docs/methodology/execution/PROMPT_review_v203_v2_hat_flow_bump_v1_zh.md
@docs/methodology/product/SDD_HAT_FLOW_v2_zh.md
@docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md
@ontology.yaml
@harness/prompts/README.md
@harness/prompts/30-execute-code.md
@harness/prompts/40-self-check.md
@CHANGELOG.md
@package.json

## 任务
1. 按 Prompt 文档 **A/B/C** 节逐项复查；跑 npm test 与 harness check（命令见 C 节）。
2. 落盘 docs/methodology/execution/reviews/review_v2_hat_flow_YYYYMMDD.md。
3. 若无阻塞：执行 **2.0.4 升级清单**（bump · CHANGELOG · commit · tag v2.0.4）。
4. 若有阻塞：只输出修复清单与最小 diff 建议，**不要** bump 版本。
5. 结尾输出：审查结论 · commit short-hash · 是否 ready for HG-RELEASE（npm 须人签）。

## 标准流程真值（核对用）
人+00 大纲 → 10-spec R0–R9 → 20-spec-audit + HG-SPEC-SIGNOFF → 00 起草 P0 task → 10-task → 20-task-audit R1 → HG-AUDIT-R1 → 30→40（同 Agent 自修重跑）→ 50（↺30）→ CLOSE。
```

---

## 修订记录

| 日期 | 摘要 |
|------|------|
| 2026-06-21 | v1：post b868671 复查 + 2.0.4 patch 升级 Prompt |
