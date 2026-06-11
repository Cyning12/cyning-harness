# Task：<动词 + 范围> · #<issue>（阶段 C · OSS fork）

> **状态**：`draft`  
> **上游 Issue**：`<UPSTREAM>/issues/xxx`  
> **关联图谱**：`docs/_tech_graph/01_struct.md` · **增量** `graph_delta` 见下表  

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **task_slug** | `<slug>` |
| **test_strategy** | `required` / `recommended` / `not_applicable` |
| **orchestration** | Kimi Code Agent · **R0+R1–R5 思考** → 22 → 30 |
| **git_branch** | `feature/fix-<issue>-<short>` |
| **worktree_root** | 产品仓 Open Folder |
| **meta_worktree** | 过程轨 worktree（`cyning/meta`） |
| **module_id** | 来自 `01_struct` |
| **graph_delta** | `10_flow_*.md` 或 `none` |
| **graph_delta_note** | `none` 时必填 |
| **graph_gate** | `skeleton_before_30` · `close_partial_or_final` |

### 人工闸

| human_gate_id | status | blocks_hats | 说明 |
|---------------|--------|-------------|------|
| HG-TASK-DRAFT | pending | 22-R1, 30 | task + skeleton + **§4 思考轮闭合** |
| HG-AUDIT-R1 | pending | 30 | 22 思考审查通过 + skeleton commit 后人签 |

---

## 1. 需求摘要

（来自 Issue）

---

## 2. 非范围

- harness / task / invoke 进上游 PR

---

## 3. 失败路径

| 触发条件 | 系统行为 |
|----------|----------|
| `graph_delta≠none` 且无 skeleton commit | 30 拒开工 |
| §4 R1–R5 仍有 `（待填）` 且无合法 **思考轮控制** | 22 退回 10 · 30 拒开工 |
| `early_stop=yes` 但缺 reason / residual_risks | 22 退回 10 |
| `HG-AUDIT-R1` pending | 30 拒开工 |
| PR 已开但 meta 无图谱关账 | 不得 `done/` |

---

## 4. 思考轮次（改码前 · 默认 R0 + R1–R5）

> **10 帽义务**：预置 **五槽思考轮**（C1–C3 实证）；见 [`docs/harness/prompts/10-requirements.md`](../../harness/prompts/10-requirements.md) OSS 阶段 C 节。  
> **回填**：[`docs/harness/FRAGMENT_rethink_backfill_task_v1_zh.md`](../harness/FRAGMENT_rethink_backfill_task_v1_zh.md) — Agent **必须**写回 §4，禁止仅聊天输出。

### 思考轮控制（Agent 填 · 22 审）

| 字段 | 值 |
|------|-----|
| **actual_last_round** | `R5` / `R3` / …（最后实质完成轮） |
| **early_stop** | `no` / `yes` |
| **early_stop_reason** | （`early_stop=yes` **必填**） |
| **residual_risks** | `none` 或逐条（**必填**；未增轮风险须写清） |

### R0 · 读 task / Issue / graph_delta

**回填区：**

```text
（待填）
```

### R1 · 代码事实

**回填区：**

```text
（待填）
```

### R2 · 方案对比

**回填区：**

```text
（待填）
```

### R3 · 边界 / 测试

**回填区：**

```text
（待填）
```

### R4 · 测试与 PR 策略

**回填区：**

```text
（待填）
```

### R5 · 图谱增量 + 关账判断

**回填区：**

```text
（待填）
```

### R6+ · 扩展轮（仅当 Agent 增轮时追加）

**扩展理由：**

```text
（无则删除本节）
```

**回填区：**

```text
（待填）
```

---

## 5. 验收标准

- [ ] §4 思考轮闭合 · **思考轮控制** 已填 · 22 思考审查通过
- [ ] `HG-AUDIT-R1` → `approved`
- [ ] 测试 / lint 通过
- [ ] 上游 PR · `Fixes #<issue>`
- [ ] invoke 落盘
- [ ] **图谱**（触模块时必勾）：30 前 skeleton · 关账 partial + `02_version`

---

## 6. 验证命令

```bash
cd <worktree_root>
git checkout main && git fetch upstream && git reset --hard upstream/main
git checkout -b feature/fix-<issue>-<short>
# 项目测试命令
git diff upstream/main --name-only
```

---

## 实现备忘（30 后回填）

| 项 | 状态 |
|----|------|
| 图谱 | ⏳ |
| 测试 | ⏳ |
| 上游 PR | ⏳ |
