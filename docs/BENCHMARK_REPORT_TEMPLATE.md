# cyning-harness 项目开发收益基准报告（模板）

> **用途**：产品稳定后，用真实数据替换占位符，快速生成有说服力的验证报告。  
> **状态**：`draft` · 待实验填充  
> **关联**：Epic #8 B2+bench · ROADMAP v1.0 README 量化段落 · `profiles/benchmark-profile.json`（待建）

| 项目 | 内容 |
| --- | --- |
| **报告版本** | v1.0 |
| **日期** | YYYY-MM-DD |
| **测试执行者** | [你的姓名 / 社区团队] |
| **产品版本** | cyning-harness vX.Y.Z |
| **实验类型** | 对照项目（with vs without harness） |

---

## 1. 实验目标

验证 cyning-harness 纪律包在真实项目开发中是否能够：

- 提升任务交付效率
- 提高代码质量与合规性
- 增强过程可追溯性
- 减少协作摩擦

---

## 2. 实验设计

### 2.1 演示项目

| 项 | 内容 |
| --- | --- |
| **项目名称** | [例如：todo-api-cli] |
| **项目规模** | 预估 5–10 个任务（功能点/修复） |
| **技术栈** | [例如：Node.js + TypeScript + PostgreSQL] |
| **开发方式** | 单人/模拟团队（AI 助手 + 人工审查） |

### 2.2 对照分组

| 组别 | 配置 | 说明 |
| --- | --- | --- |
| **对照组** | 无 Harness | 裸 AI 助手（如 Kimi Code / Copilot）+ 手动流程 |
| **实验组** | 有 Harness | 使用 cyning-harness，preset = [fullstack-node-py / harness-only]，并按项目需求定制 AdoptedProfile |

### 2.3 测量指标

| 类别 | 指标 | 测量方式 |
| --- | --- | --- |
| **效率** | 平均任务完成耗时 | 从任务创建到 PR merge 的时间 |
| **质量** | 代码审查一次性通过率 | 审查中无需修改直接合并的比例 |
| **合规性** | 关键闸门遵守率 | 任务是否按要求执行 test_strategy、graph-modules 等 |
| **可追溯性** | 审计覆盖率 | 任务关联 AuditReview / InvokeSnapshot 的比例 |
| **协作摩擦** | 沟通澄清次数 | 每个任务在聊天/评论中询问规则的平均次数 |

---

## 3. 实验结果（占位符）

> **说明**：以下数据为示例格式，请替换为实际测量值。

### 3.1 效率对比

| 任务 ID | 对照组耗时 (h) | 实验组耗时 (h) | 变化 |
| --- | --- | --- | --- |
| T1 | 3.2 | 2.8 | -12.5% |
| T2 | 5.0 | 4.1 | -18.0% |
| … | … | … | … |
| **平均** | X.X | Y.Y | ±XX% |

### 3.2 质量对比

| 指标 | 对照组 | 实验组 | 变化 |
| --- | --- | --- | --- |
| 代码审查一次性通过率 | XX% | YY% | +ZZ% |
| 缺陷密度（Bug/千行） | X.X | Y.Y | -ZZ% |
| 单元测试覆盖率 | XX% | YY% | +ZZ% |

### 3.3 合规性与可追溯性

| 指标 | 对照组 | 实验组 |
| --- | --- | --- |
| 关键闸门遵守率 | XX% | YY% |
| 任务 → AuditReview 关联率 | XX% | YY% |
| 任务 → InvokeSnapshot 关联率 | XX% | YY% |

### 3.4 协作摩擦

| 指标 | 对照组 | 实验组 |
| --- | --- | --- |
| 每任务平均澄清次数 | X.X | Y.Y |

---

## 4. 结论

- **效率**：Harness 通过标准化流程（ProcessTrack + StarterHat）减少了不必要的等待和返工，任务耗时降低了约 XX%。
- **质量**：强制 `test_strategy=required` 和 HumanGate 审批，使代码缺陷密度下降 XX%，审查通过率提升 XX%。
- **合规与追溯**：所有关键闸门均有记录，任务与审计产物的关联率达到 100%，极大方便事后复盘。
- **协作**：明确的规则和帽子链减少了沟通成本，每任务澄清次数从 X.X 降至 Y.Y。

**总体**：cyning-harness 能够在不改变底层 AI 模型的前提下，显著提升项目开发的可靠性、规范性与效率。

---

## 5. 展望：从项目纪律到 Agent 治理

当前 Harness 约束的是人类 + AI 的协作流程。未来当 AI Agent 具备更强自主性时，同一套本体（Task、Gate、AuditReview、InvokeSnapshot）可直接被 Agent 用作自检与审计接口，实现可信任的自主执行。cyning-harness 为这一演进提供了基础语义层和工程框架。

---

## 6. 附录

| 项 | 路径 |
| --- | --- |
| 实验详细数据（原始日志、任务清单） | `/benchmarks/data/`（待建） |
| 复现步骤 | `/benchmarks/REPRODUCE.md`（待建） |
| 使用的 Harness 配置文件 | `profiles/benchmark-profile.json`（待建） |

---

## 模板使用建议

1. 将本文件作为母版保留于 `docs/BENCHMARK_REPORT_TEMPLATE.md`。
2. 完成实验后，复制一份命名为 `docs/BENCHMARK_REPORT_vX.X.md`，填入真实数据。
3. 可配合图表（Mermaid 或截屏）增强可读性。
4. v1.0 stable push 前，将结论摘要写入根 `README.md`（ROADMAP A4 · B2 量化段落）。

---

## 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | YYYY-MM-DD | 初版草稿 · 占位符待实验填充 |
