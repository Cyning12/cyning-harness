# invoke · pre-30 GATE_VERIFY 闸扫描 · agent-skills-packaging

> **hat**：30（开工前强制首输出 · FRAGMENT_30_gate_verify）· **日期**：2026-08-06  
> **task**：`docs/tasks/active/task_cyning_harness_agent_skills_packaging_v1.md`

## GATE_VERIFY 闸扫描表

| human_gate_id | status | blocks 30? | 判定 |
|---------------|--------|-----------|------|
| HG-TASK-DRAFT | approved | 否 | ✅ |
| HG-SPEC-SIGNOFF | approved | 否 | ✅（SPEC signed 2026-08-06） |
| HG-AUDIT-R1 | **approved** | 否 | ✅（R1 零阻塞 · 维护者「签收」2026-08-06） |

- 真值来源：task 人工闸表（非聊天声称）· 无「声称 vs 表」冲突
- 结构闸：`task lint` PASS（2026-08-06 · 本 invoke 前复跑见 verify 输出）
- 无 `HG-GRAPH-MODULES` 类 graph 闸（graph_change_layer=none）

**判定：无 blocks 30 的 pending 闸 → 开工。** Open Folder `cyning-harness/` · 分支 `task/agent-skills-packaging` · commit 仅限本 task 路径。

## 30 执行计划（对齐 task 范围 D1–D6 + R1-F1/F2）

1. 先红：`test/skills.test.js` 先行（生成器不存在 → fail）
2. D1 frontmatter × 6 条文（正文不动）→ D2 `lib/skills.js` + CLI 两命令（usage 同步）
3. build → `skills/`（默认 4 帽 · README 由生成器产出 · F2）→ D3 package.json files
4. D4 全量 `npm test`（含 sync 回归）+ `ci/samples/skills-validate.yml.example`（F1）
5. D5 `eval/t1_gate_bypass/` fixture → D6 dogfood 复制 + rethink README 回写 + CHANGELOG 2.23.0
6. 40 自检闭环：真跑验证命令 · 回填 task 自检结论
