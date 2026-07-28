# Checklist 草稿 · `@cyning/harness@2.18.0` 实仓验收

> **用途**：维护者在真实业务仓（建议已启用 `wiki: true` 的 fullstack / ios-cursor，或自建 `docs/coding_wiki`）验收本版。  
> **状态**：`draft` · 发版后由人勾选 · **人签真值仍在本文件**  
> **SPEC**：[`SPEC-experience-wiki-feedback_loop_v1.md`](../spec/SPEC-experience-wiki-feedback_loop_v1.md)  
> **消费者对照（非人签）**：`cyning-harness-web/docs/evidence/FEEDBACK_harness_2_18_0_from_web_obs_20260728.md`（2026-07-28 dogfood）

---

## 0. 前置

- [ ] `npx @cyning/harness@2.18.0 --version` → `2.18.0`
- [ ] 业务仓 `upgrade`（或 init）后 `check` 无异常
- [ ] 知悉破坏性：存量 active task **须补** `wiki_delta`（无 wiki 填 `n/a` + note）

---

## 1. P0 · wiki_delta 关账

- [ ] 新/改 task 元信息可见 `wiki_delta` / `wiki_delta_note`
- [ ] **缺字段** close → `CLOSE: BLOCKED`（含「缺 wiki_delta」）
- [ ] `wiki_delta=none` 无 note → BLOCK
- [ ] `wiki_delta=n/a` + note（harness-only）→ 可 PASS（其它闸绿时）
- [ ] `wiki_delta=docs/coding_wiki/...` 且路径存在 → 可 PASS
- [ ] 路径不存在 → BLOCK
- [ ] `--allow-wiki-gap` 可豁免并留痕（勿当默认绿路径）
- [ ] `verify --task`：wiki 缺口默认 WARN 不挡 30；`--strict-wiki-delta` 可 BLOCK

---

## 2. P1 · 经验晋升指针

- [ ] `experience_capture=required` + `wiki_delta=path` + 经验节无指针 → close BLOCK
- [ ] 经验节含 `Wiki: docs/coding_wiki/...`（或 `wiki_promoted:` / 含路径）→ PASS
- [ ] `wiki_delta=none|n/a` 时不要求指针

---

## 3. P2 · wiki export

- [ ] `npx @cyning/harness wiki export --json` 对仓内 `docs/coding_wiki` 产出 JSON
- [ ] `schema` = `harness.wiki_graph.v1`；含 `nodes` / `edges`
- [ ] 有 `[[wikilink]]` 或相对 `.md` 链时 edges 非空（可人为加一条验证）
- [ ] 无 `docs/coding_wiki` → exit ≠ 0 且可读错误
- [ ] （可选）把 JSON 丢给 harness-web / 本地力导向原型能读——**非本包必验**

---

## 4. 文档与 Prompt

- [ ] USER_GUIDE 可见 wiki_delta / export / `--allow-wiki-gap`
- [ ] 30/40 帽文提到关账前答 wiki_delta
- [ ] `coding_wiki/templates/README` 关账晋升节可读

---

## 5. 回归冒烟（勿回归）

- [ ] 既有 invoke / review / graph_delta / KPI / experience 闸仍工作
- [ ] 勿默认依赖任何 `--allow-*-gap` 作为绿路径

---

## 6. 签收

| 项 | 值 |
|----|-----|
| 验收仓 | （填写） |
| 验收人 | （填写） |
| 日期 | |
| 结论 | `pass` / `pass_with_notes` / `fail` |
| 备注 | |

---

## 7. 文档侧批注 · web dogfood（2026-07-28 · **非**最终人签）

| checklist 域 | 消费者结果 | FEEDBACK |
|--------------|------------|----------|
| §0 破坏性知悉 / 补 wiki_delta | web 已迁 8 done task | — |
| §1 缺字段 close BLOCK / n/a 路径 | 语义确认；verify WARN→迁后消失 | F-218-01（warn · 文档已加 §6.0b；CLI lint→2.19） |
| §1 n/a vs none | 决策树进 USER_GUIDE 2.18.1 | F-218-02 |
| §3 export schema + nodes/edges | web nodes=6 edges=6；产品 templates 互链 2.18.1 | F-218-04/05 |
| §3 可选 Web 消费 | `/wiki-graph` dogfood 通过 | — |
| severity=block | **无** | — |

升级不代写 task：见 ONBOARDING / CHANGELOG 2.18.1 Notes（F-218-03）。

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-28 | 2.18.0 发版前草稿 · 00 |
| 2026-07-28 | §7 批注 web FEEDBACK；人签仍交维护者 |
