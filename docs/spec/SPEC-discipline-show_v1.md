# SPEC：discipline show CLI（Post-2.10 Epic E）（v1）

> **状态**：`signed`（维护者签收 2026-07-25 · 对话「签收 A+E」）  
> **track**：`feature`  
> **上游**：Epic [`EPIC_post_210_menu_serial_a_e_j_v1_zh.md`](../../../docs/harness/guides/EPIC_post_210_menu_serial_a_e_j_v1_zh.md) · RETRO 候选 **E** · T3 SPEC [`SPEC-discipline-coverage-yaml_v1.md`](./SPEC-discipline-coverage-yaml_v1.md)（资产已落地 · 本波补发现性）  
> **前置**：`@cyning/harness@2.10.0` · Epic **A CLOSE** 后方可进本棒 30（串行）  
> **下游**：人签 → 00 draft task（可与 A 签收同批起草，**30 仍串行**）→ … → 30  
> **目标版本**：与 A 统一 **`2.11.0`**

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `discipline-show` |
| **invoke_slug** | `cyning-harness-discipline-show` |
| **test_strategy** | `required` |
| **test_strategy_note** | show 人读/JSON · 非法 yaml exit · 与 loadDisciplineCoverage 同源；lifecycle show 回归 |
| **Open Folder（实现）** | `cyning-harness/` |
| **epic_serial** | E（J → A → **本棒**） |

---

## 1. 背景与目标

T3 已落盘 `harness/discipline-coverage.yaml` + schema + `npm test`，但 **无 CLI**，发现性弱（T3 residual）。

**一句话目标**：提供 **`discipline show [--json]`**，镜像 `lifecycle show` 的只读体验，不引入 `audit --discipline` 大 UI。

---

## 2. 范围

### D1 · CLI

- `npx @cyning/harness discipline show [--json]`
- 人读：摘要 `version` · `as_of_package_version` · `scope` · statements 计数按 status · gaps 计数按 status；可选短表（id/status/summary 截断）
- `--json`：输出 `loadDisciplineCoverage` 校验后的数据对象（或稳定包装 `{ ok, data }`——30 选一并写进测试；**推荐直接 dump data** 对齐 lifecycle show）
- 非法 / 缺失 yaml → exit **1**（与 lifecycle 风格一致）

### D2 · 库

- 扩展 `lib/discipline-coverage.js`：`formatDisciplineShow(data)`（或等价）
- 复用既有 `loadDisciplineCoverage` / `validateDisciplineCoverage`；**不**改 schema 必填

### D3 · 文档 / 测试 / 版本

- help / USER_GUIDE / ONBOARDING 挂点；CHANGELOG **2.11.0**
- 单测：包内 yaml show 成功；损坏 fixture exit ≠0

---

## 3. 非范围

- `audit --discipline` 交互视图 / 过滤 UI / HTML  
- 全量人工重盘周 / 改 statements 真值内容（除非 show 发现明显自相矛盾且 A 波已改——默认 **不**改矩阵正文）  
- A 的守卫扩面（不得同未 CLOSE 的 A 抢 PR；本棒 30 在 A CLOSE 后）  
- apply / G7 / N2-C

---

## 4. 验收清单

- [ ] `discipline show` 与 `discipline show --json` 对包内 yaml 成功
- [ ] 人读含 version / as_of / 计数；JSON 可被 `JSON.parse`
- [ ] help 列出 `discipline show`
- [ ] `npm test` 全绿 · lifecycle show 不回归
- [ ] 文档一句说明 SoT 仍为 yaml，show 只读

---

## 5. 思考轮控制表（摘要）

| 字段 | 值 |
| --- | --- |
| `actual_last_round` | R1 |
| `early_stop` | yes |
| `early_stop_reason` | 与 lifecycle show 同构；T3 已预留「下波 mirror」 |
| `residual_risks` | ① 人读表格过长需截断；② 与 audit 子命令命名空间未来冲突——本波用顶级 `discipline`，不做 audit 子命令 |

---

## 8. 下一棒 Prompt（人签后 · A CLOSE 后 30）

```text
【30】cyning-harness-discipline-show · 实现 discipline show [--json]
约束：只读；无 audit UI；A 已 CLOSE；目标进 2.11.0 CHANGELOG
```
