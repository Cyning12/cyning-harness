# graph/templates

复制到用户仓 **`docs/_tech_graph/`**。

## v0.1 已交付模板（T1 · M2）

| 文件 | 状态 | 说明 |
|------|------|------|
| [`00_main.md`](./00_main.md) | ✅ | 顶层流程（人类友好版） |
| [`00_main.ai.md`](./00_main.ai.md) | ✅ | 顶层流程（AI 协议版 · 双轨） |
| [`01_struct.md`](./01_struct.md) | ✅ | **模块边界表**（D4-a · **HG-GRAPH-MODULES** 人签真值） |
| [`99_mermaid_protocol.md`](./99_mermaid_protocol.md) | ✅ | Mermaid 拓扑协议 |
| [`10_flow_MAIN.md`](./10_flow_MAIN.md) | ✅ | 主路径 flow 示例（人类版） |
| [`10_flow_MAIN.ai.md`](./10_flow_MAIN.ai.md) | ✅ | 主路径 flow 示例（AI 版） |

## 仍可选补（非 T1 硬门槛）

| 文件 | 说明 |
|------|------|
| `02_version.md` | 版本时间线；新仓建议嵌入后首周补 |

## 嵌入后

- **新仓**：骨架 + 模块表人签 + 至少 1 主 flow（见 [`docs/ONBOARDING.md`](../../docs/ONBOARDING.md) §3）
- **存量**：按 ONBOARDING 档位 S0～S3；**禁止**首次全 flow 构图
- **人签**：`01_struct` 模块表 → **HG-GRAPH-MODULES** approved → 允许 30 改码

## 复制命令

```bash
mkdir -p docs/_tech_graph
cp -R cyning-harness/graph/templates/* docs/_tech_graph/
# 按需删除 README 或本说明段
```
