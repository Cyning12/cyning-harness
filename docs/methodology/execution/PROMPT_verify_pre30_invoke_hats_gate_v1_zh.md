# PROMPT · cyning-harness Agent：实现 verify pre-30 invoke 硬闸

| 项 | 内容 |
| --- | --- |
| **Open Folder** | `/Users/cyning/Desktop/Projects/cyning-harness` |
| **分支** | `task/verify-pre30-invoke-hats-gate`（已建；若在 main 请先切此分支） |
| **SPEC** | `docs/spec/SPEC-verify-pre30-invoke-hats-gate_v1.md` |
| **编排 task** | `Projects/docs/harness/tasks/active/task_cyning_harness_verify_pre30_invoke_hats_gate_v1.md` |
| **日期** | 2026-07-27 |

---

## 复制区（整段粘贴到 cyning-harness 会话）

````text
你正在 cyning-harness 产品仓。Open Folder 必须是本仓根。

## 必读（Read，禁止凭记忆）
1. docs/spec/SPEC-verify-pre30-invoke-hats-gate_v1.md
2. docs/spec/SPEC-invoke-hats-retention-gate_v1.md（上游；verify 现为 WARN）
3. lib/verify.js（invoke hats 段）
4. lib/task-meta.js（evaluateInvokeHatsRetention / scanInvokeHats）
5. test/invoke-hats-retention.test.js
6. 对照实现模式：docs/spec/SPEC-reviews-retention-gate_v1.md

编排 task（工作区）：
  /Users/cyning/Desktop/Projects/docs/harness/tasks/active/task_cyning_harness_verify_pre30_invoke_hats_gate_v1.md

## 目标
把 required hats 中的 pre-30 集合（required ∩ {10,20,00}）在 verify --task 升为硬闸：
  缺失 → VERIFY BLOCKED · may_start_30=false
缺 40 不挡 30（仍可 WARN）；minimal（无 preRequired）不挡。
--allow-invoke-gap 豁免并留痕。

禁止：解析自然语言「开工」；改 ops-desk 业务仓。

## 流程
1. 若 HG-SPEC / HG-AUDIT 仍 pending：先补 SPEC 签收或按 task 表执行；未签则只起草不改 lib（以 task 人工闸为准）
2. 实现 + 改测试 + 文档（FRAGMENT_30 · USER_GUIDE §6.0 · CHANGELOG v2.14.0）
3. npm test 全绿
4. 落盘 invoke 10/30/40（或 30_40）；回填自检结论

## 验收
以 SPEC §5 勾选为准。完成后在 task 自检结论写：版本号建议、破坏性说明、给 ops-desk-api upgrade 的一句话指引。
````

---

## 维护者备注

- 本仓（ops-desk-api）**等产品发版 / upgrade 后再**改 FRAGMENT 对齐与 dogfood。  
- 勿在未发版前假设 `npx @cyning/harness@2.14` 已挡缺 10。
