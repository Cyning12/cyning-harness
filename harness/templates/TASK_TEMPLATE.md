# Task：<动词 + 范围>

> **状态**：`draft` / `pending` / `in_progress` / `done`  
> **关联图谱**：`docs/_tech_graph/` 相关 flow（无则填「无」）  
> **落盘**：`docs/tasks/active/task_<slug>.md`；验收后 `git mv` → `docs/tasks/done/`

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `<slug>` |
| **test_strategy** | `required` / `recommended` / `not_applicable` |
| **test_strategy_note** | （`not_applicable` 时 **必填**） |
| **code_quality_bar** | `strict` / `recommended` / `not_applicable` |
| **freeze_id** | （可选 · 关账冻结） |
| **orchestration** | `Cursor Task 链` / `MANIFEST 仅` |
| **chain_prompt** | `docs/harness/prompts/PROMPT_cursor_task_chain_serial_v1.md`（嵌入后路径） |
| **semi_auto** | **`false`**（禁止作总闸） |
| **audit_profile** | `full` / `post_close` / `human_only` |
| **git_branch** | `task/<slug>` |
| **worktree_root** | （并行时填独立 worktree 目录） |
| **experience_capture** | `required` / `recommended` / `not_applicable` |
| **kpi_rubric** | `KPI_RUBRIC_v1_2` |
| **kpi_aggregator** | `CLOSE`（默认） |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | pending | 22-R1, 30 | 初稿人扫 |
| HG-AUDIT-R1 | pending | 30 | 22 R1 落盘后人签 |

---

## 背景与目标

<短段落：完成态行为>

---

## 范围

- [ ] …

## 非范围

- …

---

## 失败路径

| 触发条件 | 系统行为 | 可重试 | 用户可见 |
|----------|----------|--------|----------|
| 22 未签 `HG-AUDIT-R1` 即 30 改码 | 执行 Agent **拒开工** | 是 | 须先 22 + 人签 |
| … | … | 是/否 | … |

---

## 验收标准

- [ ] …

---

## 给执行帽的必读列表

1. `AGENTS.md` · `docs/meta/PROJECT_CONFIG_*.md`
2. `docs/_tech_graph/` 相关 flow
3. `docs/standards/CODING_*_L2`（涉码 task）
4. 本 task 关联 SPEC（若有）

---

## 实现备忘（子 Agent 回填）

| 项 | 状态 | 备注 |
|----|------|------|
| … | ⏳ | |

---

## 测试策略（Harness）

**test_strategy**: `required` | `recommended` | `not_applicable`

- `required`：先可失败自动化测试再改实现
- `recommended`：文档演练或抽样验证
- `not_applicable`：须附一行理由

---

### 自检结论（执行者）

（30/40 回填）

---

### KPI（00）

（`kpi_aggregator: CLOSE` · 关账回溯填写）

---

## 修订记录

| 日期 | 说明 |
|------|------|
| YYYY-MM-DD | 从 cyning-harness `TASK_TEMPLATE.md` 嵌入 |
