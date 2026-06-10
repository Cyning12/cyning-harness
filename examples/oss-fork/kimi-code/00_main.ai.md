```mermaid
flowchart TD
  %% version: 2026-06-10 · kimi-code monorepo · 须与 00_main.md 语义等价

  U[[用户终端]] --"->"--> CLI[[kimi CLI / TUI]]
  // → apps/kimi-code/src/main.ts

  CLI --"->"--> SDK[[node-sdk]]
  // → packages/node-sdk

  SDK --"->"--> AC[[agent-core]]
  // → packages/agent-core

  AC --"->"--> KS[[kosong]]
  AC --"->"--> KA[[kaos]]
  AC --"::triggers"--> TOOLS[[skills / MCP / subagents]]

  CLI --"::triggers"--> FLOW_CLI[[CLI 会话主循环]]
  FLOW_CLI --"加载"--> FLOW_DOC[>10_flow_cli_session.md]

  AC --"->"--> TELEM[[telemetry]]
  AC --"->"--> AUTH[[oauth]]
```
