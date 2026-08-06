# invoke · 10-spec · agent-skills-packaging（R0–R5 一轮完成）

> **hat**：10-spec · **日期**：2026-08-06 · **产出**：`docs/spec/SPEC-agent-skills-packaging_v1.md`（draft · HG-SPEC-SIGNOFF pending）

## 输入

- 维护者决策：rethink 05 GO →「同意，立项」
- 必读：rethink `docs/rethink/2026-08-skills-upgrade/` 01–05 · `harness/prompts/10-spec-requirements.md` · `Projects/docs/harness/SPEC_TEMPLATE_v1_zh.md` · 体例先例 `docs/spec/SPEC-discipline-coverage-yaml_v1.md`

## 过程摘要（≤10 行）

1. R0 读入 rethink 01–05 + agentskills.io 规范 + Starter 条文实测（27–78 行）+ CLI usage 全景
2. R1 定三场景（跨 client 消费者 / 维护者改条文 / 评测者）
3. R2 六决策点全部沿用 rethink 03/05 裁定，新增一决策：30/40 **默认不进 build**，`--with-execute-hats` 旁路（把 T1 闸编码进构建默认值，替代 05 的「标 experimental 也分发」——更硬）
4. R3 回退预案落 failure_paths（sidecar 元数据备选）
5. R4 test_strategy=required；明确 T1 评测执行**不是**本 SPEC 验收项
6. R5 判可交 00；建议单 task 或 T1/T2 拆法
7. 与 rethink 05 的唯一偏差：05 允许 30/40 带标记进 `skills/` 分发 → 本 SPEC 收紧为默认不含（R2 第三行），理由同 T1「标了 experimental 就敢发」侥幸

## 下一棒

轻量 20-spec-audit 书面审 → **HG-SPEC-SIGNOFF（人签）** → 00 draft task（slug：`cyning-harness-agent-skills-packaging`）
