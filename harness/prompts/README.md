# harness/prompts

从本目录向用户仓 **`docs/harness/prompts/`** 复制 **Starter 子集**（非 Ink 全量帽子库）。

## v0.1 已交付（T3 · M2）

| 文件 | 状态 | 说明 |
|------|------|------|
| [`10-requirements.md`](./10-requirements.md) | ✅ | 需求 / 任务分析 · 精简 + POINTER |
| [`22-task-audit.md`](./22-task-audit.md) | ✅ | 任务审核 · 落盘 reviews · HG-AUDIT-R1 |
| [`30-execute-code.md`](./30-execute-code.md) | ✅ v0.1.1 | 执行编码 · 强制闸扫描 · AUDIT approved |
| [`40-self-check.md`](./40-self-check.md) | ✅ v0.3.2 | 自检 · 命令证据 · 回填 task |
| [`TEMPLATE_30_gate_stop.md`](./TEMPLATE_30_gate_stop.md) | ✅ v0.1.1 | 30 拒开工输出模板 |

**Starter 闭包**：10 / 22 / 30 / **40**（A2 · v0.3.x）

## 完整库（POINTER · 不复制全文）

Extended 帽（00/20/40/50、链式 PROMPT）由维护者在 **私有工作区或签约伙伴仓** 维护 · **不**默认复制进用户仓。

嵌入用户仓后可在 README 追加（示例）：

```markdown
## 完整 Harness 库
- 上游：你的组织/monorepo `docs/harness/prompts/`（只读对照 · 非 Starter 默认）
```

## 链式执行

- 串行 Task 链：维护者工作区链式 PROMPT（M3 `harness ctx` 前手工 `@` 引用）
- 每帽 invoke：[`../invokes/TEMPLATE_invoke.md`](../invokes/TEMPLATE_invoke.md)
