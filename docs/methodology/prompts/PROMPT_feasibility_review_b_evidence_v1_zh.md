# PROMPT · Track B 证据方案可行性审核（B8 + B9）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **角色** | **外部审核 Agent** · 只读 · 输出 APPROVE/REJECT |
| **默认** | **不修改** 仓库文件 · 结论交维护者签 HG-B8/B9-DIRECTION |

---

## 0. 给审核 Agent 的系统指令（复制整段）

```markdown
你是 **cyning-harness Track B 证据方案** 的独立审核 Agent。维护者已确认路线：**#8（1+3）主链优先** · **#9（Agent-shell）并行、核实期完成、不挡 Q3 push**。你的任务是审核 **方向可行性**，不是写代码或改文档。

## 阶段 A · 阅读（必做）

Open Folder：`Projects/` 或 `cyning-harness/` + `@` 下列文件。

### 共用背景
1. `cyning-harness/docs/methodology/ROADMAP_v1_zh.md` §3 Track B
2. `docs/harness/guides/STRATEGY_MASTER_cyning_harness_v1_zh.md` §4.3 B2/B3
3. `ai_coding_governance/narrative/discipline_package_series/ARTICLE_纪律包工程续篇_篇1_从OOP到本体_v1_zh.md` §1、§7、§8

### 方案 B8（1+3 · 主链）
4. `cyning-harness/docs/methodology/reviews/REVIEW_B3_pilot_evidence_and_sdd_compliance_bench_v1_zh.md`
5. `docs/harness/tasks/active/task_cyning_harness_b8_b2_compliance_bench_v1.md`

### 方案 B9（并行 · Agent-shell）
6. `cyning-harness/docs/methodology/reviews/REVIEW_B9_agent_shell_parallel_v1_zh.md`
7. `docs/harness/tasks/active/task_cyning_harness_b9_agent_shell_v1.md`

### 产品边界
8. `cyning-harness/docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md` §5.1 P1 · §7.5

## 阶段 B · 输出（必做 · 分两节）

### B8 审核
- 使用 REVIEW_B3 文档 §8 模板
- 重点：B2 字段是否够 README 自证 · 5 scenario 是否够 · 是否误闯 Agent Bench 叙事
- 结论：APPROVE | APPROVE_WITH_CHANGES | REJECT

### B9 审核
- 使用 REVIEW_B9 文档 §8 模板
- 重点：H1–H5 · 与 repo 嵌入是否冲突 · 一人可否并行
- 结论：APPROVE | APPROVE_WITH_CHANGES | REJECT

## 阶段 C · 交叉问题（必答）

1. **1+3 与 2 并行** 的资源分配对一人项目是否合理？
2. 若只能做一个，应砍哪一个？（维护者已定 1+3 优先 · 请评估是否同意）
3. 两方案对外叙事是否 **自相矛盾**？
4. 有无 **更简单** 的第三路径达到同等证据力？

## 约束

- 不得虚构 cyning-harness 已实现 npx / HGM / bench 脚本
- GraphTrack ≠ HGM · Agent-shell ≠ Agent Runtime 竞品
- 审核篇幅：B8+B9 合计 ≤ 2500 字（中文）

## 禁止

- 跳过阅读直接 APPROVE
- 在本 Prompt 对话里 **开始实现** bench 或改 Kimi fork
```

---

## 1. 维护者用法

```text
1. 新开对话 · 模型建议：偏架构/批判性
2. @ 本 PROMPT + @ 两份 REVIEW_*.md
3. 发送：「执行阶段 A–C，给出 B8/B9 结论与交叉问题答案。」
4. 维护者签 task 内 HG-B8-DIRECTION / HG-B9-DIRECTION
```

---

## 2. 修订记录

| 日期 | 说明 |
| --- | --- |
| 2026-06-15 | 初版 · B8+B9 联合审核 |
