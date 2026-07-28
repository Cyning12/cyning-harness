# Invoke · 30/40 · close-loop-hard-gates U1（G1–G4）

| 字段 | 值 |
|------|-----|
| **hats** | `30` · `40` |
| **task_slug** | `cyning-harness-close-loop-hard-gates-u1` |
| **date** | `2026-07-28` |
| **git_branch** | `task/close-loop-hard-gates-u1-impl` |
| **actor** | 30 执行 Agent |

## 动作

1. 分支：`task/close-loop-hard-gates-u1-impl` ← `origin/main`。
2. **G1**：`TASK_TEMPLATE` + `parseHarnessMeta` + close/verify graph_delta + `--strict-graph-delta` + 单测。
3. **G3**：close KPI 可解析分数闸 + `--allow-kpi-gap` + 单测（verify 不挡 30）。
4. **G4**：experience_capture close 闸 + `--allow-experience-gap` + 单测。
5. **G2 P0**：`ONTOLOGY_consumer_slice_v1.md` + ONBOARDING 绿野顺序 + `examples/demo_checkout` 样例。
6. 文档：USER_GUIDE · CHANGELOG **2.17.0** · `package.json` / `discipline-coverage` as_of `2.17.0`。
7. `npm test` 全绿 → PR → squash merge（禁 publish / 禁直推 main）。

## 自检结论（40）

- 未默认用 `--allow-*-gap` 作绿路径；既有 invoke close / pre-30 verify 硬闸未削弱。
- 未改 cyning-harness-web；未 npm publish。

## 下一棒

- 维护者：`npm publish @cyning/harness@2.17.0`（本 invoke 不执行）
- CLOSE：补 KPI / 经验节后 `task close`
