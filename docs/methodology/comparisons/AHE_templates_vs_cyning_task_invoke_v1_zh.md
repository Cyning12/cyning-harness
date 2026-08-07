# AHE templates vs cyning task / invoke（v1）

| 项 | 内容 |
|----|------|
| **状态** | `active` |
| **日期** | 2026-07-29 |
| **对照源** | `/Users/cyning/Desktop/awesome-harness-engineering/templates/` |
| **本方真值** | [`harness/templates/TASK_TEMPLATE.md`](../../../harness/templates/TASK_TEMPLATE.md) · invoke · prompts |

## 1. 工件映射

| AHE 模板 | 角色 | cyning 对应 | 重合度 |
|----------|------|-------------|--------|
| `AGENTS.md` | 仓级 Agent 说明书：结构、约定、allowed/restricted、verify 命令 | 产品 `ide/adapters/*.fragment` + 业务仓 `AGENTS.md` marker；条文在 `docs/harness/prompts/` | 中：骨架可对照，本方更厚（闸/帽链 POINTER） |
| `PLAN.md` | 任务规划：里程碑 + **每里程碑 verify 命令**、scope in/out、风险、执行 Notes | `docs/tasks/active/task_*.md`：背景/范围/验收/失败路径 + 元信息表 | **高**：里程碑-verify 句式可补强 task 验收节 |
| `IMPLEMENT.md` | 追加-only 实现日志：决策、相对 PLAN 偏差表 | `docs/harness/invokes/by-task/<slug>/invoke_*.md` + 经验节 | 中高：invoke 偏帽次；缺显式「偏差摘要表」 |
| `HARNESS_CHECKLIST.md` | 上线前审查 + **组件退役表** | 分散：`verify`/`gate-check`、USER_GUIDE、ONBOARDING；**无**统一「可退役」表 | **高缺口**：退役叙事值得吸收 |

## 2. 字段级对照（PLAN ↔ task）

| PLAN.md | cyning task | 缺口？ |
|---------|-------------|--------|
| Task / Context / Approach | 背景与目标 · 范围 | 无 |
| Milestones + `verify: <cmd>` | 验收标准 `- [ ]`；`test_strategy` | **建议**：验收项鼓励写「verify 命令」一行 |
| Scope in/out | 范围 / 非范围 | 无 |
| Risks | 失败路径 | 本方更偏失败路径表 |
| Notes（执行期） | 修订记录 · 经验总结 | 无 |
| — | `human_gate` · `wiki_delta` · `required_invoke_hats` · `worktree_root` | AHE **无**；本方独有，保留 |

## 3. 缺口清单（是否升模板）

| ID | 建议 | 优先级 | 说明 |
|----|------|--------|------|
| G-M2-01 | `TASK_TEMPLATE` 验收节加「推荐：`verify: <命令>`」示例一行 | P1 | 对齐 PLAN 里程碑闸，不另起 PLAN.md 文件体系 |
| G-M2-02 | invoke 模板或 40 自检加「相对 task 的偏差」可选小节 | P2 | 对齐 IMPLEMENT 偏差表，勿强制双文件 |
| G-M2-03 | 新增人读 `CHECKLIST_harness_retireability` 或并入 ICVO 审计附录 | P1 | 见 M6；含「何时可拆该组件」 |
| G-M2-04 | **不**引入仓根第二套 `PLAN.md`/`IMPLEMENT.md` 为默认 | — | 避免与 task/invoke 双真值 |

## 4. 结论

AHE 模板是**薄脚手架形状**；cyning 已是**帽链+闸+元信息**。升级路径 = **补强字段与清单**，不是替换任务体系。

## 5. 修订

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 00 统筹 · M2 |
