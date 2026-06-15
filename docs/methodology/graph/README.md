# graph · Harness Graph Model (HGM)

> **Track G · G1 / v0.5+**：HGM 为 **v1.0 公理稳定后的可选增强**（proposal · 未实现）· 详见 [`../ROADMAP_v1_zh.md`](../ROADMAP_v1_zh.md) §2.2。

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| **[`HARNESS_GRAPH_MODEL_design_v0_zh.md`](./HARNESS_GRAPH_MODEL_design_v0_zh.md)** | proposal · v0.5+ | **真值稿** · 节点/边/事件 · CLI 路线 |
| [`HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md`](./HARNESS_GRAPH_MODEL_dialogue_archive_v1_zh.md) | archive | 对话参考 · **非真值** |

```text
HGM = 结构化对象 + 显式带类型的边 + 不可变事件历史 + 可推理的公理
```

**勿混淆**：

| 名称 | 含义 |
| --- | --- |
| **GraphTrack** | `docs/_tech_graph/` · Inform 架构地图 |
| **gate-check --graph** | Inform 模块依赖图（Q3 · v1.0） |
| **HGM** | Process 实例图 · Task / Gate / Review 时序 |

**依赖**：[`../product/DESIGN_ONTOLOGY_v1_zh.md`](../product/DESIGN_ONTOLOGY_v1_zh.md) v1.2
