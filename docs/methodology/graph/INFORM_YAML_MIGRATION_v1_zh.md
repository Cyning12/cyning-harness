# Inform-YAML 迁移对照表 · v1.1+

> **范围**：将 Ink 后端 `*.graph.yaml` 试点能力抽象进 `@cyning/harness@1.1+`。  
> **真值来源**：`ai-ink-brain-api-python/docs/_tech_graph/*.graph.yaml`（P0–P1 done）。  
> **产品 schema**：`schema/inform_graph.v3.schema.json`。  

---

## 1. 字段对照

| 试点字段（后端 graph_v2 YAML） | 产品字段（v3 schema） | 变化 | 说明 |
| ---------------------------- | ------------------- | ---- | ---- |
| `graph_id`                   | `graph_id`          | 无   | 图 ID · 与文件名一致 |
| `title`                      | `title`             | 无   | 人类可读标题 |
| `description`                | `description`       | 无   | 用途简述 |
| `version`                    | `version`           | 无   | 编辑源版本 |
| —                            | `schema_version`    | **新增** | 固定 `inform_graph.v3` · 显式声明 |
| —                            | `direction`         | **新增** | Mermaid 方向 · 默认 `TD` |
| `notes`                      | `notes`             | 无   | 字符串或字符串数组 |
| `nodes[].id`                 | `nodes[].id`        | 无   | 节点 ID |
| `nodes[].label`              | `nodes[].label`     | 无   | 显示标签 |
| —                            | `nodes[].kind`      | **新增** | `flow` / `struct` / `external` |
| `edges[].from`               | `edges[].from`      | 无   | 源节点 |
| `edges[].to`                 | `edges[].to`        | 无   | 目标节点 |
| `edges[].mark`               | `edges[].mark`      | 无   | Mermaid 箭头标记 |
| `edges[].label`              | `edges[].label`     | 无   | 语义标签 |
| `edges[].type`               | `edges[].type`      | 无   | 显式边类型 |
| `edges[].anchors`            | `edges[].anchors`   | 无   | 代码锚点 |
| `anchors[].path`             | `anchors[].path`    | 无   | 相对路径 |
| `anchors[].symbol`           | `anchors[].symbol`  | 无   | 符号名 |
| `anchors[].line`             | `anchors[].line`    | 无   | 行号 |

---

## 2. 有漂移须说明

### 2.1 `schema_version` 新增

- **原因**：产品化后须机械区分 YAML 版本，避免后端试点与产品 schema 混用。
- **兼容**：`harness graph yaml compile` 对缺 `schema_version` 的 YAML 发出 warn，但仍尝试编译（graceful）。

### 2.2 `nodes[].kind` 新增

- **原因**：试点 graph_v2 schema 在 `graph.json` 阶段未强制 kind；v3 将其前移到编辑源，便于 Mermaid class 渲染与 HGM `InformArtifact` 子类型推断。
- **兼容**：缺省 `kind` 时编译器按 label 启发式推断形状，与试点 `graph_yaml_compile.py` 行为一致。

### 2.3 `direction` 新增

- **原因**：试点 `00_main.graph.yaml` 未声明方向，编译器默认 `TD`；v3 显式支持 `TD/TB/BT/LR/RL`。
- **兼容**：缺省仍为 `TD`。

---

## 3. 无漂移（保持语义）

- `graph_id` / `title` / `description` / `version` / `notes`
- `nodes[].id` / `nodes[].label`
- `edges[].from` / `edges[].to` / `edges[].mark` / `edges[].label` / `edges[].type`
- `edges[].anchors[].path` / `symbol` / `line`

---

## 4. 产物对照

| 产物 | 试点 | 产品 v1.1+ |
| ---- | ---- | ---------- |
| 人类可读 MD | `scripts/graph_yaml_compile.py` | `harness graph yaml compile` |
| graph.json 切片 | `tools/tech_graph_graph_export.py` + `tech_graph_graph_v2_yaml.py` | `harness graph yaml check`（diff 模式） |
| 校验 schema | `tools/tech_graph_graph_v2_schema.py` | `schema/inform_graph.v3.schema.json` |

---

## 5. 与 HGM G1 接口

- **InformArtifact 节点 ID**：`inform:{repo_rel_path}`，其中 `repo_rel_path` 为业务仓 `docs/_tech_graph/` 下编译产物路径（如 `docs/_tech_graph/00_main.md`）。
- **MUST_READ 边**：Task → InformArtifact，由 task 表 `must_read` 或 `gate-check --graph` 解析。
- **正文来源**：仍来自 YAML/MD 真值 · HGM 只存指针。

---

freeze_id: CYNING-HARNESS-Y1-YAML-INFORM
