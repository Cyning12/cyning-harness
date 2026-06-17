# SDD-Compliance micro-bench · v1

> **标题**：SDD-Compliance · **非** Agent Score / pass@1 类模型 benchmark。  
> **范围**：S1–S5 · 公理 D2/D3/S2/rejected→draft 可机械检查部分 · 不覆盖 D5 与 Terminal-Bench。  
> **状态**：v1.1 · G1.1 · 5/5 期望合规率 **100%**。

---

## 这个 bench 测什么？

| 问 | 答 |
| --- | --- |
| **测什么** | `gate-check.sh` 与 `harness-sync.sh` 是否符合 SDD 公理（合成夹具） |
| **不测什么** | LLM 会不会写代码 · 业务测试绿不绿 · 真实项目胜率 |
| **100 是什么** | 合规率 % = PASS 场景 ÷ 总场景 × 100；5/5 全过即 **100** |
| **和 B2 关系** | B2 Part A 是真实试点 retro；bench 是可机械复现的 **机制回归** |

---

## 运行

```bash
# 产品包根 · 维护者人工验收（推荐 · 含逐项解释）
cd /path/to/cyning-harness
./wizard/compliance-bench.sh --all
```

```bash
# CI / Epic 关账勾选 · stdout 仅数字 · 说明在 stderr
./wizard/compliance-bench.sh --quiet --all
# stdout: 100
# stderr: 摘要表 + 「100 表示何意」
```

单场景：

```bash
./wizard/compliance-bench.sh S1 S3
```

---

## Scenario 详解

| ID | 场景 | 公理 | 夹具 | 期望 | 通过说明 |
| --- | --- | --- | --- | --- | --- |
| **S1** | R1 pending 即 30 | D2 · D3 | `S1_r1_pending/` | `gate-check` exit≠0 | 未签审核不得开 30 |
| **S2** | R1 approved 无 review | D2/D3 | `S2_r1_no_review/` | 无 `*_audit_R1_*` 文件 | 只改 task 表不算真审核 |
| **S3** | R1 approved + review | D2/D3 | `S3_r1_with_review/` | exit=0 且 review 存在 | 审核闭环 Happy Path |
| **S4** | sync 域边界 | S2 | `S4_sync_domain/` + 临时仓 | plan 无 `docs/tasks/`、`reviews/` | upgrade 不覆盖用户 task |
| **S5** | rejected→draft | rejected→draft | `S5_rejected_draft/` | gate rejected + task status=draft | 否决后须回 draft（与 HGM axioms 同语义） |

---

## 输出示例（`--all`）

```text
[S1] R1 未签 · 30 应被拒
  公理    D2 HumanGate · D3 30 前置闸
  ...
  结果    ✅ PASS · gate-check exit=1
  说明    未审核任务不得进入 30 执行编码 · 人闸有效

摘要 · SDD-Compliance bench
场景   结果     详情
S1     ✅ PASS  gate-check exit=1 · 30 被拒
...
合规率  5/5 = 100%

解读    100 = 全部 5 个场景行为符合 SDD 公理
        不是 LLM 解题分数 · 不可外推为「AI 胜率」
```

---

## 修订

| 日期 | 说明 |
| --- | --- |
| 2026-06-17 | G1.1：新增 S5 rejected→draft · 5/5 合规率 |
| 2026-06-16 | 丰富脚本输出 · 公理/夹具/解读 · quiet 摘要走 stderr |
