# SPEC · 过程可观测 · status / timeline（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `signed` · `HG-SPEC-OBS` **approved**（2026-07-27 · 维护者会话） |
| **日期** | 2026-07-27 |
| **产品仓** | `cyning-harness` |
| **Epic** | 工作区 [`docs/harness/guides/EPIC_cyning_harness_process_observability_v1_zh.md`](../../../docs/harness/guides/EPIC_cyning_harness_process_observability_v1_zh.md) |
| **非目标** | 替代 `verify` 硬闸 · Neo4j · IDE 实时 wire 入库 |
| **实现** | Open Folder `cyning-harness/` · 建议分支 `task/cyning-harness-obs-status-cli` · **P0 起由本仓 Agent 开工** |

---

## 1. 问题

过程资产（task / gate / invoke / review / HGM events）已落盘，但缺少：

1. **一屏回答**：这个 task 现在能不能进 30？卡在哪？
2. **时间线回答**：这个 task 经历了哪些帽/闸/审查？

---

## 2. 命令

### 2.1 `harness status`

```bash
npx @cyning/harness status --target <repo> [--task <path>] [--json] [--check]
```

| 行为 | 说明 |
|------|------|
| 无 `--task` | 列出 `active` 下各 task 一行摘要（slug · status · blocking_gate · may_start_30） |
| 有 `--task` | 单 task 详表（见 §3） |
| `--json` | 机读；字段稳定后 semver 约束 |
| `--check` | （P2）缺关键 invoke/review 时 exit≠0；P0 可先 stub 或仅 WARN |

**退出码（建议）**：

| code | 含义 |
|------|------|
| 0 | 成功输出（`--check` 时表示检查通过） |
| 1 | 用法/IO 错误 |
| 2 | `--check` 未通过（P2） |

### 2.2 `harness timeline`（P1）

```bash
npx @cyning/harness timeline --target <repo> --task <path> [--json] [--limit N]
```

按时间升序打印与该 task 相关的过程事件（来自 HGM snapshot；若无则尝试 `ingest` 或提示先 ingest）。

---

## 3. `status --task` 人类输出（最低字段）

```text
task: <slug>
path: <rel>
status: <from task meta or inferred>
gates:
  - <id>=<pending|approved|…>  blocks=<hats>
may_start_30: true|false
blockers: <short list or —>
last_invoke: <path or —>  hat=<id>
reviews: R1=<yes|no>  CLOSE=<yes|no>  …
verify_preview: PASS|BLOCK  reason=<one line>   # 复用 verify 判定，只读预览
hgm: events=<n>|unknown  last_at=<iso|—>
kpi_section: present|absent
next_hint: <one line>
```

**纪律**：`verify_preview` **不得**写成「已代替跑 verify」；文档写明 30 前仍须正式 `verify`。

---

## 4. JSON 骨架（P0 稳定子集）

```json
{
  "schema_version": "obs_status.v1",
  "task_slug": "",
  "task_path": "",
  "status": "",
  "gates": [{ "id": "", "status": "", "blocks_hats": "" }],
  "may_start_30": false,
  "blockers": [],
  "last_invoke": { "path": null, "hat_id": null },
  "reviews": { "R1": false, "CLOSE": false },
  "verify_preview": { "ok": false, "reason": "" },
  "hgm": { "event_count": null, "last_at": null },
  "kpi_section": false,
  "next_hint": ""
}
```

新增字段只能加、不改名删语义（遵循产品 semver）。

---

## 5. timeline 事件行（P1）

每行至少：`occurred_at` · `type` · `subject` · `summary`  
类型对齐 HGM event schema（TaskStatusChanged / Gate* / Review* / Invoke* / GateCheckRun 等已有子集）。

无 snapshot：exit 0 + WARN「无 HGM 数据」或自动 ingest（实现时二选一写死，推荐：**WARN + 提示命令**，避免 status 偷偷写盘；timeline 可提供 `--ingest` 显式开关）。

---

## 6. 验收

### P0

- [ ] CLI 注册 `status`
- [ ] 金样仓或 fixture：`--task` 输出含 §3 字段
- [ ] `--json` 可被 `JSON.parse`
- [ ] 单测覆盖：缺 task / pending 闸 / 有 invoke
- [ ] USER_GUIDE 一节

### P1

- [ ] CLI 注册 `timeline`
- [ ] 有事件 fixture 时序正确
- [ ] 无事件行为符合 §5

### P2

- [ ] hook 或 docs 样例调用 `graph ingest`
- [ ] 可选 `status --check` 语义入库

---

## 7. 修订

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-07-27 | 首稿 draft |
