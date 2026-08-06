# BMH git workspace vs cyning `worktree_root`（v1）

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **对照源** | BMH `docs/specs/18-git-workspace-provisioning-for-comparable-runs.md` |
| **本方** | task 元信息 `worktree_root` / `git_branch`（[`TASK_TEMPLATE.md`](../../../harness/templates/TASK_TEMPLATE.md)）；工作区并行约定 |

## 1. 问题同构

| | BMH | cyning-harness |
|--|-----|----------------|
| **要防什么** | trial 工作区只有 hooks 配置、不是 `base_ref` checkout → **假可比** | 多 task 并行时同仓互踩、脏树撞 S5、路径写死假 Open Folder |
| **方程** | `isolated checkout @ base_ref + prompt → harness 改码 → validation` | `独立 worktree + git_branch + Open Folder=该根 → 帽链 → verify/close` |

## 2. 机制对照

| 维 | BMH | cyning |
|----|-----|--------|
| 隔离单位 | `.bmh/workspaces/<trial-id>/` 全量 checkout | 开发者自备 git worktree；task 填 `worktree_root` |
| 基线锚 | `benchmark.repo.base_ref` / `golden_ref` | 通常 `main`/任务分支；**无**机械强制 base_ref |
| 谁 provision | Runner 强制（非 dry-run） | **人 / 00**；产品 CLI **不**自动 `git worktree add` |
| 与 sandbox | 可写根必须是 checkout，禁「父仓旁挂空目录」 | S5：sync apply 前工作区干净；overlay 先 commit 再 upgrade |
| 可比性声明 | `comparable` / `limited` / `not_comparable` | 文档纪律；无自动 comparability 字段 |

## 3. 可对齐建议（文档级 · 本波不改码）

| ID | 建议 |
|----|------|
| G-M4-01 | USER_GUIDE / 并行节明示：填了 `worktree_root` 则 Open Folder **必须**对准该路径（对齐 BMH「writable root = checkout」） |
| G-M4-02 | 测评场景（M5）要求记录 `base_commit` / 分支 tip，写入报告 `comparability` 证据 |
| G-M4-03 | **不**在产品包实现 BMH 式自动 provision（越界 Runtime/git 编排） |

## 4. 结论

BMH 把「公平 trial」**机械化**；cyning 把「并行隔离」**约定化**。测评规划应借用 BMH 方程与可比性标签；产品包保持「不代执行 git worktree」。

## 5. 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · M4 |
