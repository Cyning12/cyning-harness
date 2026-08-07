# SPEC：graph yaml · G-L 物理分层递归发现 + export graph.json（v1）

| 项 | 内容 |
| --- | --- |
| **状态** | `signed` · `HG-SPEC-SIGNOFF` = **approved**（2026-07-29） |
| **日期** | 2026-07-29 |
| **track** | `feature` · Inform CLI |
| **触发 dogfood** | `cyning-harness-meta` @ `cyning/meta` · [`DOGFOOD_NOTES.md`](../../../cyning-harness-meta/docs/_tech_graph/DOGFOOD_NOTES.md)（本地 worktree） |
| **上游交付** | 工作区 [`DELIVERABLE_cyning_harness_self_glayer_meta_v1_zh.md`](../../../docs/harness/reviews/DELIVERABLE_cyning_harness_self_glayer_meta_v1_zh.md) |
| **建议版本** | **`@cyning/harness` minor**（立项时钉，如 2.23.0）· 叠于现行 2.22.x |

---

## Harness 元信息

| 字段 | 值 |
|------|-----|
| **spec_slug** | `graph-yaml-glayer-recurse-export` |
| **test_strategy** | `required` |
| **test_strategy_note** | 夹具含 `l0/`+`l1/` 嵌套 `*.graph.yaml`；递归发现 / export / 扁平回归 |
| **skip_spec_audit** | `false` |
| **graph_change_layer** | `none`（改 CLI；产品自描述图仅 dogfood） |
| **review_hat** | `20` |

---

## 1. 背景与目标

### 1.1 问题

S3 / G-L 物理分层后，业务/产品仓常见布局为：

```text
docs/_tech_graph/
  l0/00_main.graph.yaml
  l1/10_flow_*.graph.yaml
  shared/graph.json
```

现行 `allGraphIds(inputRoot)` **仅** `readdirSync` 输入根扁平文件。对 `--input docs/_tech_graph` 执行 `compile|check --all` →「未找到 *.graph.yaml」（exit 0 空跑）。

另：`compile --all` **不**写出合并 `graph.json`；meta dogfood 须手写/旁路脚本合并。

### 1.2 目标（一句话）

`--input` 指向 `_tech_graph` 根时，**递归**（约定子目录）发现全部 `*.graph.yaml` 并支持 **一键 export** 到写死/可配的 `graph.json` 路径。

### 1.3 非目标

- 强制改用户仓目录布局  
- 一次修好全部 `npx` bin 链环境问题（可记 P2 / 文档）  
- HGM / PIP  
- 回灌 `graph/templates` 全量（可另开；本 SPEC 可加 **最小** 夹具或 examples 切片）  
- `HG-META-MERGE`

---

## 2. 语义裁定

### 2.1 递归发现

| 项 | 裁定 |
|----|------|
| **默认** | `allGraphIds(inputRoot, { recursive: true })`：**默认 true**（minor 行为增强；扁平仓仍兼容） |
| **跳过目录名** | `node_modules` · `.git` · `shared`（shared 默认不扫 yaml；若未来放入则显式 `--include-shared`） |
| **深度** | 至少覆盖 `l0/` · `l1/` · `l2/`（indexes 无 yaml 则可空）；建议 maxDepth≥3 |
| **graphId** | 相对 `inputRoot` 的路径（posix），去掉 `.graph.yaml`，如 `l0/00_main` · `l1/10_flow_gate_check` |
| **扁平回归** | 根下直接 `00_main.graph.yaml` → id 仍为 `00_main`（无目录前缀） |
| **同名冲突** | 不同子目录允许同 basename；id 含路径故唯一。若两文件归一化 id 冲突 → **硬失败** |

`yamlPathFor` / `mdPathFor` / `compile` / `check` / `buildGraphPayload` 须统一使用相对 id（`path.join(inputRoot, id + '.graph.yaml')` 在 Node 下对 `l0/00_main` 正确）。

### 2.2 Export

| 项 | 裁定 |
|----|------|
| **命令** | 新增 `harness graph yaml export --input <dir> [--out <path>]` |
| **默认 --out** | `<input>/shared/graph.json`（若无 `shared/` 则创建；与 meta 写死路径对齐） |
| **也可** | `compile --all --export[=<path>]` 作为别名（实现二选一或都做；SPEC 验收以 **export 子命令** 为准） |
| **载荷** | 复用 / 扩展 `buildGraphPayload`；须含现有 graphs/nodes/edges；**宜**增 `modules`/`flows` 索引字段若 payload 已有约定，否则保持现结构并在 CHANGELOG 说明 |
| **check** | `check --all --input <root>` 递归后对发现的每个 id 校验；可选 `--graph-json <path>` 对 export 产物做整包 check（若已有 `checkGraph` API） |

### 2.3 兼容

| 场景 | 行为 |
|------|------|
| 旧扁平 `_tech_graph/*.graph.yaml` | 行为与今一致（id 无前缀） |
| 仅 `--input docs/_tech_graph/l1` | 仍可用；递归该子树 |
| `--no-recursive` | 保留旧扁平扫描（逃生阀） |

---

## 3. 范围（实现）

| 路径 | 动作 |
|------|------|
| `lib/graph-yaml.js` | `allGraphIds` 递归；路径型 graphId；`exportGraphJson` 或扩展 `buildGraphPayload` |
| `lib/cli.js`（及 help） | `graph yaml export`；`compile/check --all` 接递归；`--no-recursive` |
| `test/graph-yaml*.test.js`（新建或扩） | 夹具 `fixtures/glayer_tech_graph/`：l0+l1 至少 2 yaml；断言发现数、export 文件存在、扁平回归 |
| `docs/USER_GUIDE_v1.0_zh.md` | Inform-YAML 节：S3 根 `--input` + export 示例 |
| `CHANGELOG.md` | minor 条目 |
| （可选）`examples/` 或 `test/fixtures/` | 最小分层样例 |

**Dogfood（验收建议）**：对 `cyning-harness-meta/docs/_tech_graph`（或拷贝夹具）  
`node bin/harness.js graph yaml compile --all --input docs/_tech_graph` 非空；  
`… export --input docs/_tech_graph` 写出 `shared/graph.json`。

---

## 4. 失败路径

| 触发 | 行为 | 可重试 |
|------|------|--------|
| 输入目录不存在 | 非 0 · 明确错误 | 是 |
| 递归 id 冲突 | 非 0 · 列出两路径 | 是 |
| yaml 校验失败 | 与现行 compile 一致 · 中止 export | 是 |
| `--out` 父目录不可写 | 非 0 | 是 |

---

## 5. 验收标准

- [ ] `--input` 指向含 `l0/`+`l1/` 的根时，`compile --all` / `check --all` **发现 ≥1** yaml（不再空跑）  
- [ ] `graph yaml export` 默认写出 `<input>/shared/graph.json`  
- [ ] 扁平布局回归绿  
- [ ] `--no-recursive` 行为 = 旧版扁平  
- [ ] `npm test` 相关用例绿  
- [ ] USER_GUIDE + CHANGELOG  
- [ ] （建议）meta 或夹具 dogfood 命令摘录入 task CLOSE  

---

## 6. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | v1 draft · 自 meta DOGFOOD 缺口立项 |
| 2026-07-29 | `HG-SPEC-SIGNOFF` approved · 状态 → `signed` |
| 2026-07-29 | 30 实现落地（worktree `task/graph-yaml-glayer-recurse-export`）· 验收勾选待 CLOSE 同步 |
