# demo_checkout · Consumer Ontology 最小切片样例

> 教学 / dogfood：演示绿野仓如何填 **consumer ontology slice**。  
> **不**参与 `harness ontology-check`（产品本体另册）。

---

## 1. 术语表

| 术语 | 定义 | 反例 / 易混 |
| --- | --- | --- |
| 落盘真值 | 已写入本仓且可被 verify/close 引用的文件 | 仅存在于 Agent 对话的「已完成」 |
| 飞行中 | 执行壳会话态 · 不可升格为签收 | 把 timeline 预览当 CLOSE 证据 |
| graph_delta | 本 task 声明的图谱增量路径或 `none` | 改了 API 却写 `none` 且无 note |

---

## 2. 核心类 / 关系

| 类或关系 | 说明 | `_tech_graph` 指针 |
| --- | --- | --- |
| DemoTask | P0 金样 task | `examples/demo_checkout/task_demo_p0_golden_v1.md` |
| MainFlow | 顶层流程示意 | `examples/demo_checkout/00_main.md` |
| InvokeSnapshot | 帽执行落盘（演示时自建） | `docs/harness/invokes/by-task/<slug>/` |

---

## 3. 推荐顺序（绿野）

1. `npx @cyning/harness init --preset harness-only …`  
2. 复制本文件或模板 `harness/templates/ONTOLOGY_consumer_slice_v1.md` → `docs/meta/`  
3. 填 `docs/_tech_graph/01_struct.md`（及必要 flow）  
4. 签 `HG-GRAPH-MODULES` 后再开涉码 30  

详见产品仓 [`docs/ONBOARDING.md`](../../docs/ONBOARDING.md)「绿野推荐顺序」。
