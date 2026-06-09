```mermaid
flowchart TD
  %% Entry: 例 POST /api/v1/resource — 替换锚点为真实代码
  %% 拓扑协议：见 99_mermaid_protocol.md

  %% === 请求阶段 ===
  IN[[HTTP 请求]] --"->"--> AUTH[[鉴权 / 会话校验]]
  // → middleware/auth.py::require_user 或 src/auth/guard.ts

  AUTH --"[ok]"--> VAL[[参数校验]]
  AUTH --"[err]"--> ERR_AUTH[>Auth Failed]
  // → middleware/auth.py#L42

  VAL --"[ok]"--> SVC[[业务服务层]]
  // → services/resource_service.py::handle
  VAL --"[err]"--> ERR_VAL[>Validation Failed]

  %% === 数据阶段 ===
  SVC --"->"--> REPO[[仓储 / ORM]]
  // → repositories/resource_repo.py::find_by_id

  REPO --"->"--> DB[(数据库 / 存储)]
  // → db/session.py 或 ORM model

  REPO --"?>"--> HIT{record exists?}
  HIT --"[no]"--> NOTFOUND[[404 / 空结果]]
  HIT --"[yes]"--> SVC

  SVC --"[err]"--> BIZERR[[4xx 业务错误]]
  // → services/resource_service.py 业务规则分支

  %% === 响应阶段 ===
  SVC --"->"--> RESP[[组装响应 DTO]]
  RESP --"->"--> OUT[[返回 JSON / 页面]]
  // → handlers/resource.py::to_response

  %% === 归档 ===
  OUT --"::archives"--> LOG[[结构化日志]]
  // → observability/logger.py

  %% === 顶层链接 ===
  IN --"加载"--> MAIN_DOC[>00_main.md]
```
