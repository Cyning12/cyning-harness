# Postmortem · 人工闸 status 反引号解析事故

| 项 | 内容 |
| --- | --- |
| 日期 | 2026-06-30 |
| 产品包 | `@cyning/harness` |
| 版本 | 2.1.0 → 2.1.1 |
| 类型 | bugfix / 回归风险 |
| 触发任务 | `task_fix_harness_verify_status_parsing_v1` |

## 现象

`npx @cyning/harness verify` 在 task 表的 `### 人工闸` 中，将 status 字段的 Markdown 反引号一并解析，导致：

- task 表写 `HG-AUDIT-R1 | approved` 时，内部状态为 `` `approved` ``
- `evaluateMayStart30` 判断 `audit?.status !== 'approved'`，返回阻塞
- CLI 输出「HG-AUDIT-R1 非 approved（须维护者签 task 表）」，即使 task 表已明确 approved

## 根因

### 1. `lib/task-meta.js` 的 `normalizeCell` 只去星号没去反引号

```javascript
// 修复前
function normalizeCell(cell) {
  return cell.replace(/\*/g, '').trim();
}
```

### 2. `wizard/gate-check.sh` 的 `gate_status` / `gate_blocks` 同样只去星号

```bash
# 修复前
awk -F'|' -v g="$gate" '
  ...
  gsub(/\*/, "", $3)
  ...
'
```

### 3. 测试用例未覆盖带反引号的 status

现有 `test/verify.test.js` 的 `writeTaskWithGate` 直接写 `approved`（无反引号），未模拟真实 task 表中 `` `approved` `` 的格式。

## 修复

### `lib/task-meta.js`

```javascript
function normalizeCell(cell) {
  return cell.replace(/[`\*]/g, '').trim();
}
```

### `wizard/gate-check.sh`

```bash
awk -F'|' -v g="$gate" '
  ...
  gsub(/[`*]/, "", $3)
  ...
'
```

> **注意**：awk 字符类中写 `` [`\*] `` 会导致正则语法错误（`illegal primary in regular expression`），因为 awk 中反斜杠在字符类内有特殊处理。应使用 `` [`*] ``。

## 教训

1. **Markdown 表格的格式化符号必须被 normalize**
   - status 字段常见写法：`` `approved` ``、`*approved*`、`` **`approved`** ``
   - 解析时必须统一去除：反引号、星号、首尾空白

2. **测试用例必须覆盖真实 task 表格式**
   - 不要只测裸字符串 `approved`
   - 必须测 `` `approved` ``、`` **`approved`** ``、`*approved*` 等变体

3. **awk 与 JavaScript 正则差异**
   - JS：`/[`\\*]/g` 正确
   - awk：`` [`\*] `` 报错，应写 `` [`*] ``
   - 修改 shell 脚本后必须用 `bash -n` 或实际运行验证

4. **发布前必须跑完整测试**
   - `npm test` 在修复前是 62/72 失败，修复后是 72/72 通过
   - 若发布前未跑测试，此 bug 会进入 2.1.0

## 预防措施

- [ ] 在 `test/verify.test.js` 中增加带反引号的 gate 状态测试
- [ ] 在 `test/audit.test.js` 中同样增加反引号覆盖
- [ ] 将 `normalizeCell` 的测试独立为一个单元测试
- [ ] 后续修改 `wizard/*.sh` 时，先用 `bash -n` 检查语法

## 关联提交

- `9f5761c` fix(verify): strip backticks from gate status cells
- tag: `v2.1.1`
