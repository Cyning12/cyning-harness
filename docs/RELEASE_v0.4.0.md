# Release v0.4.0 · 首版 public push 准备（A3）

> **包名**：`@cyning/harness@0.4.0`  
> **许可**：MIT  
> **日期**：2026-06-15  
> **代号**：A3 · PublicBeta 产品树（纪律包 · 无业务代码 · 无 LLM Runtime）

---

## 概要

本版本为 **首版开源 public push 的产品树**：完成 push 前审计与脱敏、MIT 许可、对外金样 POINTER 化，并补齐本体机器可读草案与发布人闸模板。

**定位**：嵌入任意业务仓的 **SDD 过程纪律包**（Inform / Constrain / Verify 仓库化落地），与 Agent Runtime / MCP 宿主 **互补而非竞争**。详见 [`docs/ETCLOVG_MAPPING_v1_zh.md`](./ETCLOVG_MAPPING_v1_zh.md)。

---

## Quick Start

在 **目标业务仓根**（非本产品仓根）：

```bash
npx @cyning/harness@0.4.0 init --preset harness-only --ide cursor,agents
npx @cyning/harness upgrade
npx @cyning/harness check
```

---

## 新增

| 项 | 说明 |
| --- | --- |
| **MIT LICENSE** | 根目录 [`LICENSE`](../LICENSE) |
| **`ontology.yaml`** | 产品设计本体机器可读草案 · 对齐 DESIGN_ONTOLOGY v1.2 |
| **Push 审计表** | [`docs/PUSH_AUDIT_a3_v1.md`](./PUSH_AUDIT_a3_v1.md) · STRATEGY §5.1 八项 |
| **ETCLOVG 映射** | [`docs/ETCLOVG_MAPPING_v1_zh.md`](./ETCLOVG_MAPPING_v1_zh.md) |
| **HG-RELEASE 模板** | [`docs/methodology/execution/TEMPLATE_HG_RELEASE_v1_zh.md`](./methodology/execution/TEMPLATE_HG_RELEASE_v1_zh.md) |

---

## 变更

- **README**：顶部 Quick Start 三行 · MIT public 叙事 · v0.4.0 状态
- **`golden/`**：POINTER 化 · 保留公开 PR 证据 · 移除内部 invoke 路径枚举
- **`examples/oss-fork/`** · **`standards/`** · **`harness/prompts/README`**：脱敏私有工作区硬链

---

## 继承自 v0.3.x（仍可用）

- **npx CLI**：`init` · `upgrade` · `check` · `task check`
- **Starter 四帽**：10 / 22 / 30 / 40 · `gate-check` · manifest · S5 git-clean
- **金样**：[`examples/demo_checkout/`](../examples/demo_checkout/) · P0 10→22→30

---

## 验证

维护者关账前已跑：

- `npm test` — **14/14** pass
- 空目录 init — `manifest.version: 0.4.0`
- `npm pack --dry-run` — 含 LICENSE / ontology · 无 `_sandbox`
- §5.1 路径/密钥 grep — 无泄露

复跑见 [`PUSH_AUDIT_a3_v1.md`](./PUSH_AUDIT_a3_v1.md) §复检命令。

---

## 已知限制

- **demo 阶段 E**（22 CLOSE 终轮）仍可选 defer
- **Extended 帽**（00/50/链式 PROMPT）不在 Starter 默认闭包 · 见 `harness/prompts/README`
- **v1.0 stable**（A4）：ICVO audit CLI · B2 量化进 README — 见 ROADMAP

---

## 完整变更日志

[`CHANGELOG.md`](../CHANGELOG.md#040---2026-06-15)

---

## 链接

- 文档索引：[`docs/README.md`](./README.md)
- 接入：[`docs/ONBOARDING.md`](./ONBOARDING.md)
- 路线：[`docs/methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md)
