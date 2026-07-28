# SPEC：反思 → Wiki 反馈闭环（experience · wiki_delta · 晋升纪律）（v1）


| 项         | 内容                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **状态**    | `draft` · 待 HG-SPEC-SIGNOFF                                                                                                                                                                    |
| **日期**    | 2026-07-28                                                                                                                                                                                     |
| **track** | `feature` · close / Inform(WikiTrack) / Prompt 纪律                                                                                                                                              |
| **前置**    | U1 闭环硬闸已合入 · `@cyning/harness` **≥ 2.17.0**（`graph_delta` / `experience_capture` / KPI close）                                                                                                  |
| **建议版本**  | **v2.18.0**（**P0+P1+P2 同窗一次发版** · 维护者 2026-07-28 裁定）                                                                                                                                           |
| **上游讨论**  | 关账已有 experience、无 wiki 必经路径；本包交付 **wiki 字段闸 + `wiki export --json`**；**不**交付 Web 力导向 UI（由 harness-web 另消费 JSON）                                                                                |
| **关联**    | `[SPEC-close-loop-hard-gates_v1.md](./SPEC-close-loop-hard-gates_v1.md)` · `[coding_wiki/templates/](../../coding_wiki/templates/)` · `[harness/lifecycle.yaml](../../harness/lifecycle.yaml)` |


---

## Harness 元信息


| 字段                     | 值                                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| **spec_slug**          | `experience-wiki-feedback-loop`                                                                      |
| **test_strategy**      | `required`                                                                                           |
| **test_strategy_note** | close：wiki_delta / P1 指针缺口可失败；`wiki export --json` 对样例 vault 产出可解析 nodes/edges；豁免旗留痕；wiki 轨关闭时 `n/a` |
| **skip_spec_audit**    | `false`                                                                                              |
| **graph_change_layer** | `none`（产品包无业务 `_tech_graph` 增量义务；本 SPEC 增 **WikiTrack** 过程字段）                                        |
| **review_hat**         | `20`                                                                                                 |


---

## 1. 背景与目标

### 1.1 问题

纪律包生命周期大致为：**引入 → 使用 → 关账 → 反思 → 自我升级**。


| 段    | 现状（≥2.17）                                            | 缺口                                          |
| ---- | ---------------------------------------------------- | ------------------------------------------- |
| 引入   | `init` / profile · wiki 可选拷贝                         | —                                           |
| 使用   | 帽链 10→40                                             | —                                           |
| 关账   | invoke / review / graph_delta / KPI / **experience** | —                                           |
| 反思   | `### 经验总结` 落在 **task 正文**                            | 经验 **不**强制晋升 Inform                         |
| 自我升级 | `npx upgrade` 换包版本                                   | **无**「经验 → wiki/standards → 下一 task 读序」机械闭环 |


`coding_wiki/`（stable / context / volatile）仅为 install/sync 模板；`task close` **无** `wiki_`* 守卫。本体扫描 `WIKI_TRACK` 在产品仓仍为空壳引用。

### 1.2 一句话目标

在 **不削弱** 既有 close 硬闸的前提下，把「关账反思」接到 **WikiTrack 声明与晋升指针**，并提供 `**wiki export --json`** 供下游（含 harness-web）画关系图；**不**自动改 npm 包正文、**不**在本仓实现浏览器 UI / Obsidian。

### 1.3 设计原则

1. **对称 `graph_delta`**：Wiki 用 `wiki_delta` / `wiki_delta_note`，语义与挂点对齐，降低认知负担。
2. **profile 感知**：`wiki: false`（如 `harness-only`）不强迫人造 wiki 路径。
3. **经验仍真值在 task**：wiki 是晋升投影；禁止用 wiki 替代 `experience_capture` 硬闸。
4. **泄压阀**：`--allow-wiki-gap` 可豁免、须留痕（同既有 `--allow-*-gap` 模式）。
5. **反负担**：质量（写得好不好）留 Prompt；机械闸只挡「声明缺失 / 路径不存在 / 晋升指针缺失」。
6. **导出与渲染分离**：本包只产机读图数据；渲染属消费者。

### 1.4 缺字段：WARN vs 缺省 BLOCK（决策说明）

针对「task 元信息里 **根本没有** `wiki_delta` 这一行」：


| 策略                                 | close 行为                                        | 对存量 / dogfood 影响           | 适用直觉          |
| ---------------------------------- | ----------------------------------------------- | -------------------------- | ------------- |
| **缺字段 → WARN**（对齐现行 `graph_delta`） | 打印警告，**仍可归档**（其它闸过则 PASS）                       | 旧 task 不改也能关；易「警告疲劳」、字段长期空 | 迁移友好 · 先推广后收紧 |
| **缺字段 → BLOCK**                    | **直接拒关账**，必须补 `path` / `none`+note / `n/a`+note | 存量 active 关账前都要补字段；纪律立刻变硬  | 新字段要「一上线就必填」  |


补充澄清（两种策略下 **相同**）：

- 已写 `wiki_delta=none` 却 **忘了 note** → 一律 **BLOCK**（不是 WARN）。  
- 已写 path 但文件不存在 → 一律 **BLOCK**。  
- `verify --task` 默认仍建议 **不挡 30**（WARN）；要挡用 `--strict-wiki-delta`。

**维护者裁定（2026-07-28）**：**缺 `wiki_delta` 字段 → close BLOCK**（期待所有 task 显式声明）。`verify --task` 仍默认 WARN 不挡 30；`--strict-wiki-delta` 可将 fail 升为 BLOCK。

---

## 2. 范围

### 2.1 P0 · `wiki_delta` 字段与 close 闸

#### 2.1.1 模板字段

主 `[harness/templates/TASK_TEMPLATE.md](../../harness/templates/TASK_TEMPLATE.md)`（及 epic / graph_bootstrap 等同构处）增加：


| 字段                  | 取值                      | 说明                                                                                              |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| **wiki_delta**      | `path` | `none` | `n/a` | `path`：相对仓根的 wiki 文件或目录（通常 `docs/coding_wiki/*.md`）；`none`：本 task 不改 wiki；`n/a`：本仓未启用 WikiTrack |
| **wiki_delta_note** | 字符串                     | `none` / `n/a` 时 **必填**一行理由                                                                     |


可选（推荐写在元信息表，P0 可 WARN-only）：


| 字段                 | 取值                                                   | 说明                          |
| ------------------ | ---------------------------------------------------- | --------------------------- |
| **wiki_promotion** | `none` | `stable` | `context` | `volatile` | `mixed` | 本轮经验拟晋升到哪一层；`none` 时建议 note |


#### 2.1.2 Profile / 缺省策略


| 条件                                                            | 行为                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 目标仓 manifest / profile `wiki: true`，或存在非空 `docs/coding_wiki/` | 期望 task 显式填 `wiki_delta`（缺字段 → **BLOCK**）               |
| `wiki: false` 且无 `docs/coding_wiki/`                          | 允许 `wiki_delta=n/a` + note；缺字段 → **BLOCK**（须显式 `n/a`+note，禁止省略） |
| `wiki_delta=none` 无 note                                      | close **BLOCK**                                                         |
| `wiki_delta` 为 path 且相对仓根 **不存在**                             | close **BLOCK**（**不做**正文 AST / 链接质量检查）                                  |
| `wiki_delta` 为目录                                              | 目录存在即可；不要求本 task diff 非空                                                |


#### 2.1.3 `task close` / `verify` / lifecycle

1. 新增守卫 id：`close_wiki_delta`（登记入 `[harness/lifecycle.yaml](../../harness/lifecycle.yaml)`）。
2. `task close`：规则同 §2.1.2；失败 → **BLOCK**；`--allow-wiki-gap` 豁免留痕。
3. `verify --task`：同规则默认 **WARN**（不挡 30）；可选 `--strict-wiki-delta` → fail 级 BLOCK。
4. `lifecycle dry-run --transition close`：旁路报告 `close_wiki_delta`（与既有 close_* 一致 · 无 `--apply`）。

#### 2.1.4 Prompt / 文档

1. `[harness/prompts/30-execute-code.md](../../harness/prompts/30-execute-code.md)` / `[40-self-check.md](../../harness/prompts/40-self-check.md)`：关账前检查清单增加「答 `wiki_delta`；若有可复用教训，更新 `docs/coding_wiki/`（或声明 `none`/`n/a`）」。
2. `[coding_wiki/templates/README.md](../../coding_wiki/templates/README.md)` + `volatile.md`：增补 **关账后** 用法（volatile 归档/清空；可晋升条目上移 context/stable）。
3. USER_GUIDE / ONBOARDING / CHANGELOG：字段、闸、豁免、与 experience 关系。
4. `[harness/discipline-coverage.yaml](../../harness/discipline-coverage.yaml)`：登记新 statements / gap 关闭项 ·  bump `as_of_package_version`。

---

### 2.2 P1 · 反思 → Wiki 晋升指针（经验节 ↔ wiki）

在 **不替代** `experience_capture` 的前提下，增强可追溯性：

1. 当 `experience_capture=required` **且** `wiki_delta` 为 **path**（非 `none`/`n/a`）时，`### 经验总结`（或既有标题别名）内须至少一处可解析指针：
  - Markdown 链接 / 相对路径含 `coding_wiki`；或
  - 行匹配 `wiki_promoted:` / `Wiki:` + 路径；或
  - 与 `wiki_delta` 声明路径字符串相同的子串
2. 不满足 → close **BLOCK**；仍可用 `--allow-wiki-gap`（或专用 `--allow-wiki-promotion-gap`，二选一，实现时定一种并写 USER_GUIDE）。
3. 当 `wiki_delta=none|n/a`：不要求经验节含 wiki 指针（经验仍可只留在 task）。
4. **不**自动把经验正文写入 wiki；写入由 Agent/人在 30/40/CLOSE 完成，闸只验「声明 + 指针」。

---

### 2.3 P2 · `wiki export --json`（与 P0/P1 **同窗** · 2.18.0）

交付 CLI（建议子命令形态，实现可微调但须写进 USER_GUIDE）：

```bash
npx @cyning/harness wiki export --json [--target <repo>] [--root docs/coding_wiki] [--out -|path]
```


| 要求          | 说明                                                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **输入**      | 默认扫 `docs/coding_wiki/**/*.md`（可用 `--root`）；无目录 → exit≠0 + 可读错误（或空图 + WARN，实现选定一种并单测）                                                  |
| **边类型**     | 解析 `[[wikilink]]`；以及同目录相对链接 `[text](./foo.md)`（至少一种 md 链）；**不**要求类型化本体边                                                                |
| **输出 JSON** | 稳定字段子集：`{ "schema": "harness.wiki_graph.v1", "nodes": [{ "id", "path", "title"? }], "edges": [{ "source", "target", "kind": "wikilink" |
| **稳定性**     | `schema` + 上述键入 semver 约束；新增字段可加、不删必填键                                                                                                 |
| **单测**      | 用 `coding_wiki/templates` 或 `test/fixtures/wiki_graph_`* 金样：固定边数/节点 id                                                                 |
| **文档**      | USER_GUIDE 一节 + 注明「供 harness-web / Obsidian 对照消费 · 本包不渲染」                                                                              |
| **非本 P2**   | standards 晋升、包自我升级（仍见 §3）                                                                                                              |


---

## 3. 非范围

- 改 `cyning-harness-web` 路由 / 力导向 UI / Obsidian 嵌入（**可消费本包 JSON，但不在本仓改 web**）  
- 将 Obsidian 或任何桌面知识库列为运行时依赖  
- 自动 `npx` 发布或自动改产品包 prompts/standards 正文  
- wiki 正文质量评分、LLM 摘要强制写入  
- 放宽既有 invoke / review / graph_delta / KPI / experience 硬闸  
- 用 wiki 文件替代 task 内 `### 经验总结`  
- G7 runner / 证明「真的改过 wiki 文件内容」（存在性即可；内容 diff 另议）  
- 有类型本体边导出（属 ontology/HGM · 另 SPEC）

---

## 4. 与既有字段关系

```text
experience_capture  ──(仍)──►  task ### 经验总结     ← close_experience
wiki_delta          ──(新)──►  docs/coding_wiki/... ← close_wiki_delta
P1 指针             ──(新)──►  经验节 ⊃ wiki 路径   （仅 wiki_delta=path）
P2 wiki export      ──(新)──►  {nodes,edges} JSON    ← 下游渲染
graph_delta         ──(既有)─►  docs/_tech_graph/...  互不替代
```


| 组合                  | 期望                                                   |
| ------------------- | ---------------------------------------------------- |
| 有教训且启用 wiki         | `experience=required` + `wiki_delta=path` +（P1）经验节指针 |
| 有教训但本轮不改 wiki       | `experience=required` + `wiki_delta=none` + note     |
| harness-only 无 wiki | `wiki_delta=n/a` + note；experience 仍按策略              |


---

## 5. 验收标准

### P0

- [ ] `TASK_TEMPLATE`（及约定同构模板）含 `wiki_delta` / `wiki_delta_note`  
- [ ] `task close`：`none`/`n/a` 无 note → BLOCK；path 不存在 → BLOCK；**缺字段 → BLOCK**  
- [ ] `--allow-wiki-gap` 豁免留痕；**不**作为默认绿路径文档化  
- [ ] `verify --task` WARN；`--strict-wiki-delta` 可 BLOCK  
- [ ] `lifecycle.yaml` 含 `close_wiki_delta`  
- [ ] 30/40 Prompt + coding_wiki 模板 README/volatile 关账指引  
- [ ] USER_GUIDE + ONBOARDING + CHANGELOG（归入 **2.18.0**）  
- [ ] `discipline-coverage.yaml` 更新  
- [ ] 单测覆盖上述 BLOCK/WARN/豁免；`npm test` 全绿  

### P1

- [ ] `wiki_delta=path` + `experience_capture=required` 时经验节缺指针 → close BLOCK  
- [ ] `wiki_delta=none|n/a` 不要求指针  
- [ ] 单测 + USER_GUIDE 一节说明  

### P2（**本窗必做** · 与 P0/P1 同进 2.18.0）

- [ ] `wiki export --json` 可对 fixture / templates 产出合法 `harness.wiki_graph.v1`  
- [ ] 单测锁定节点/边；无 wiki 根时行为有文档 + 单测  
- [ ] USER_GUIDE 记载命令与消费方约定  
- [ ] CHANGELOG 2.18.0 含 P0+P1+P2  

---

## 6. 失败路径（产品行为）


| 触发                              | close / verify           | 豁免                       |
| ------------------------------- | ------------------------ | ------------------------ |
| 缺 `wiki_delta` 字段               | close WARN · verify WARN | （改正文）                    |
| `wiki_delta=none|n/a` 无 note    | close BLOCK              | （改正文）                    |
| `wiki_delta` path 不存在           | close BLOCK              | `--allow-wiki-gap`       |
| （P1）path + required 经验无 wiki 指针 | close BLOCK              | `--allow-wiki-gap`（或专用旗） |
| profile 无 wiki 却填了不存在 path      | close BLOCK              | 改 `n/a` 或建目录             |


---

## 7. 建议落地切分（task 草图 · 供 00 投影）


| 建议 task                                         | 内容                                           | 版本         |
| ----------------------------------------------- | -------------------------------------------- | ---------- |
| `task_cyning_harness_wiki_delta_close_p0`       | 字段 + close/verify/lifecycle + 单测 + Prompt/文档 | **2.18.0** |
| `task_cyning_harness_wiki_promotion_pointer_p1` | 经验节指针闸                                       | **2.18.0** |
| `task_cyning_harness_wiki_export_json_p2`       | `wiki export --json` + fixture + USER_GUIDE  | **2.18.0** |


三 task 可串行或同 PR；**以同一 npm 2.18.0 发布为关账条件**。

---

## 8. 人闸


| human_gate_id   | status    | blocks            | 说明          |
| --------------- | --------- | ----------------- | ----------- |
| HG-SPEC-SIGNOFF | approved  | 00 起草实现 task · 30 | 本 SPEC 签收   |
| HG-AUDIT-R1     | （下游 task） | 30                | 各实现 task 自带 |


**已裁定（2026-07-28）**：P0+P1+P2 **同窗**发版 2.18.0。

**已全部裁定**：缺字段 **BLOCK** · P0+P1+P2 同窗 **2.18.0** · 由 00 统筹实现后发版交维护者实仓验收。

---

## 9. 修订记录


| 日期         | 说明                                                           |
| ---------- | ------------------------------------------------------------ |
| 2026-07-28 | 首稿 · 吸收「反思未接 wiki」讨论 · 对称 graph_delta · 排除 Web/Obsidian/自动升包 |
| 2026-07-28 | 修订：P2 纳入同窗 2.18.0；增 §1.4 WARN vs BLOCK；收缩 §8 待决为缺字段策略一项      |
| 2026-07-28 | 签收：缺字段 BLOCK；P0–P2 同窗 2.18.0；授权 00 统筹研发发版 |
