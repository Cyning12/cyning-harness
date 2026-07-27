# SPEC：多帽 invoke 留档硬闸（可配置）（v1）

> **状态**：`signed`  
> **track**：`feature`  
> **关联图谱**：无（纯 Harness 工具链）  
> **下游**：30 实现 → 40 → close  

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `invoke-hats-retention-gate` |
| **test_strategy** | `required` |
| **test_strategy_note** | close/lint/verify 集合校验与 profile 展开须可失败测试驱动 |
| **skip_spec_audit** | `true` |

---

## 1. 背景与目标

close 检查 1 仅要求 `by-task/<slug>/` ≥1 个 `.md`，业务仓理性只交 30。  
目标：按 task 元信息 `required_invoke_hats` / `invoke_retention_profile` 做**集合覆盖**硬闸；默认 `10,30,40`；40 允许与 30 合并文件名。

## 2. 范围

- `lib/task-meta.js`：profile 预置、解析、文件名 hat 扫描、缺口计算
- `lib/task-close.js`：检查 1 升级；`--allow-invoke-gap`
- `lib/task-lint.js`：缺字段 WARN
- `lib/verify.js`：缺口 WARN（不挡 30）
- lifecycle / discipline / 模板 / CHANGELOG · **v2.12.0**

## 3. 非范围

- 强制 CLOSE invoke 文件（关账= close 命令）
- 默认要求 20 invoke（reviews 已硬闸）
- 同步 Ink 全套 TEMPLATE-*-invoke.md
- 历史 done invoke 补录

## 4. 验收标准

- [x] 无字段 → 默认要求 `10,30,40`；仅有 30 → CLOSE BLOCKED
- [x] `invoke_retention_profile: minimal` → 仅需 30
- [x] `required_invoke_hats` 优先于 profile
- [x] `invoke_*_30_40_*.md` 同时满足 30 与 40
- [x] `--allow-invoke-gap` 豁免并留痕
- [x] verify --task 对缺口 WARN、不挡 may_start_30
- [x] `npm test` 全绿

> **复检**（2026-07-26 · cyning-harness `task/invoke-hats-retention-gate`）：`npm test` **187/187** 绿；行为与上表一致。非阻塞备注见对话复检报告。

## 5. 预置

| profile | hats |
|---------|------|
| default | 10,30,40 |
| minimal | 30 |
| full | 00,10,20,30,40,CLOSE |

---

## 6. 修订 / 后继

| 版本 | 日期 | 说明 |
|------|------|------|
| v1 | （原） | close 硬 · verify WARN 不挡 `may_start_30` |
| v1+ | 2026-07-27 | **后继**：[`SPEC-verify-pre30-invoke-hats-gate_v1.md`](./SPEC-verify-pre30-invoke-hats-gate_v1.md) 拟将 **pre-30**（required∩{10,20,00}）升为 verify 硬闸；本文件 §4「verify 仅 WARN」条在 2.14 落地后由 Amend 覆盖行为说明，历史验收勾选保留为 v2.12 当时真值 |
