# demo_checkout · P0 金样路径

> **目标**：在空业务仓复现 **harness-only · 10→22→30** 最小 SDD 闭环（见 [`docs/P0_V0.2_GAP.md`](../../docs/P0_V0.2_GAP.md)）。

---

## 文件

| 文件 | 用途 |
| --- | --- |
| [`task_demo_p0_golden_v1.md`](./task_demo_p0_golden_v1.md) | 金样 task · 复制到 `docs/tasks/active/` |
| [`ACCEPTANCE.md`](./ACCEPTANCE.md) | 分阶段验收勾选 |
| `reviews/` | （自行创建）22 产出落盘目录 |

---

## 快速跑通

```bash
export CYNING_HARNESS=/path/to/cyning-harness
mkdir -p /tmp/harness-p0-demo && cd /tmp/harness-p0-demo && git init -q

"$CYNING_HARNESS/wizard/install.sh" --target . --preset harness-only --ide cursor,agents
cp "$CYNING_HARNESS/examples/demo_checkout/task_demo_p0_golden_v1.md" docs/tasks/active/
"$CYNING_HARNESS/wizard/harness-sync.sh" apply --target .

# 打开 IDE → 按 ACCEPTANCE.md 执行 10 → 22 → gate-check → 30
```

---

## 与 A3 的关系

- **P0**：本目录 + 本地 `/tmp` 演示  
- **A3/v0.4**：脱敏后作为 public repo 对外 `examples/demo_checkout/` 正式金样  

---

## Kimi Code fork

维护 Kimi Code 个人 fork 过程轨时，用 **`oss-fork-meta`** 或将来 **`kimi-code-meta`** preset（见本体 §3.3.1）· 本金样 **不** 绑定 Kimi 产品代码。
