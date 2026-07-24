---
name: rethink-mechanization-rate-readme
description: 索引与背景 · 2026-07 机械化率审计思考系列 · 何时读：想了解本系列全貌/回溯思考过程
---

# 机械化率审计 · 思考系列索引（2026-07）

> **简介**：本目录记录 cyning-harness「如何改进」的一次完整战略思考 —— 从 invoke 留档失守的根因出发，提出「机械化率」框架，盘点包内全部规范语句的强制状态，产出缺口清单与改进方向。**性质：思考留档（rethink），非 SPEC、非 task**；后续若立项，按 10-spec → 00 起草 task 链走正式流程。

## 背景（30 秒版）

- 2026-07-20：ops-desk-api 连续 4 任务 30 漏落 invoke → 根因 = 纯 Prompt 层纪律零机械闸
- 2026-07-22：v2.2.0/2.2.1 补上 `task close` / `task lint-done` 机械闸（dogfood 自身关账）
- 2026-07-24：追问「还有多少条这样的纪律？」→ 启动机械化率审计（本系列）

## 文档地图

| 文档 | 内容 | 读它当你想… |
|---|---|---|
| [01_big_directions.md](01_big_directions.md) | 大方向判断：机械化率框架 + 四个改进方向 + 排序 | 理解「为什么是机械化率」 |
| [02_discipline_inventory.md](02_discipline_inventory.md) | 逐文件逐条盘点 harness/prompts/ 规范语句 × 强制状态 | 查某条纪律有没有机械闸 |
| [03_coverage_matrix.md](03_coverage_matrix.md) | 覆盖率统计 + 缺口聚类 + 候选闸优先级 | 看全貌数字与下一步做什么 |
| [04_next_steps.md](04_next_steps.md) | 结论：缺口 → SPEC/task 候选 · 与状态机/Agent 契约的接口 | 立项前评审 |

## 过程记录（回溯用）

| 日期 | 动作 | 产出 |
|---|---|---|
| 2026-07-24 | 大方向讨论（会话） | 01 |
| 2026-07-24 | 读包内 prompts 全部 5 帽 + 2 FRAGMENT + TEMPLATE_invoke；映射 M1–M10 机制 | 02 |
| 2026-07-24 | 矩阵聚合 + 缺口聚类 | 03 |
| 2026-07-24 | 结论与立项建议 | 04 |
| 2026-07-24 | **第一波落地**：G1+G3（task 部分）→ `task lint` v2.3.0（03 已勾 ✅）；dogfood 数据：17 个 active task 中 15 个存在真实结构缺口 | 03 更新 |
| 2026-07-24 | **第二波落地**：G2 → verify/close reviews 闸 v2.5.0（03 已勾 ✅ · **P0 队列清零**）；期间帽定义 V2 拆分收编（v2.4.0） | 03 更新 |

**机制编号约定**（02/03 引用）：M1 gate-check.sh · M2 verify · M3 audit · M4 task check · M5 task close · M6 task lint-done · M7 graph yaml · M8 graph HGM · M9 harness-sync · M10 package-scripts

**范围声明**：盘点对象为 **npm 包分发的 Starter 子集**（`harness/prompts/`）。工作区 Extended 帽（00/10-spec/20-spec/50/handoff）不在本轮，方法可复用。
