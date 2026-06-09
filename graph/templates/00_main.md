# 顶层流程总图（人类友好版）

> **用途**：`docs/_tech_graph/00_main.md` — 本仓 **Happy Path** 主干；子流程折叠为 `10_flow_*.md` 链接。  
> **双轨**：须与 [`00_main.ai.md`](./00_main.ai.md) 语义等价；flowchart 改 `.ai.md` 优先，再同步本文件。  
> **协议**：[`99_mermaid_protocol.md`](./99_mermaid_protocol.md)

## 维护说明

1. 替换下方占位节点为你的 **真实入口**（HTTP 路由 / CLI / 事件总线等）。
2. 子图节点 > 7 时折叠为 `[[Phase]]`，链至独立 `10_flow_*.md`。
3. 异常分支可挂侧链；主干保持可读。

```mermaid
flowchart TD
    %% version: YYYY-MM-DD — 替换为首次人签日期

    %% === 入口 ===
    Q[用户 / 客户端请求] --> E{应用入口<br/>例：src/main.py 或 app/router}

    %% === 主业务分支（示例 · 按栈裁剪）===
    E -->|主路径 A| M1[核心业务处理<br/>例：/api/v1/resource]
    E -->|主路径 B| M2[次要路径<br/>例：/health 或 /metrics]
    E -->|管理/批处理| ADM[Admin / Job<br/>例：ingest / sync]

    %% === 子流程折叠 ===
    M1 --> FLOW_MAIN[主路径子流程]
    FLOW_MAIN --> FLOW_DOC[> 10_flow_MAIN.md]

    M1 --> DB[(持久化<br/>例：PostgreSQL / 文件)]
    ADM --> DB

    %% === 样式（可选）===
    classDef start fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef main fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef infra fill:#fff8e1,stroke:#ff6f00,stroke-width:1px

    class Q,E start
    class M1,M2,ADM main
    class FLOW_MAIN,DB infra
```

## 待补 flow 清单（存量 S2+ 可用）

| flow 文件 | 状态 | 说明 |
|-----------|------|------|
| `10_flow_MAIN.md` | 示例已提供 | 主请求路径；嵌入后替换为真实 API/页面流 |
| `10_flow_*.md` | 待增量 | 每 Epic 或跨模块改动时补 1 张 |

## 关联

- 模块边界：[`01_struct.md`](./01_struct.md)（**HG-GRAPH-MODULES** 人签真值）
- 拓扑协议：[`99_mermaid_protocol.md`](./99_mermaid_protocol.md)
