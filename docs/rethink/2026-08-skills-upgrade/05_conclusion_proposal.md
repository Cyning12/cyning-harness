---
name: rethink-skills-upgrade-05-conclusion-proposal
description: R3 · 结论与立项建议 · 五个待决问题的决策 + SPEC 形态/验收/非范围 + 落地链预览 · 何时读：决定是否立项、起草 10-spec 前
---

# 05 · 结论与立项建议

> **简介**：R3 收官。总判断 = **建议立项**（A+B+C 合一，D 留远期）。本文回答 04 §5 的五个问题，给出 SPEC 形态草案与落地链预览。**注意：本文是建议不是立项**——正式立项走 10-spec → 20-spec-audit → HG-SPEC-SIGNOFF → 00 起草 task 链。

## 1. 总结论

```
建议 GO：方向 A+B+C 合一立项（「Agent Skills 标准封装」）
        D（MCP 并列治理层）维持远期，不进本 SPEC
依据：01（差距仅在封装格式）+ 03（成本为「封装」非「改写」）+ 04（T1 有判死线，风险可控）
```

不 GO 的替代项及判死理由：
- 「只做 A（知识探针）不做 B/C」→ 探针产出无人消费，犯 G1 病（基础设施先行、消费者缺席）
- 「手写 skills/ 先行、生成器后补」→ 制造双真值窗口（02 §4-1 铁律）

## 2. 五个待决问题的决策

### Q1 立项形态 → **一个 SPEC**

frontmatter 元数据（B 的源）、生成器（C）、CI 校验（C）是**同一条生产线的三段**，拆开必产生「手写 skills 先存在」的过渡期。dogfood（A 的验证职责）与 T1 评测写进 task 的验收标准，不独立立项。

### Q2 版本轨道 → **v2.x minor**（下一个 minor，如 v2.23.0）

- `skills/` 新目录 + `harness skills build|check` 新命令 + prompts 头部新增 frontmatter = 纯增量、向后兼容
- frontmatter 进 prompts 会随 sync 进业务仓条文文件——内容变化但语义不变，minor 合理；sync overlay 的既有测试须全绿（防 frontmatter 破坏 overlay 合并）
- 不碰 v3：无 breaking、无状态机语义变更

### Q3 sync/upgrade 交互 → **本波 sync 不动，业务仓手工装**

- 各 client 的 skills 放置路径不同（`.claude/skills/`、`.cursor/...`、Codex 各自约定），sync 替客户做决定为时过早
- 包内出 `skills/` + README 安装指引（复制/软链到目标 client 路径，一句话）
- **触发再议的信号**：D1/D2 dogfood 数据显示 ≥2 个业务仓有真实安装动作 → 那时 sync 加目标是「消费者拉动」，不是基础设施先行（01_big_directions 方向四的病）
- upgrade 侧唯一要保证的：frontmatter 入 prompts 后 `sync.index` / `sync.overlay` 测试全绿

### Q4 Extended 帽 → **本波不做工作区级 `.claude/skills/`**

- 00/50/handoff 的发现需求已被 `Projects/.claude/agents/` 薄层覆盖（Lead 显式 spawn，无自动激活需求）
- 维持反方向纪律 4：subagent 链不动；若 D1–D3 数据显示 subagent 与 skill 双轨造成认知负担，再议合并——且须先证明回报纪律（≤10 行）与上下文隔离不退化

### Q5 T1 评测脚本所有权 → **`eval/`（半自动，不进 CI test/）**

- 评测需真实模型调用，纯 CI 无模型 → `test/` 判死
- 形态：`eval/t1_gate_bypass/` 场景 fixture（S1–S3 task 文件 + 输入话术 + 判据 checklist），人工/半自动触发，每次执行结果留档 `docs/harness/reviews/`（与 20 帽审查文同目录哲学：过程留痕）
- 纳入 SPEC 验收：D3 前 S1–S3 全过 ≥3 次且有 reviews 留档

## 3. SPEC 形态草案（立项时的骨架）

**标题**：`SPEC-agent-skills-packaging_v1` —— Starter 帽的 Agent Skills 标准封装与生成校验

**范围（in）**：
1. 6 个 Starter 条文头部 frontmatter（name/description/compatibility/metadata.hat_id；30 帽含负向触发措辞）
2. `lib/skills.js` + `harness skills build|check`（build 生成 `skills/`；check 只读校验 regen diff + frontmatter 规范约束）
3. 生成物 `skills/` 入库 + `package.json` `files[]` + README 消费指引
4. `test/skills.test.js`（生成确定性 / 链接重写 / sync overlay 兼容）+ CI `skills-ref validate` step
5. `eval/t1_gate_bypass/` S1–S3 fixture 与判据
6. dogfood D1（工作区装 10-task/10-spec）随 SPEC 的首个 task 执行

**非范围（out）**：
- 30/40 进 `skills/` 分发（D3 及以后，T1 评测过了再说——但 30/40 的 frontmatter **本波就写**，生成时带 `metadata.track: starter-experimental` 标记且 README 注明「执行帽 skill 未过闸评测，仅供评测环境」）
- sync/upgrade 推 skills/ 到业务仓（Q3）
- Extended 帽、subagent 链任何变更（Q4）
- MCP / 方向 D

**验收标准（草案，10-spec 阶段细化）**：
- `harness skills check` exit 0 且 CI 含该步
- `skills-ref validate skills/` 全过
- 改任一 prompts 条文正文 → `skills check` 必 fail（证明生成物不 drift）
- sync.overlay / sync.index 既有测试全绿
- D1 dogfood 数据回写 rethink README

**failure_paths（预判）**：
- description 触发率过低（D1 无人自然触发）→ 迭代 description，不扩大分发
- frontmatter 破坏 sync overlay → 回退 frontmatter 位置方案（备选：`.skill-meta.yaml` sidecar 与条文同目录——仍是单源，牺牲随行性）
- 30 帽负向触发在评测中失守 → 30/40 生成物从 `skills/` 剔除，frontmatter 保留待用

## 4. 落地链预览（走正式 Harness 流程）

```
10-spec（本系列 03/04/05 为必读输入）
 → 20-spec-audit + HG-SPEC-SIGNOFF（人签）
 → 00 起草 task（建议单 task 或拆 T1=frontmatter+生成器 / T2=CI+eval+D1）
 → 10-task → 20-task-audit R1 → HG-AUDIT-R1（人签）
 → 30（本仓实现 · lib/skills.js 等）→ 40 → close
```

**给 00/10 帽的提示**：本仓是 cyning-harness 自身，`worktree_root` = 本仓根；dogfood 性质 = 自己的链用自己的 skills，正合库哲学。

## 5. 系列收口

| 轮 | 产出 | 状态 |
|---|---|---|
| R1 | 01 映射 + 02 张力 | ✅ 已落盘 commit |
| R2 | 03 格式设计 + 04 评测/dogfood | ✅ 已落盘 commit |
| R3 | 05 结论与立项建议 | ✅ 本文 |

下一步不在本系列：人读 05 → 决定是否立项 → 立项则走第 4 节正式链（届时本系列四份文档转为 10-spec 的必读输入）。
