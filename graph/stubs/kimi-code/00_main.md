# 顶层流程总图（kimi-code · 人类友好版）

> **版本**：2026-06-10 · 阶段 B bootstrap  
> **双轨**：[`00_main.ai.md`](./00_main.ai.md) · 协议 [`99_mermaid_protocol.md`](./99_mermaid_protocol.md)

## 主干（Happy Path · CLI Agent）

```mermaid
flowchart TD
    U[用户终端] --> CLI[kimi CLI / TUI<br/>apps/kimi-code]
    CLI --> SDK[@moonshot-ai/kimi-code-sdk<br/>packages/node-sdk]
    SDK --> AC[agent-core<br/>Agent / Session / tools]
    AC --> KS[kosong · LLM 调用]
    AC --> KA[kaos · shell / 文件]
    AC --> TOOLS[skills · MCP · subagents]

    CLI --> FLOW_CLI[CLI 会话主循环]
    FLOW_CLI --> FLOW_DOC[> 10_flow_cli_session.md]

    AC --> TELEM[telemetry]
    AC --> AUTH[oauth]
```

## 待补 flow 清单（分步增量 · 非 bootstrap 一次画完）

| flow 文件 | 状态 | 建议阶段 | 说明 |
|-----------|------|----------|------|
| `10_flow_cli_session.md` | **骨架** | B-可选 / C | CLI 启动 → 会话 → 工具循环（见该文件占位） |
| `10_flow_agent_turn.md` | 待补 | **阶段 C** | 单轮推理：prompt → tools → 响应 |
| `10_flow_mcp_tool.md` | 待补 | C | MCP 配置与调用链 |
| `10_flow_subagent.md` | 待补 | C | coder / explore / plan 子 agent |

**分步规则**：改 `agent_core` 开 `10_flow_agent_turn`；改 MCP 开 `10_flow_mcp_tool`；每张 flow 随 **业务 task** 或 **图谱子 task** 增量维护。

## 关联

- 模块表：[`01_struct.md`](./01_struct.md)
- 上游代码地图：[`AGENTS.md`](../../AGENTS.md)
