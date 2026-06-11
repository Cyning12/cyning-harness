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
| HG-TASK-DRAFT | pending | 22-R1, 30 | task + 图谱 skeleton（若触模块） |
| HG-AUDIT-R1 | pending | 30 | 思考落盘 + skeleton commit 后人签 |

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
| 未完成思考轮即 30 | 30 拒开工 |
| PR 已开但 meta 无图谱关账 | 不得 `done/` |

---

## 4. 思考轮次（改码前）

> **回填**：[`docs/harness/FRAGMENT_rethink_backfill_task_v1_zh.md`](../harness/FRAGMENT_rethink_backfill_task_v1_zh.md) — Agent **必须**写回 §4，禁止仅聊天输出。

### R0 · 读 task

**回填区：** `（待填）`

### R1 · 代码事实

**回填区：** `（待填）`

### R2 · 方案对比

**回填区：** `（待填）`

### R3 · 边界 / 测试

**回填区：** `（待填）`

（可选 R4/R5 · 见 invoke PROMPT）

---

## 5. 验收标准

- [ ] §4 已回填 · `HG-AUDIT-R1` approved
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
