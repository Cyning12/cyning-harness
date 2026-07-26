# cyning-harness · 文档索引

| 项 | 内容 |
| --- | --- |
| **入口** | 本页 → **[方法论总指引](./methodology/README.md)** |
| **接入** | [**USER_GUIDE v1.0**](./USER_GUIDE_v1.0_zh.md)（§6.0 invoke 留档 · lifecycle）· [`ONBOARDING.md`](./ONBOARDING.md) · [`../wizard/README.md`](../wizard/README.md) |
| **架构** | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| **变更** | [`../CHANGELOG.md`](../CHANGELOG.md) · 当前包 **2.13.0** |

---

## 快速导航

| 读者 | 先读 |
| --- | --- |
| **新接入** | **USER_GUIDE v1.0** → ONBOARDING → [`methodology/execution/P0_V0.2_GAP.md`](./methodology/execution/P0_V0.2_GAP.md) |
| **实现 / 扩展** | [`methodology/product/DESIGN_ONTOLOGY_v1_zh.md`](./methodology/product/DESIGN_ONTOLOGY_v1_zh.md) · [`spec/`](./spec/)（闸 SPEC） |
| **战略 / 开源** | [`methodology/pointers/`](./methodology/pointers/README.md) → 工作区 STRATEGY_* |
| **HGM 远期** | [`methodology/graph/`](./methodology/graph/README.md) · 愿景 [`ROADMAP_TO_AGENT_GOVERNANCE.md`](./ROADMAP_TO_AGENT_GOVERNANCE.md) |

### 近期产品说明（2.12–2.13）

| 主题 | 文档 |
|------|------|
| 多帽 invoke 留档硬闸 | USER_GUIDE §6.0 · [`SPEC-invoke-hats-retention-gate_v1.md`](./spec/SPEC-invoke-hats-retention-gate_v1.md) |
| dry-run 接线 close | [`SPEC-lifecycle-dry-run-close_v1.md`](./spec/SPEC-lifecycle-dry-run-close_v1.md) · ONBOARDING §2.2 |

---

## 目录结构

```text
docs/
├── README.md                 # 本页
├── ARCHITECTURE.md           # 五轨 · 与业务仓关系
├── ONBOARDING.md             # 接入指南
├── USER_GUIDE_v1.0_zh.md     # 陌生人手册
├── spec/                     # 产品闸 SPEC（signed）
├── DESIGN_ONTOLOGY_v1_zh.md  # POINTER → methodology/product/
├── P0_V0.2_GAP.md            # POINTER → methodology/execution/
├── HARNESS_GRAPH_MODEL_*.md  # POINTER → methodology/graph/
└── methodology/              # ★ 方法论与本体 · 总指引
    ├── README.md · ROADMAP_v1_zh.md · DOCUMENT_MAP_v1_zh.md
    ├── product/ · graph/ · execution/ · pointers/
    └── prompts/              # Agent 写作 / 讨论 Prompt
```

**修订**：2026-07-26 · 对齐 2.12–2.13 · 索引 SPEC
