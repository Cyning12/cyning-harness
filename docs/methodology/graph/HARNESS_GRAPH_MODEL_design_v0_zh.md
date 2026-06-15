# Harness Graph Model (HGM) · 设计草案 v0


| 项        | 内容                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **状态**   | `proposal` · 远期架构（**v0.5+**）                                                                                                     |
| **版本**   | v0.1                                                                                                                             |
| **日期**   | 2026-06-15                                                                                                                       |
| **范围**   | 过程轨 **实例** 的显式图 + 事件历史 + 公理可查询                                                                                                   |
| **非范围**  | 替代 Git/Markdown 真值 · 替代 LLM Runtime · `**GraphTrack` 架构图**（见 §0.3）                                                               |
| **依赖**   | [`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) v1.2 · P0 金样路径已建（ACCEPTANCE 待绿）· v0.3 `ontology.yaml`（未实现）· v1.0 `gate-check --graph`（Inform · 未实现） |
| **思想来源** | [`HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md`](./HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md) |


---

## 0. 定义与边界

### 0.1 一句话

```text
Harness Graph Model (HGM)
  = OOP 的结构化对象（本体 Class 的实例）
  + 显式带类型的边（ObjectProperty · HatRef · 基数）
  + 不可变事件历史（append-only · 可重放投影）
  + 可推理的公理（P/S/D · 图查询或 gate-check 机械检查）
```

HGM 是 **本体论在工程中的可落地形态之一**：不引入 OWL 推理机也可先做 **「文件真值 → 事件 → 图投影 → 公理查询」**。

### 0.2 与现有三层的关系

```text
语义层    DESIGN_ONTOLOGY v1.2 + ontology.yaml（类 · 关系 · 公理）
文件层    docs/tasks · reviews · invokes · gate-check.log（当前真值 · S2 保护）
图+事件层 HGM（可选增强 · v0.5+）— 从文件层 **推导** · 不反向覆盖文件层
```

### 0.3 易混概念


| 名称                                | 是什么                                               | 不是什么                    |
| --------------------------------- | ------------------------------------------------- | ----------------------- |
| **GraphTrack**                    | `docs/_tech_graph/` · Inform 架构地图                 | HGM                     |
| **gate-check --graph**（Q3 · v1.0） | InformArtifact 模块依赖图 · D4-a                       | HGM 全文                  |
| **HGM**                           | Task / Hat / Gate / Review / Sync 等 **过程实例** 的时序图 | 代码 AST 图 · 通用 Neo4j 业务库 |


### 0.4 设计原则


| #   | 原则        | 含义                                         |
| --- | --------- | ------------------------------------------ |
| H1  | **无侵入**   | 未启用 HGM 时，工作流与今日纯文件模式 **完全一致**             |
| H2  | **文件优先**  | S2 保护域只追加事件，**不**用图 DB 覆盖 task/reviews     |
| H3  | **事件不可变** | 修正 = 新事件 · 禁止删改历史                          |
| H4  | **公理同源**  | 图约束与 `DESIGN_ONTOLOGY` §5 公理 ID 一一对应       |
| H5  | **渐进存储**  | v0.5 JSONL → v0.6 SQLite 投影 → v0.8+ 可选外部图库 |


---

## 1. 本体 → 图模式映射（对齐 v1.2）

### 1.1 节点标签（Node labels）


| 标签                   | 本体类            | 稳定 ID 规则                           | 主要属性来源                               |
| -------------------- | -------------- | ---------------------------------- | ------------------------------------ |
| `BusinessRepository` | 嵌入仓根           | `repo:{absolute_or_slug}`          | `.cyning-harness/profile.json`       |
| `Task`               | Task           | `task:{task_slug}`                 | `docs/tasks/active/*.md`             |
| `HumanGate`          | HumanGate      | `gate:{task_slug}:{human_gate_id}` | task 闸表                              |
| `Hat`                | Hat            | `hat:{hat_id}`                     | `docs/harness/prompts/` 文件名 / hat_id |
| `AuditReview`        | AuditReview    | `review:{path_hash}`               | `docs/harness/reviews/`*             |
| `InvokeSnapshot`     | InvokeSnapshot | `invoke:{path}`                    | `docs/harness/invokes/*`             |
| `FailureReport`      | FailureReport  | `failure:{path}`                   | reviews 或 task 附录 · v0.3+            |
| `GateCheckRun`       | GateCheckRun   | `gcr:{iso8601}:{task_slug}`        | `.cyning-harness/gate-check.log`     |
| `SyncOperation`      | SyncOperation  | `sync:{iso8601}:plan|apply`        | wizard 日志 · v0.5+                    |
| `InformArtifact`     | InformArtifact | `inform:{repo_rel_path}`           | `_tech_graph/*` 等                    |


**刻意不在 v0.1 HGM 建模为一等节点**：`User` / `Project`（对话稿遗留）· 维护者以事件 `actor: maintainer` 字符串出现即可。

### 1.2 边类型（Edge types）


| 边             | 源 → 靶                              | 本体关系                           | 边属性示例              |
| ------------- | ---------------------------------- | ------------------------------ | ------------------ |
| `HAS_GATE`    | Task → HumanGate                   | Task --hasGate-->              | `since`            |
| `BLOCKS`      | HumanGate → Hat                    | HumanGate --blocks-->          | `hat_id`           |
| `GOVERNED_BY` | Task → Hat                         | Task --governedBy-->           | SDD 阶段             |
| `PRODUCED`    | Task → AuditReview                 | Hat --mayProduce-->（经 Task 关联） | `round: R1|CLOSE`  |
| `PRODUCED`    | Task → InvokeSnapshot              | 同上                             | `hat_id`           |
| `FAILED_WITH` | Task → FailureReport               | Hat --mayProduce-->            | `at`               |
| `DEPENDS_ON`  | Task → Task                        | Task --dependsOn-->            | 无环 · §1.4          |
| `DECOMPOSES`  | Epic → Task                        | Epic --decomposesInto-->       | Epic 仍为 Task 特化    |
| `MUST_READ`   | Task → InformArtifact              | Task --mustRead-->             | 改码门禁               |
| `CHECKED`     | GateCheckRun → Task                | GateCheckRun 运行时               | `exit_code`        |
| `SYNCED`      | SyncOperation → BusinessRepository | SyncOperation                  | `mode` · `version` |


### 1.3 事件类型（Event · append-only）

存储默认：`.cyning-harness/events/YYYY-MM.jsonl`（v0.5 提案）

```json
{
  "event_id": "evt:20260615T103000Z:001",
  "type": "TaskStatusChanged",
  "occurred_at": "2026-06-15T10:30:00Z",
  "actor": "maintainer|gate-check|sync|agent:30",
  "subject": "task:demo_p0_golden",
  "data": {
    "old_status": "in_progress",
    "new_status": "failed",
    "artifact": "docs/harness/reviews/task_demo_30_failure_*.md"
  },
  "source": "file_watch|gate-check.sh|manual"
}
```


| event.type                          | 触发源（现有/近端）                                       |
| ----------------------------------- | ------------------------------------------------ |
| `TaskCreated` / `TaskStatusChanged` | task md 变更 · git commit hook（可选）                 |
| `GateStatusChanged`                 | task 闸表 · `approved` / `rejected` / `pending`    |
| `AuditReviewProduced`               | 新文件 `docs/harness/reviews/*`                     |
| `InvokeSnapshotCreated`             | 新 invoke 文件                                      |
| `FailureReportProduced`             | 30 失败落盘 · v0.3+                                  |
| `GateCheckRunCompleted`             | `gate-check.sh` 结束                               |
| `SyncOperationCompleted`            | `harness-sync.sh` plan/apply                     |
| `HumanGateRejected`                 | status→rejected · **强制** draft + 退回 10 · §4.2 本体 |


**投影规则**：读事件流 **materialize** 当前图快照 → `.cyning-harness/graph/snapshot.json`（可缓存 · 可删 rebuild）。

---

## 2. 公理 → 可执行检查（HGM 视角）


| 公理              | 图/事件表述                                                           | 现有机械检查             | HGM v0.5             |
| --------------- | ---------------------------------------------------------------- | ------------------ | -------------------- |
| **D2**          | pending 的 `HG-AUDIT-R1` --BLOCKS--> 30 帽                         | gate-check exit 2  | 查询 + 事件告警            |
| **D3**          | 30 首动作须关联 `GateCheckRun`                                         | 30 prompt 模板       | 缺 `CHECKED` 边 → 违规   |
| **D4-a**        | `HG-GRAPH-MODULES` approved 才允许 30                               | gate-check         | 联结 InformArtifact 子图 |
| **S2**          | 无 `SyncOperation` 事件改写 Task/Review 路径                            | harness-sync 实现    | 事件审计：apply 不得含 S2 路径 |
| **rejected→10** | `GateStatusChanged(rejected)` → 下一事件须 `TaskStatusChanged(draft)` | v0.3 gate-check 警告 | 时序约束                 |


示例查询（**Cypher 风格伪码** · 非 v0.5 承诺语法）：

```cypher
// 违反 D2：R1 pending 但存在 30 执行事件
MATCH (t:Task)-[:HAS_GATE]->(g:HumanGate {id:'HG-AUDIT-R1', status:'pending'})
MATCH (e:Event {type:'HatExecutionStarted', subject:t.id, hat_id:'30-execute'})
RETURN t, e
```

---

## 3. 采集与 CLI（分阶段）

### 3.1 采集点（对齐已有 wizard）


| 动作                      | 已有落点           | HGM 事件                                    |
| ----------------------- | -------------- | ----------------------------------------- |
| install / adopt         | profile.json   | `RepositoryAdopted`                       |
| harness-sync plan/apply | stdout         | `SyncOperationCompleted`                  |
| gate-check              | gate-check.log | `GateCheckRunCompleted`                   |
| 22 落盘 review            | reviews/ 新文件   | `AuditReviewProduced`                     |
| invoke 新文件              | invokes/       | `InvokeSnapshotCreated`                   |
| task 表改 status / gate   | task md        | `TaskStatusChanged` / `GateStatusChanged` |


**v0.5 最小实现**：`harness graph ingest --from-repo .` 扫描目录 + 解析 gate-check.log **回填**事件（幂等）。

### 3.2 CLI 路线图


| 命令                                     | 版本   | 说明                                 |
| -------------------------------------- | ---- | ---------------------------------- |
| `harness graph ingest`                 | v0.5 | 文件 → 事件 JSONL                      |
| `harness graph snapshot`               | v0.5 | 事件 → snapshot.json                 |
| `harness graph query`                  | v0.6 | 简单过滤器（非完整 Cypher）                  |
| `harness graph timeline --task <slug>` | v0.6 | 单 Task 事件轴                         |
| `harness graph axioms check`           | v0.7 | 跑 D2/D3/S2 图规则                     |
| `harness graph patterns`               | v0.8 | 频繁路径统计（blocked / failed）           |
| `gate-check --graph`                   | v1.0 | **Inform** 模块图 · 与 HGM **并列** · Q3 |


---

## 4. 存储架构（务实）


| 阶段       | 存储                                                       | 适用             |
| -------- | -------------------------------------------------------- | -------------- |
| **v0.5** | `.cyning-harness/events/*.jsonl` + `graph/snapshot.json` | 一人 · 单仓        |
| **v0.6** | + SQLite（nodes/edges/events 表）                           | 本地查询加速         |
| **v0.8** | 可选 Neo4j / 外部导出                                          | 多仓聚合 · **非默认** |


**不采用**「事件与图库强分离到 PostgreSQL+Neo4j」作为 v0.5 默认——与「纪律包轻嵌入」冲突。

---

## 5. 与路线图对齐（修正对话稿）

```text
v0.2  P0 金样路径（ACCEPTANCE 进行中）
v0.3  manifest · npx · FailureReport · gate-check rejected（多数未实现）
v0.4  ontology.yaml · D7 HG-RELEASE · public push
v1.0  ICVO 审计 · invoke_index · gate-check --graph（Inform）
v0.5+ Track G / G1：HGM ingest + snapshot + 基础 axioms check（proposal · 本文件 · v1.0 后启动）
v0.6–v0.8  timeline · patterns · 可选外置图库（proposal）
```

**后置**：GrowingReasoningAgent / 自动 Recommendation 节点 — **未在本仓立项** · 依赖 HGM 事件量积累后再评。

---

## 6. 开放问题


| #   | 问题                          | 暂定                            |
| --- | --------------------------- | ----------------------------- |
| Q1  | ingest 由 git hook 还是手动 CLI？ | v0.5 **手动** + gate-check 钩子可选 |
| Q2  | 是否「时光机」重建任意时点图？             | v0.7+ · 事件重放                  |
| Q3  | HGM 与 Supabase/远端同步？        | **否** · v1.0 后单独评             |
| Q4  | 用户能否删事件？                    | **否** · 仅追加 `CorrectionEvent` |
| Q5  | Epic 升格后图模型变更？              | Epic 变 `Epic` 标签节点 · 随 Q1 本体  |


---

## 7. 文档分层（三件套）


| 文档                                                       | 层级                    |
| -------------------------------------------------------- | --------------------- |
| [`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) | 语义 · 类 / 公理 / 状态机 |
| **本文件 HGM v0**                                           | 物理 · 事件 / 图投影 / CLI   |
| （未来）Growing Agent 设计                                     | 消费 HGM 的推理策略 · **未写** |


---

## 8. 修订记录


| 版本   | 日期         | 说明                                   |
| ---- | ---------- | ------------------------------------ |
| v0.1 | 2026-06-15 | 初稿 · 对齐本体 v1.2 · 校正对话稿偏差 · v0.5 轻量存储 |
| v0.1.1 | 2026-06-15 | §5 路线图与 ROADMAP 对齐 · gate-check --graph → v1.0 · proposal 标注 |


