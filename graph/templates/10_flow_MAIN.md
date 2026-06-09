# 主路径 Flow 示例（人类友好版）

> **用途**：`docs/_tech_graph/10_flow_MAIN.md` — **至少 1 条**主业务流（新仓 / S0 必做）。  
> **双轨**：须与 [`10_flow_MAIN.ai.md`](./10_flow_MAIN.ai.md) 语义等价。  
> **嵌入后**：将占位路径替换为真实 handler / 路由 / 页面流。

```mermaid
flowchart TD
    %% Entry: 例 GET/POST /api/v1/resource — 替换为真实入口

    %% === 请求阶段 ===
    IN[HTTP 请求] --> AUTH[鉴权 / 会话校验]
    AUTH --> VAL[参数校验<br/>schema / DTO]
    VAL --> SVC[业务服务层<br/>例：ResourceService]

    %% === 数据阶段 ===
    SVC --> REPO[仓储 / ORM<br/>例：ResourceRepository]
    REPO --> DB[(数据库 / 存储)]

    REPO -->|无记录| NOTFOUND[404 / 空结果]
    SVC -->|业务规则失败| BIZERR[4xx 业务错误]

    %% === 响应阶段 ===
    SVC --> RESP[组装响应 DTO]
    RESP --> OUT[返回 JSON / 页面]

    %% === 可观测（可选）===
    OUT --> LOG[结构化日志 / trace]

    %% 样式
    classDef request fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef domain fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    classDef data fill:#fff8e1,stroke:#ff6f00,stroke-width:1px

    class IN,AUTH,VAL request
    class SVC,RESP,OUT domain
    class REPO,DB,LOG data
```

## 与顶层图关系

- 在 [`00_main.md`](./00_main.md) 中由 `M1` 或等价节点 **加载** 本文件。
- 模块归属见 [`01_struct.md`](./01_struct.md) 中 `api` / `core` 等行。

## 增量维护

改 BFF / API 契约时：**同 task** 更新本 flow 或另开图谱子 task；Harness 关账 ≠ 图谱关账。
