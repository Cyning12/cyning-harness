# invoke · 00 起草 task + 10-task 思考轮回填 · agent-skills-packaging

> **hat**：00 → 10-task（SPEC→task 同会话 · task 草稿已由 00 创建 · 符合 10-spec 条文分界例外）  
> **日期**：2026-08-06 · **产出**：`docs/tasks/active/task_cyning_harness_agent_skills_packaging_v1.md`（task lint PASS）

## 输入

- SPEC `docs/spec/SPEC-agent-skills-packaging_v1.md`（signed 2026-08-06 · 对话「签收」）
- rethink 03/04/05 · task lint 机械约束（E1–E7 / G4）

## 过程摘要（≤10 行）

1. SPEC 状态 draft → signed，修订记录追加签收行（commit `见 git log`）
2. 00 起草 task：元信息 / 人工闸三行（HG-AUDIT-R1 **pending**）/ 范围 D1–D6 对照 SPEC §2 / 非范围逐字继承 / failure_paths 含脏树纪律行
3. 10-task R0–R5 同会话回填；新增 4 个实现层决策（js-yaml 复用 / 全量重写 / 挂既有 CI / dogfood 直接复制）
4. 机械校验：`node bin/harness.js task lint --file <task>` → **LINT: PASS**
5. 30 开工前置未满足（HG-AUDIT-R1 pending）→ 本棒止步于 20-task-audit 之前

## 下一棒

**20-task-audit R1** 书面审 → **HG-AUDIT-R1（人签）** → 30（Open Folder `cyning-harness/` · 分支 `task/agent-skills-packaging` · commit 仅限本 task 路径）
