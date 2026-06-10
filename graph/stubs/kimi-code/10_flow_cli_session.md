# Flow：CLI 会话主循环（骨架 · 待增量）

> **状态**：`skeleton` — 阶段 B 占位；细节在 **阶段 C** 或首张触达 `apps/kimi-code` 的 task 中补全。  
> **双轨**：待补 `10_flow_cli_session.ai.md`（与本文语义对齐后再建）。

```mermaid
flowchart TD
    START[进程启动 main] --> PARSE[解析 argv / 配置]
    PARSE --> TUI[TUI 或 ACP 模式]
    TUI --> LOOP{用户输入 / 事件}
    LOOP --> SDK_CALL[经 node-sdk 创建/恢复 Session]
    SDK_CALL --> AGENT[agent-core 处理轮次]
    AGENT --> TOOLS[工具 / 子 agent]
    TOOLS --> LOOP
    LOOP --> EXIT[退出 / 保存 checkpoint]
```

## 待补锚点（阶段 C）

- [ ] `apps/kimi-code/src/main.ts` 入口
- [ ] Session 创建与 resume 路径
- [ ] 与 `packages/agent-core` 边界调用点
