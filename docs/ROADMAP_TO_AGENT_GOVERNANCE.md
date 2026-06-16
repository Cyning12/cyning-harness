# 演进路线图：从项目纪律包到 Agent 治理平台

> **用途**：远期规划草案 · 展示 Harness 从 MVP 到 Agent 治理层的演进路径。  
> **状态**：`proposal` · **非**当前 semver 承诺 · 与 Track G（HGM）提案并列评估  
> **真值边界**：当前产品能力以 [`methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md) 为准；本文档为愿景与架构方向

| 项 | 内容 |
| --- | --- |
| **版本** | v1.0 |
| **日期** | YYYY-MM-DD |
| **状态** | proposal |
| **依赖** | cyning-harness v0.2+ 核心（Sync、Gate、ProcessTrack） |
| **愿景** | 为任意 Agent（Kimi Code、Claude Code、Cursor 等）提供统一的治理层：约束、审计、闸门、可观测性 |

**核心思想**：Harness 定义的是一套「受治理的执行语义」，执行者可以是人，也可以是 Agent。通过轻量适配器，将治理能力无损注入 Agent 原生调用链。

---

## 1. 为什么需要 Agent 治理？

当前 AI Agent 的痛点：

- **行为不可控**：Agent 可能执行未授权的命令、访问敏感文件。
- **过程不透明**：无法回溯 Agent 的决策路径和中间结果。
- **合规性缺失**：企业无法满足审计要求（谁、何时、做了什么）。
- **无标准化闸门**：无法插入人工审批、自动校验等环节。

cyning-harness 已经通过 HumanGate、AuditReview、InvokeSnapshot 等实体解决了人类 + AI 协作的治理问题。下一步是将这些能力无损迁移到纯 Agent 执行场景。

---

## 2. 三阶段演进路径

### 阶段 0：当前状态（v0.2 – v0.4）

| 项 | 内容 |
| --- | --- |
| **形态** | 项目纪律包，需手动绑定到仓库，要求开发者遵循 SDD 帽链 |

**能力**：

- ProcessTrack + StarterHat（10/22/30/40）
- HumanGate 与 AuditReview 落盘
- Sync 机制（S1–S6）
- 基础 ICVO 映射

**限制**：

- 必须有人参与闸门审批（HumanGate）
- 未与 Agent 运行时集成

---

### 阶段 1：Agent 适配器层（v0.5 – v0.6）

**目标**：允许现有 Agent（如 Kimi Code、Claude Code）透明地被 Harness 包裹，自动获得治理能力。

**技术要点**：

**通用适配器接口**

定义 `HarnessMiddleware` 规范，拦截 Agent 的输入/输出。

示例（伪代码）：

```python
class HarnessMiddleware:
    def before_execution(task_id, input):
        # 创建 Task 节点，检查 Gate 状态
        pass

    def after_execution(result):
        # 记录 AuditReview，更新状态
        pass
```

**零侵入集成**

- 通过环境变量或启动脚本代理 Agent 的 API 调用。
- 例如：`export KIMI_CODE_HARNESS_CONFIG=./harness.yml && kimi-code ...`

**自动化 Gate 处理**

- 将 HumanGate 降级为可配置的自动规则（例如：`auto_approve_if_test_pass=true`）或转发给另一个审核 Agent。

**输出适配**

- 将 AuditReview、InvokeSnapshot 以 Agent 可读的格式（JSON、结构化日志）输出，便于 Agent 后续使用。

**交付物**：

- `harness-agent-proxy` CLI 工具
- 至少一个 Agent 的集成示例（如 Kimi Code + kimi-code-meta preset）
- 更新本体：增加 `AgentExecutor` 作为 `ExecutionShell` 的子类

---

### 阶段 2：Agent 原生治理 SDK（v0.7 – v0.8）

**目标**：提供官方 SDK，让 Agent 开发者可以显式调用 Harness 的治理能力。

**技术要点**：

**多语言 SDK（TypeScript / Python 优先）**

提供 `HarnessClient`，支持：

- `task.create()`
- `gate.check()`
- `audit.log()`
- `artifact.upload()`

**声明式策略（Policy as Code）**

允许通过 YAML 定义治理规则：

```yaml
rules:
  - name: "禁止修改生产数据库"
    condition: "action == 'db.update' && env == 'prod'"
    action: "block"
```

**与本体自动同步**

- SDK 可直接读取 `ontology.yaml`，生成强类型客户端。

**交付物**：

- `@cyning-harness/sdk-python` 和 `@cyning-harness/sdk-ts`
- 策略引擎（使用 Open Policy Agent 或自定义解释器）
- 示例：用 Harness SDK 改写一个开源 Agent（如 AutoGPT）的核心行为

---

### 阶段 3：企业级 Harness Gateway（v0.9 – v1.0）

**目标**：独立部署的治理网关，统一拦截组织中所有 Agent 的调用，提供集中式审计、合规、闸门管理。

**架构**：

```text
Agent 1 (Kimi Code)  --\
Agent 2 (Claude Code) ---> Harness Gateway (sidecar/proxy) --> 后端系统
Agent 3 (Custom)     --/
```

**功能**：

| 能力 | 说明 |
| --- | --- |
| **调用拦截** | 基于 eBPF / HTTP 代理，无侵入 |
| **策略集中管理** | 管理员可在 Web UI 定义全局规则 |
| **审计日志中心** | 所有 Agent 行为结构化存储，可检索、可回放 |
| **闸门集成** | 与企业 SSO、工单系统、审批流对接（如 Jira、ServiceNow） |

**交付物**：

- 可部署的 Docker 镜像 + Helm Chart
- 管理控制台（React）
- 与主流 Agent 的预配置集成（Kimi Code、Cursor、Continue）

---

## 3. 与现有本体的对应关系

| HGM 概念 | 阶段 1 适配器 | 阶段 2 SDK | 阶段 3 Gateway |
| --- | --- | --- | --- |
| Task | 自动创建 | 显式创建 | 自动创建 + 关联组织 |
| HumanGate | 可配置自动批准 | 策略控制 | 对接企业审批系统 |
| AuditReview | 自动生成 | SDK 记录 | 中心化存储 |
| InvokeSnapshot | 自动捕获 | 可选 | 完整保存 |
| ConstraintArtifact | 读取本地规则 | SDK 加载 | 策略下发 |

---

## 4. 对个人开发者 / 求职者的价值

即使不实现全部三个阶段，规划这份路线图本身就展示了：

- **前瞻性架构思维**：不局限于当前 MVP，能预见 AI 工程化的演进方向。
- **对企业需求的理解**：知道企业最终需要的是集中、可控、可审计的 AI 治理。
- **技术深度**：能设计代理拦截、策略引擎、多语言 SDK 等组件。

在面试月之暗面等公司时，你可以说：

> 「我设计的 Harness 目前是项目纪律包，但它的本体和治理模型可以无缝扩展到 Agent 治理层。这里有一份三阶段路线图，展示了如何从现有 MVP 演进到企业级 AI Gateway。」

这远比只说「我做了一个约束 AI 的工具」更有冲击力。

---

## 5. 与产品路线图的边界

| 文档 | 关系 |
| --- | --- |
| [`methodology/ROADMAP_v1_zh.md`](./methodology/ROADMAP_v1_zh.md) | **semver 真值** · v0.2→v1.0 主轨 |
| Track G（HGM） | v1.0 后提案 · 事件/schema 子集 |
| **本文档** | 愿景层 · Agent 治理全栈 · **不占用 v1.0 前人月** |

启动条件建议：v1.0 stable push 完成 + 本体/ontology.yaml 冻结 + 至少一条 B2 量化证据（见 [`BENCHMARK_REPORT_TEMPLATE.md`](./BENCHMARK_REPORT_TEMPLATE.md)）。

---

## 6. 修订记录

| 版本 | 日期 | 说明 |
| --- | --- | --- |
| v1.0 | YYYY-MM-DD | 初稿：三阶段演进、适配器设计、企业网关愿景 |
