import fs from 'node:fs';
import path from 'node:path';
import {
  CHECKBOX_RE,
  KNOWN_STATUS_TOKENS,
  PLACEHOLDER_RE,
  STATUS_RE,
  extractSection,
  extractTaskSlug,
  normalizeSlug,
  parseHarnessMeta,
} from './task-meta.js';

/**
 * 绝对本机路径：/Users/<seg> · /home/<seg> · /root/<seg> · C:\Users\<seg>
 * 要求 <seg> 至少一个非 `/\s`` 字符 —— 规则文档里的泛型写法（`/Users/`）不触发。
 */
const ABS_PATH_RE = /(\/(?:Users|home|root)\/[^\s/`\\]|[A-Za-z]:\\Users\\[^\s`\\])/;
const FAILURE_HEADING_RE = /^#{2,4}\s.*(失败路径|failure_paths)/i;
/** G4 触发：行首 ### R0（可带后缀） */
const R0_HEADING_RE = /^###\s+R0(\b|[^\d]|$)/m;
/** G4 触发（叠加）：行首 ##/### 标题含「思考轮」 */
const THINK_HEADING_RE = /^#{2,3}\s+.*思考轮/m;
/** 槽位标题：### Rn（前缀宽容） */
const RN_HEADING_RE = /^###\s+R(\d+)\b/gm;
/** 控制表字段行：| `field` | / | **field** | / | field | */
const CTRL_FIELD_RE = /^\|\s*`?\*{0,2}([a-z_]+)\*{0,2}`?\s*\|\s*(.*?)\s*\|/i;

function err(rule, message, line) {
  return line ? { rule, message, line } : { rule, message };
}
function warn(rule, message, line) {
  return line ? { rule, message, line } : { rule, message };
}

function parseControlFields(lines) {
  const fields = {};
  for (const l of lines) {
    const m = l.match(CTRL_FIELD_RE);
    if (!m) continue;
    const key = m[1].toLowerCase();
    let val = m[2].trim();
    if (val.startsWith('`') && val.endsWith('`')) val = val.slice(1, -1).trim();
    fields[key] = val;
  }
  return fields;
}

function isEmptyCtrlValue(val) {
  if (val == null) return true;
  const v = String(val).trim();
  return v === '' || v === '—' || v === '-' || v === '–';
}

/**
 * G4 · 思考轮结构规则组（条件触发）。
 * 触发优先：存在 ### R0；叠加：行首 ##/### 含「思考轮」。
 * 正文提及「思考轮」不触发。
 */
function lintThinkingRounds(content, lines, errors, warnings) {
  const hasR0 = R0_HEADING_RE.test(content);
  const hasThinkHeading = THINK_HEADING_RE.test(content);
  const triggered = hasR0 || hasThinkHeading;

  if (!triggered) {
    warnings.push(
      warn('W4', '无思考轮节（SPEC 承载 / bugfix 轨合法豁免 · 有节则查 R0–R5 与控制表）'),
    );
    return;
  }

  // E8 · R0–R5 槽位齐全
  const found = new Set();
  const rnRe = new RegExp(RN_HEADING_RE.source, 'gm');
  let m;
  while ((m = rnRe.exec(content)) !== null) {
    found.add(Number(m[1]));
  }
  const missing = [];
  for (let i = 0; i <= 5; i += 1) {
    if (!found.has(i)) missing.push(`R${i}`);
  }
  if (missing.length) {
    errors.push(err('E8', `思考轮槽位不全，缺：${missing.join(', ')}`));
  }

  // E9 / E10 · 控制表字段
  const fields = parseControlFields(lines);
  const required = ['actual_last_round', 'early_stop', 'residual_risks'];
  const missFields = required.filter((k) => !(k in fields));
  if (missFields.length) {
    errors.push(err('E9', `思考轮控制表缺字段：${missFields.join(', ')}`));
  }

  const early = (fields.early_stop || '').toLowerCase();
  if (early === 'yes' && isEmptyCtrlValue(fields.early_stop_reason)) {
    errors.push(err('E10', 'early_stop=yes 时 early_stop_reason 须非空'));
  }

  // W5 · R6+ 须有 round_extension_note
  const hasR6Plus = [...found].some((n) => n >= 6);
  if (hasR6Plus && isEmptyCtrlValue(fields.round_extension_note)) {
    warnings.push(warn('W5', '存在 ### R6+ 但 round_extension_note 缺失或为空'));
  }
}

/**
 * task lint · task md 结构闸（G1）+ 文本规则包（G3）+ 思考轮结构（G4）。
 * 纯只读；E 级 → ok:false（CLI exit 2），W 级仅提醒。
 */
export function lintTaskFile(filePath, options = {}) {
  const { cwd = process.cwd() } = options;
  const abs = path.resolve(cwd, filePath);

  if (!fs.existsSync(abs)) {
    const e = new Error(`task 文件不存在: ${filePath}`);
    e.exitCode = 1;
    throw e;
  }

  const content = fs.readFileSync(abs, 'utf8');
  const lines = content.split('\n');
  const errors = [];
  const warnings = [];

  // E1 · Harness 元信息 + task_slug
  const meta = parseHarnessMeta(content);
  if (!content.includes('## Harness 元信息')) {
    errors.push(err('E1', '缺 ## Harness 元信息 节'));
  } else if (!meta.task_slug) {
    errors.push(err('E1', 'Harness 元信息表缺 task_slug'));
  }

  // E2 / W1 · 状态行
  const statusIdx = lines.findIndex((l) => STATUS_RE.test(l));
  if (statusIdx === -1) {
    errors.push(err('E2', '缺 > **状态** 行'));
  } else {
    const token = lines[statusIdx].match(STATUS_RE)[1].toLowerCase();
    if (!KNOWN_STATUS_TOKENS.has(token)) {
      warnings.push(warn('W1', `状态 token 不在已知词表: ${token}`, statusIdx + 1));
    }
  }

  // E3 · 验收标准 + 勾选项
  const acceptance = extractSection(content, '## 验收标准', '\n##');
  if (!acceptance) {
    errors.push(err('E3', '缺 ## 验收标准 节'));
  } else if (!CHECKBOX_RE.test(acceptance)) {
    errors.push(err('E3', '## 验收标准 节内无任何勾选项（- [ ] / - [x]）'));
  }

  // E4 · 失败路径节（标题含 失败路径 或 failure_paths · 形式宽容）
  if (!lines.some((l) => FAILURE_HEADING_RE.test(l))) {
    errors.push(err('E4', '缺失败路径节（## 失败路径 或 failure_paths）'));
  }

  // E5 / W3 · 自检结论
  const selfCheck = extractSection(content, '### 自检结论', '\n##');
  if (!selfCheck) {
    errors.push(err('E5', '缺 ### 自检结论 节'));
  } else {
    const substantive = selfCheck
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !PLACEHOLDER_RE.test(l));
    if (substantive.length === 0) {
      warnings.push(warn('W3', '自检结论为占位符（draft 期合法 · close 前须回填）'));
    }
  }

  // E6 · 绝对本机路径（带行号）
  lines.forEach((l, i) => {
    if (ABS_PATH_RE.test(l)) {
      errors.push(err('E6', `绝对本机路径: ${l.trim().slice(0, 100)}`, i + 1));
    }
  });

  // E7 · slug 一致（下划线/连字符等价）
  if (meta.task_slug) {
    const fileSlug = extractTaskSlug(abs);
    if (normalizeSlug(meta.task_slug) !== normalizeSlug(fileSlug)) {
      errors.push(
        err('E7', `slug 不一致: 文件名 ${fileSlug} ≠ 元信息 task_slug ${meta.task_slug}`),
      );
    }
  }

  // W2 · 人工闸节
  if (!content.includes('### 人工闸')) {
    warnings.push(warn('W2', '缺 ### 人工闸 节（轻量 task 可忽略本提醒）'));
  }

  // G4 · 思考轮结构（条件触发）
  lintThinkingRounds(content, lines, errors, warnings);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    file: abs,
    slug: meta.task_slug ?? extractTaskSlug(abs),
  };
}
