# SPEC：lifecycle dry-run 接线 close_*（v1）

> **状态**：`signed`  
> **track**：`feature`  
> **前置**：`@cyning/harness@2.12.1`（invoke hats 硬闸）· dry-run 骨架 `2.10` · to_30 扩面 `2.11`  
> **下游**：30 实现 → 测试 → docs → **2.13.0**  
> **关联**：[`SPEC-lifecycle-guard-expand_v1.md`](./SPEC-lifecycle-guard-expand_v1.md) residual · [`SPEC-invoke-hats-retention-gate_v1.md`](./SPEC-invoke-hats-retention-gate_v1.md)

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `lifecycle-dry-run-close` |
| **test_strategy** | `required` |
| **test_strategy_note** | close 转移各 close_* 守卫 pass/fail/warn；豁免旗；无 --apply |
| **skip_spec_audit** | `true` |

---

## 1. 背景与目标

`lifecycle dry-run` 对 `close` 转移的 `close_*` 仍全部 `unevaluated`，与 `task close` 硬闸脱节。  
**一句话**：`--task` + `close` + `from=done` 时，把 yaml 登记的 close 守卫接到与 `task close` **同语义**的薄 adapter（旁路报告 · 不 mv · 无 `--apply`）。

---

## 2. 范围

| guard id | 语义 | allow |
|----------|------|-------|
| `close_invoke` | invoke hats 集合覆盖（v2.12+） | `--allow-invoke-gap` |
| `close_self_check` | 自检结论已回填 | — |
| `close_acceptance` | 验收勾选 | `--allow-unchecked` |
| `close_slug` | task_slug 与文件名一致 | — |
| `close_status` | 状态 done/completed | — |
| `close_review` | R\<n\> 审查文存在 | `--allow-no-review` |

- 复用 `task-close` 检查逻辑（抽 `evaluateCloseChecks`，禁止复制分叉）
- CLI `lifecycle dry-run` 透传上述 allow 旗
- CHANGELOG **2.13.0** · README / USER_GUIDE / ONBOARDING / docs 索引同步

---

## 3. 非范围

- `--apply` / 写盘 / G7 runner
- 改 `task close` / `verify` 硬闸语义
- N2-C · `to_00` 接线 · `audit --discipline` UI

---

## 4. 验收

- [x] `close` + 齐全 fixture → 全部 close_* 非 `unevaluated` · `unevaluated_count=0` · exit 0
- [x] 仅缺 invoke hats → `close_invoke=fail` · blocked
- [x] `--allow-invoke-gap` → `close_invoke=warn` · 不 block
- [x] 状态非 done → `close_status=fail`
- [x] 无 `--task`：仍 unevaluated
- [x] `npm test` 全绿 · README 版本表与 CLI 说明已更新

> **实现**：`@cyning/harness@2.13.0` · `evaluateCloseChecks` + lifecycle adapters。
