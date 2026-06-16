# SDD-Compliance micro-bench · v1

> **标题**：SDD-Compliance · **非** Agent Score / pass@1 类模型 benchmark。  
> **范围**：S1–S4 · 公理 D2/D3/S2 可机械检查部分 · 不覆盖 D4/D5 与 Terminal-Bench。  
> **状态**：v1.0 draft · 数字待 P0 绿后冻结。

---

## 运行

```bash
# 从产品包根
cd /path/to/cyning-harness
./wizard/compliance-bench.sh --all
```

## Scenario

| ID | 场景 | 公理 | 期望 |
| --- | --- | --- | --- |
| S1 | R1 pending 即 30 | D2 | gate-check exit≠0 |
| S2 | R1 approved · 无 review | D2/D3 | bench 判非合规（gate-check 可能 exit 0） |
| S3 | R1 approved + review 落盘 | D2/D3 | gate-check exit=0 · review 文件存在 |
| S4 | sync 域不含 task/reviews | S2 | `harness-sync.sh plan` 输出无 `docs/tasks/`、`docs/harness/reviews/` 路径 |

## 输出

脚本输出每项 PASS/FAIL 及合规率 %。
