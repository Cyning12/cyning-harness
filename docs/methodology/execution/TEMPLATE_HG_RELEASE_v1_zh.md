# HumanGate · HG-RELEASE（首版 public push 人闸）

> **用途**：维护者 **CLOSE 棒** 执行 GitHub public · npm publish · Release 前逐项勾选。  
> **非 Agent 代签** · 须 OTP / 维护者账号操作。

---

## 元信息

| 字段 | 值 |
| --- | --- |
| **gate_id** | `HG-RELEASE` |
| **blocks** | public visibility · npm publish · GitHub Release |
| **关联** | STRATEGY §5.2 · [`PUSH_AUDIT_a3_v1.md`](../../PUSH_AUDIT_a3_v1.md) |

---

## 前置（须全绿）

- [ ] `npm test` **14/14** 绿（产品仓根）
- [ ] [`PUSH_AUDIT_a3_v1.md`](../../PUSH_AUDIT_a3_v1.md) §5.1 **八项全 pass**
- [ ] 空目录 `npx @cyning/harness@<version> init --yes` 成功（**非**产品仓根）
- [ ] `npm pack --dry-run` 无 `_sandbox` / `.env` / 密钥泄露
- [ ] `HG-AUDIT-R1` + A3 30 invoke 已落盘

---

## 发布序列（建议顺序）

1. [ ] 本地 `package.json` version 与计划 tag 一致（如 `0.4.0`）
2. [ ] `git tag v0.4.0` · `git push origin v0.4.0`
3. [ ] GitHub → Settings → Change visibility → **Public**
4. [ ] Description / Topics：`harness-engineering` · `sdd` · `agent` · `cursor`
5. [ ] `gh release create v0.4.0` · 附 Release notes（CHANGELOG 摘录）
6. [ ] `npm publish --access public`（OTP）
7. [ ] README Quick Start 链 immutability Release URL
8. [ ] （可选）对外短文 · **链 repo** · 非工作区 harness 理论全文

---

## 回滚备忘

| 场景 | 动作 |
| --- | --- |
| npm 误发错误版本 | `npm deprecate @cyning/harness@x.y.z` · 勿 unpublish 已消费版本 |
| 泄露发现 post-push | 立即 private · rotate 密钥 · `git filter-repo` 若必要 |

---

## 签收

| 项 | 值 |
| --- | --- |
| **维护者** | _______________ |
| **日期** | _______________ |
| **tag** | _______________ |
| **npm** | `@cyning/harness@_______________` |
