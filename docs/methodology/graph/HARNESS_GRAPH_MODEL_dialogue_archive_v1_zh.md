# Harness Graph Model · 对话归档（参考稿）

| 项 | 内容 |
| --- | --- |
| **状态** | `archive` · **非真值** |
| **版本** | v1.0 |
| **日期** | 2026-06-15 |
| **性质** | 外部对话整理 · 保留思辨脉络 · **须对照** [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md) |
| **真值** | [`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) v1.2 |

> **说明**：本文件未在起草时读取本地仓库，对话中的类名、版本号、路径、已实现能力 **可能不准确**。  
> 实施与对外引用 **以设计真值稿 + 产品设计本体为准**；本文仅作「为什么要有 HGM」的思想来源归档。

---

## 0. 提炼结论（核心保留）

### 0.1 一句话定义（对话共识 · 已采纳为 HGM 标语）

```text
Harness Graph Model (HGM)
  = OOP 的结构化对象
  + 显式带类型的边
  + 不可变事件历史
  + 可推理的公理
```

### 0.2 与 OOP / 图论 / 本体的关系（对话脉络）

| 层次 | 对话观点 | 本地校正（见真值稿） |
| --- | --- | --- |
| **OOP** | 擅长行为与执行；对象关系常隐式（引用、方法） | wizard 脚本、sync、gate-check 仍用命令式实现 |
| **本体** | 类 / 关系 / 公理 · 开放世界 · 可一致性检查 | 已落盘 `DESIGN_ONTOLOGY` v1.2 · 未来 `ontology.yaml` |
| **图论** | 关系升格为 **边** · 可遍历、可查询 | HGM 是 **过程轨实例图** · 非 `GraphTrack` 架构图 |
| **+ History** | 节点/边上的演化 · 事件溯源 · 模式与预测 | 优先 **append-only 事件** · 图是投影而非替代 Git/Markdown 真值 |

### 0.3 命名选择

对话曾提议 TOG、EDKG 等通用名；**采纳项目内命名**：

- **Harness Graph Model（HGM）** — AI Coding 纪律包专用，不声称通用知识图谱框架。

---

## 1. 对话一：本体论 ≈ OOP？

**问**：本体论在编程上跟面向对象差不多？

**答（摘要）**：

- **像的一半**：都用「类 + 关系」建模（Task、Hat、HumanGate 等）。
- **不像的一半**：
  - OOP → 可运行系统、封闭世界、方法调用。
  - 本体 → 领域知识共享、公理（D1–D7）、开放世界、推理与一致性检查。
- **Harness 实践**：实现可用 TS/bash；**语义真值**保持 `DESIGN_ONTOLOGY` + `ontology.yaml`，代码与本体双向对齐。
- **一句话**：OOP 是「如何构建软件」；本体是「领域里概念到底是什么」。

**本地校正**：

- 对话中 `PRODUCT_ONTOLOGY.md` → 真值为 **`DESIGN_ONTOLOGY_v1_zh.md`**。
- 公理编号为 **P/S/D** 系列，非仅 D1–D7。

---

## 2. 对话二：OOP 的「升级」？

**问**：能否视为 OOP 的一种升华/升级？

**答（摘要）**：

- 可理解为在 **语义与推理** 维度上的延伸，而非替换 OOP。
- 升级点：封装 → **全局公理**；方法调用 → **推理**；硬编码关系 → **可发现关系**；封闭 → **开放世界**。
- **不替换 OOP 的原因**：执行效率、I/O、状态变更仍要命令式代码。
- **融合**：本体描述知识 · OOP 实现行为 · 公理 → 测试/断言/`gate-check`。

**对外标签（对话原话 · 可引用于博客）**：

> 本体论可以看作 OOP 在知识工程时代的自然演进——它继承了「类-对象」框架，但增加了显式的逻辑公理、开放世界假设和自动推理能力。如果说 OOP 是构造软件的「结构化蓝图」，本体论就是构造知识的「逻辑化网络」。

---

## 3. 对话三：图论 + History

**问**：实体加关系像图；点里存 History → 可推论关系与演变、推演未来？

**答（摘要）**：

1. **关系第一等公民**：Task --hasGate--> HumanGate --blocks--> Hat 等应可遍历（非仅 Markdown 内嵌）。
2. **History**：Task.status 变迁、Gate approved/rejected、Review 轮次 → **事件溯源**。
3. **与「成长型 Agent」**：历史模式 → 风险预测、路径推荐（对话中 GrowingReasoningAgent · **本地尚未实现**）。
4. **落地三件套**：图存储 + 元数据自动采集 + 查询 CLI（`harness graph query` 等 · **远期**）。

**本地校正**：

- 勿与 **`GraphTrack` / `docs/_tech_graph/`** 混淆：后者是 **Inform 架构地图**，HGM 是 **Process 运行时实例图**。
- 已有 **`gate-check --graph`（Q3）** 指模块依赖图可视化，**不是** HGM 全文。
- 对话中的 `User` / `Project` / `assignedTo` **不在** v1.2 本体核心类中；维护者身份在 Gate 表与 git 作者中隐式出现。

---

## 4. 对话四：HGM 设计草案（对话内嵌稿 · 参考）

对话末尾附有一份 **未读本地真值** 的 `HGM_DESIGN v0.1` 草案，要点：

| 块 | 内容 |
| --- | --- |
| 动机 | 关系隐式、无时间轴、难做模式分析 |
| 概念 | Node / Edge / Event / Property / Time |
| 存储 | SQLite → Neo4j 渐进 |
| CLI | `graph query` · `timeline` · `analyze` · `predict` |
| 采集 | install · task · gate-check · 22/30 产出 |
| 路线 | v2.0+ 分阶段（**v1.0 关账后**） |

**已知偏差（相对本地 v1.2）**：

| 对话稿 | 本地真值 |
| --- | --- |
| PRODUCT_ONTOLOGY v1.1 | **DESIGN_ONTOLOGY v1.2** |
| FailureReport 已模板化 | **v0.3 backlog** |
| ontology.yaml 已有 | **v0.4+ 抽取** |
| Neo4j v2.2 默认 | **真值稿优先 JSONL + 可选 SQLite 投影** |
| GrowingReasoningAgent 衔接 | **未立项 · C 轨后置** |

**完整工程化草案** → [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md)（同目录真值稿）。

---

## 5. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-15 | 对话归档 + 核心公式 + 本地校正表 |
