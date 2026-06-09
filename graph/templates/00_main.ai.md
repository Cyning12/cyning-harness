```mermaid
flowchart TD
  %% version: YYYY-MM-DD — AI 协议版 · 须与 00_main.md 语义等价
  %% 拓扑：见 99_mermaid_protocol.md

  %% === 入口阶段 ===
  Q[[用户 / 客户端请求]] --"->"--> E{"应用入口"}
  // → src/main.py#L1 或 app/router/index.ts#L1（替换为真实锚点）

  %% === 主业务分支 ===
  E --"主路径 A"--> M1[[核心业务处理]]
  // → 例：handlers/resource.py::handle_create
  E --"主路径 B"--> M2[[次要路径]]
  // → 例：handlers/health.py::health_check
  E --"管理/批处理"--> ADM[[Admin / Job]]
  // → 例：jobs/ingest.py::run_sync

  %% === 子流程折叠 ===
  M1 --"::triggers"--> FLOW_MAIN[[主路径子流程]]
  FLOW_MAIN --"加载"--> FLOW_DOC[>10_flow_MAIN.md]

  M1 --"->"--> DB[(持久化)]
  // → 例：db/repository.py 或 ORM 层
  ADM --"->"--> DB

  %% === 按需加载（可选）===
  E --"加载"--> STRUCT_DOC[>01_struct.md]
```
