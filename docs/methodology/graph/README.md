# graph · PIP（过程实例投影；Process Instance Projection）

> **对外名**：PIP（过程实例投影）。对内历史文件名可含 `HGM` / `hgm_*`（路径兼容，正文不用曾称括注）。

> **Track G · G1 / v2.0+**：PIP（过程实例投影）本地 JSONL + `graph ingest|snapshot|axioms` **已实现**；Neo4j / 远端同步仍提案 · 详见 [`../ROADMAP_v1_zh.md`](../ROADMAP_v1_zh.md) §2.0 · §2.2。

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| **[`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md)** | proposal · **v2.0+** | **真值稿** · 节点/边/事件 · CLI 路线 |
| [`HGM_UPGRADE_OUTLINE_v1_zh.md`](./HGM_UPGRADE_OUTLINE_v1_zh.md) | outline | G0 讨论入口 · 依赖链 |
| [`PROMPT_ontology_inventory_scan_G0_v1_zh.md`](./PROMPT_ontology_inventory_scan_G0_v1_zh.md) | active · **v1.3** | G0 本体扫描 · P3 软门槛 · legacy 盘点 · inventory/ 落盘 |
| [`HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md`](./HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md) | archive | 对话参考 · **非真值** |

```text
PIP（过程实例投影） = 结构化对象 + 显式带类型的边 + 不可变事件历史 + 可推理的公理
```

**勿混淆**：

| 名称 | 含义 |
| --- | --- |
| **GraphTrack** | `docs/_tech_graph/` · Inform 架构地图 |
| **gate-check --graph** | Inform 模块依赖图（Q3 · v1.0） |
| **PIP（过程实例投影）** | Process 实例图 · Task / Gate / Review 时序 |

**依赖**：[`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) v1.2
