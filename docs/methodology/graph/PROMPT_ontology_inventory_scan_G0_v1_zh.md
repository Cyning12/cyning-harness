# Prompt · 项目本体构成扫描 · HGM G0（v1.1）

| 项 | 内容 |
| --- | --- |
| **状态** | `active` · G0 讨论素材 · **须满足执行前提 P1–P5** |
| **用途** | 扫描产品仓或试点仓 · 产出 **本体清单报告**（不修改 DESIGN_ONTOLOGY） |
| **触发时机** | [`HGM_UPGRADE_OUTLINE_v1_zh.md`](./HGM_UPGRADE_OUTLINE_v1_zh.md) **G0** · YAML P2 全量迁移完成 · **HG-TASK-DRAFT** 签收 |
| **关联 task** | `task_ontology_inventory_scan_v1`（扫描任务单 · 待建）· [`task_cyning_harness_g1_hgm_v2_v1.md`](../../../../docs/harness/tasks/active/task_cyning_harness_g1_hgm_v2_v1.md)（HGM G1） |
| **语义真值（执行时必读）** | [`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) · [`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md) |
| **预期产出** | [`inventory/ONTOLOGY_INVENTORY_cyning_harness_v1.yaml`](./inventory/ONTOLOGY_INVENTORY_cyning_harness_v1.yaml)（主）· `inventory/ONTOLOGY_INVENTORY_ai_ink_brain_v1.yaml`（试点参考） |
| **Open Folder** | **`cyning-harness/`** 或 **`ai-ink-brain-api-python/`** · **禁止**工作区根全量扫描 |

---

## 执行 Prompt（v1.1 · 整合修正）

```text
# 任务：扫描当前项目，生成“项目本体构成报告”

## ⚠️ 执行前提（硬性检查，不满足则终止）

在开始扫描之前，**必须先确认以下条件全部满足**。任一条件不满足，输出提示信息并终止执行。

### 前置条件清单

preconditions:
  # 1. 仓库范围确认
  - id: "P1"
    check: "当前所在目录是 cyning-harness/ 或 ai-ink-brain-api-python/"
    fail_msg: "请在产品仓（cyning-harness/）或试点仓（ai-ink-brain-api-python/）下执行此扫描。工作区根不执行全量扫描。"

  # 2. YAML P0 试点已完成（试点仓专用）
  - id: "P2"
    check: "docs/_tech_graph/src/00_main.graph.yaml 存在且非空"
    fail_msg: "后端 YAML P0 试点未完成，请先完成 00_main 迁移再执行本体扫描。"
    note: "试点仓执行时检查；产品仓跳过 P2"

  # 3. .ai.md 已全部迁移（P2 完成）
  - id: "P3"
    check: "find . -name '*.ai.md' 2>/dev/null | wc -l | xargs test 0 -eq"
    fail_msg: "项目中仍存在 .ai.md 文件，请先完成 YAML 全量迁移（P2）后再执行扫描。"
    note: "试点仓执行时检查；产品仓跳过 P3"

  # 4. 维护者审批
  - id: "P4"
    check: "HG-TASK-DRAFT 已签收（本次扫描任务 task_ontology_inventory_scan_v1）"
    fail_msg: "请先获得维护者签收 HG-TASK-DRAFT 后再执行。"

  # 5. 扫描目的声明
  - id: "P5"
    note: "本次扫描仅为 G0 讨论提供素材，不代替 HGM G1 开发规格，不修改 DESIGN_ONTOLOGY。"

### 扫描范围规则

- 若在 **cyning-harness/** 下执行 → 输出 **产品仓主报告**
- 若在 **ai-ink-brain-api-python/** 下执行 → 输出 **试点仓辅助报告**
- 若在其他目录 → **终止**并提示

两份报告各自独立；**产品仓报告为「主报告」**，试点仓报告为「验证参考」。

---

## 角色设定

你是一位精通**本体论（Ontology）**、**图论（Graph Theory）**和**知识工程**的架构分析师。你的任务是扫描给定的代码仓库/文档目录，识别其中隐含的「本体结构」，并按标准化格式输出报告。

## 本体定义（给你判断用的标准）

在软件工程中，**本体（Ontology）** = 对某一领域内的**概念（类）、属性、关系、公理（约束）** 的显式、形式化规范说明。

你需要区分：
- **元本体（Meta-Ontology）**：定义「如何定义本体」的顶层框架
- **子本体（Sub-Ontology）**：针对特定领域的具体概念模型（如 Task/Hat/Gate；Node/Edge/Anchor）

## 判断标准：什么是「本体文件」？

清单内文件 **默认** 为本体载体；若某文件不在清单中但符合以下 **≥2 条**，可追加到报告 `gaps` 或 `additional_files`：
1. 定义 **类/实体**
2. 定义 **关系**
3. 定义 **约束/公理**
4. 作为 **唯一真相源**
5. 在 **CI 或工具链** 中用于校验/生成

## 四原语分类框架（T/K/H/B）

| 原语 | 全称 | 判断标准 | 示例 |
|---|---|---|---|
| **T** | Topic | 分类节点 · 抽象概念 · 领域名称 | RAG、Track、Hat |
| **K** | Keyword | 检索/验证锚点 · 阈值 · 约束 | payload_min_keys、test_strategy=required |
| **H** | History | 时序节点 · 状态变更 · 执行轨迹 | InvokeSnapshot、AuditReview、Git commit |
| **B** | Business | 终端业务实体/产物 | Task 实例、documents 表、npm 包 |

## 四原语定位说明（重要）

T/K/H/B 四原语**仅作为本次扫描报告的「分类标签」（Lens）**，用于标记扫描到的本体元素属于哪种原语类型。

**它们不写入 HGM Schema、不修改 DESIGN_ONTOLOGY、不作为 HGM 节点类型。** HGM 节点类型保持项目现有命名：
Task, Hat, HumanGate, InformArtifact, AuditReview, InvokeSnapshot, FailureReport

**映射规则**（报告中 `primitives_used` 字段使用此表）：

| 原语 | 映射到项目中的 | 示例 |
|---|---|---|
| **T (Topic)** | Track, Hat, Epic, OrchestratorHat | 概念分类、领域名称 |
| **K (Keyword)** | _contract_manifest 中 payload_min_keys/allowed_events；embedding；RAG_MATCH_THRESHOLD | 检索锚点、约束阈值 |
| **H (History)** | trace.json, InvokeSnapshot, AuditReview, Git commit, .version/ 索引 | 时序节点、状态变更 |
| **B (Business)** | Task 实例, User, Project, documents/code_chunks 表, npm 包 | 终端业务实体/产物 |

**报告中不出现「T/K/H/B 是 HGM 节点类型」的表述。**

---

## 你需要执行的具体步骤

### 第1步：扫描固定文件清单（不使用通配符）

**不要**使用 `*.ontology.yaml` 等模糊匹配。仅扫描以下清单中的文件（若不存在则跳过并记入 gaps）。

#### 产品仓 cyning-harness/ 清单

product_manifest:
  - path: "docs/methodology/STRATEGY_ONTOLOGY_cyning_harness_v1_zh.md"
    role: "战略本体"
  - path: "docs/methodology/product/DESIGN_ONTOLOGY_v1_zh.md"
    role: "产品设计本体（主）"
  - path: "docs/methodology/product/PRODUCT_ONTOLOGY_v1.1.md"
    role: "产品设计本体（v1.1，若存在）"
  - path: "docs/methodology/graph/HGM_UPGRADE_OUTLINE_v1_zh.md"
    role: "HGM 升级大纲（G0）"
  - path: "docs/methodology/graph/HARNESS_GRAPH_MODEL_design_v0_zh.md"
    role: "HGM 设计稿（v0）"
  - path: "docs/methodology/ROADMAP_v1_zh.md"
    role: "路线图"
  - path: "harness/meta/ontology.yaml"
    role: "机器可读本体（v0.4+ 规划，若存在）"

#### 试点仓 ai-ink-brain-api-python/ 清单

pilot_manifest:
  - path: "docs/_tech_graph/src/00_main.graph.yaml"
    role: "图源 YAML（P0 试点）"
  - path: "docs/_tech_graph/src/*.graph.yaml"
    role: "图源 YAML（其他流程）· 展开 glob 后逐文件扫描"
  - path: "docs/_tech_graph/_manifest.json"
    role: "端点/表/env 索引本体"
  - path: "docs/_tech_graph/_contract_manifest.json"
    role: "契约/公理本体"
  - path: "docs/_tech_graph/99_spec.md"
    role: "治理/规约本体"
  - path: "docs/_tech_graph/01_struct.md"
    role: "数据结构本体"
  - path: "docs/_tech_graph/graph.json"
    role: "物化图（由 YAML 生成，非手写）"

#### 工作区共有（仅引用，不重复扫描）

- Projects/docs/harness/guides/POST_V1_0_SEQUENCE_v1_zh.md（上下文引用）
- Projects/docs/harness/tasks/active/*.md（**仅** Task 模板结构，不扫描实例全文）

输出：每个已扫描文件的路径 + role + 是否存在。

### 第2步：对每个本体文件，提取其核心内容

对每个文件，回答：
- 定义了哪些 **类/实体**？
- 定义了哪些 **关系**（类型与方向）？
- 定义了哪些 **约束/公理**（摘录）？
- **primitives_used**（T/K/H/B 标签 · 仅 Lens）

### 第3步：识别子本体（对齐 Track 命名）

子本体分组**必须**使用以下 Track 名称，避免三「图」混淆：

| 子本体 ID | 名称 | 职责 | 典型文件 |
|---|---|---|---|
| PROCESS_TRACK | 过程本体 | Task/Hat/Gate/Review | DESIGN_ONTOLOGY §1–§5 |
| GRAPH_TRACK | 图源本体 | YAML 源 → graph.json | src/*.graph.yaml、graph.json |
| WIKI_TRACK | 知识库本体 | coding_wiki 叙事 | coding_wiki/syntheses/*.md |
| STANDARDS_TRACK | 约束本体 | 编码规范、L2 | standards/、.cursor/rules/ |
| VERIFY_TRACK | 验证本体 | CI、测试样本 | .github/workflows/、ci/samples/ |
| IDE_TRACK | IDE 适配本体 | IDE 片段、marker | ide/adapters/、CLAUDE.md |
| GOVERNANCE_TRACK | 治理本体 | CI 校验、漂移、规约 | 99_spec.md、_contract_manifest.json |

若某子本体无对应项，可新增并标注「新增 Track · 待维护者确认」。

### 第4步：分析关系——元路径（`*b` 模式）

扫描是否隐含元路径（T→K→B、T→H→B、H→T→B 等），并指出在哪些文件/流程中被隐式使用。
**注明**：元路径为分析 Lens，**非** HGM 边类型（HGM 边见 design v0 §1.2）。

### 第5步：Epic 映射（对齐 Harness 术语）

项目定义：**Epic 是 Task 的特化子类**（DESIGN_ONTOLOGY §1.4），**不**单独升格为一等类（v1）。

报告中须含：

epic_task_mapping:
  definition: "EpicTask 是 Task 的特化子类"
  evidence: "DESIGN_ONTOLOGY_v1_zh.md §1.4"
  fields:
    - depends_on: "string[] — 子 Task slug 列表"
    - completion_policy: "must_complete_all | any_completes"
  related_gate: "HG-EPIC-ROADMAP（Epic CLOSE 专用闸门）"
  note: "Epic 不直接执行 30，通过子 Task 状态聚合判断完成"

### 第6步：输出「项目本体构成报告」

YAML 结构（字段名须保留）：

  project: "<cyning-harness | ai-ink-brain-api-python>"
  scan_date: "<YYYY-MM-DD>"
  report_role: "<primary | pilot_reference>"

  meta_ontology:
    - 是否隐式定义顶层原语 Lens（T/K/H/B）？在哪些文档？
    - 是否有显式元路径约定？
    - 是否有全局公理约束所有子本体？

  sub_ontologies:
    - id: "<PROCESS_TRACK | ...>"
      name: "<Track 名称>"
      files: ["..."]
      primitives_used: ["T", "K"]
      core_classes: ["..."]
      key_relations: ["..."]
      key_axioms: ["..."]

  epic_task_mapping: { ... 见第5步 ... }

  graph_summary:
    primitive_lens_used: ["T", "K", "H", "B"]
    hgm_node_labels: ["Task", "Hat", ...]  # 来自 DESIGN_ONTOLOGY · 非 T/K/H/B
    meta_paths_observed: ["tkb", "htb"]
    missing_meta_paths: ["..."]

  gaps:
    - "..."

### 与 harness ontology-check 的关系

| 维度 | 本次扫描 | harness ontology-check（v0.4+ 规划） |
|---|---|---|
| 目的 | 发现本体文件、分组、原语 Lens | 验证 DESIGN_ONTOLOGY 与 ontology.yaml 一致性 |
| 输出 | 盘点报告 YAML | PASS/FAIL + 差异列表 |
| 时机 | G0 讨论前执行一次 | CI / 产品变更时 |
| 关系 | **串联**：先扫描了解现状，再校验一致性。**扫描不替代校验。** |

### 输出要求

- **报告格式**：YAML
- **落盘路径**（根据执行目录）：
  - 产品仓：cyning-harness/docs/methodology/graph/inventory/ONTOLOGY_INVENTORY_cyning_harness_v1.yaml
  - 试点仓：cyning-harness/docs/methodology/graph/inventory/ONTOLOGY_INVENTORY_ai_ink_brain_v1.yaml
    （试点仓执行时仍写入产品仓 inventory/ · 若无法跨仓写入则落盘对话并提示维护者手动拷贝）
- **提交策略**：报告仅作 G0 讨论附件，**不强制提交 Git**。维护者审阅后可删除或仅保留摘要。
- **若目录不存在**：mkdir -p docs/methodology/graph/inventory/ 后写入。

---

## 整合执行流程

1. 检查执行前提 P1–P5 → 任一失败则终止并输出 fail_msg
2. 确定当前目录 → 产品仓 or 试点仓
3. 读取固定文件清单 → 逐个解析
4. 标注原语类型 T/K/H/B（仅 Lens）
5. 按 Track 命名分组 → sub_ontologies
6. 输出 epic_task_mapping
7. 生成报告 → 落盘到 inventory/ 指定路径
8. 提示维护者：「扫描完成，请审阅报告后决定是否提交 Git」

---

## 重要约束

- 不要编造；不存在则写「未发现」
- 必须打开文件阅读内容，不只靠文件名
- 冲突处标记「冲突点」
- 优先使用项目内部术语（Hat、InvokeSnapshot 等）
- **禁止**修改 DESIGN_ONTOLOGY 或任何真值文件

开始执行
满足 P1–P5 后，按上述流程扫描并生成报告。无法判断的文件列入 gaps 并标注「待确认」。
```

---

## 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | 2026-06-16 | 初版落盘 |
| v1.1 | 2026-06-16 | 整合修正：P1–P5 前提 · T/K/H/B Lens · 固定清单 · Track 分组 · epic_task_mapping · inventory 落盘 · ontology-check 关系 |
