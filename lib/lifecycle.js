import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { resolveHarnessRoot } from './paths.js';

const SEVERITIES = new Set(['block', 'warn']);

/**
 * 轻量结构校验（不引入 Ajv）：对齐 schema/lifecycle.v1.schema.json 必填约束。
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateLifecycle(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['lifecycle 根须为 object'] };
  }
  if (typeof data.version !== 'string' || !data.version.trim()) {
    errors.push('缺 version（string）');
  }
  if (!Array.isArray(data.states) || data.states.length === 0) {
    errors.push('缺 states[] 或为空');
  } else {
    data.states.forEach((s, i) => {
      if (!s || typeof s.id !== 'string' || !s.id.trim()) {
        errors.push(`states[${i}] 缺 id`);
      }
    });
  }
  if (!Array.isArray(data.transitions) || data.transitions.length === 0) {
    errors.push('缺 transitions[] 或为空');
  } else {
    data.transitions.forEach((t, i) => {
      if (!t || typeof t.id !== 'string' || !t.id.trim()) {
        errors.push(`transitions[${i}] 缺 id`);
      }
      if (!Array.isArray(t?.from) || t.from.length === 0) {
        errors.push(`transitions[${i}] 缺 from[]`);
      }
      if (typeof t?.to !== 'string' || !t.to.trim()) {
        errors.push(`transitions[${i}] 缺 to`);
      }
      if (!Array.isArray(t?.guards)) {
        errors.push(`transitions[${i}] 缺 guards[]`);
      } else {
        t.guards.forEach((g, j) => {
          if (!g || typeof g.id !== 'string') {
            errors.push(`transitions[${i}].guards[${j}] 缺 id`);
          }
          if (!g || typeof g.command_or_check !== 'string') {
            errors.push(`transitions[${i}].guards[${j}] 缺 command_or_check`);
          }
          if (!g || !SEVERITIES.has(g.severity)) {
            errors.push(
              `transitions[${i}].guards[${j}] severity 须为 block|warn（当前: ${g?.severity}）`,
            );
          }
        });
      }
    });
  }
  return { ok: errors.length === 0, errors };
}

/**
 * 加载并校验 lifecycle.yaml。
 * @param {{ harnessRoot?: string, filePath?: string }} [options]
 */
export function loadLifecycle(options = {}) {
  const harnessRoot = options.harnessRoot ?? resolveHarnessRoot();
  const filePath =
    options.filePath ?? path.join(harnessRoot, 'harness', 'lifecycle.yaml');

  if (!fs.existsSync(filePath)) {
    const e = new Error(`lifecycle.yaml 不存在: ${filePath}`);
    e.exitCode = 1;
    throw e;
  }

  let data;
  try {
    data = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    const e = new Error(`lifecycle.yaml 解析失败: ${err.message}`);
    e.exitCode = 1;
    throw e;
  }

  const v = validateLifecycle(data);
  if (!v.ok) {
    const e = new Error(`lifecycle.yaml 校验失败:\n  - ${v.errors.join('\n  - ')}`);
    e.exitCode = 1;
    e.validationErrors = v.errors;
    throw e;
  }

  return { data, filePath, harnessRoot };
}

/**
 * 人读表。
 */
export function formatLifecycleShow(data) {
  const lines = [
    `lifecycle v${data.version}`,
    '',
    '## states',
    ...data.states.map((s) => `- ${s.id}${s.note ? ` · ${s.note}` : ''}`),
    '',
    '## transitions',
  ];
  for (const t of data.transitions) {
    lines.push(`### ${t.id} · ${t.from.join('|')} → ${t.to}${t.hat ? ` · hat=${t.hat}` : ''}`);
    if (t.description) lines.push(`  ${t.description}`);
    for (const g of t.guards) {
      const allow = g.allow_flag ? ` · allow=${g.allow_flag}` : '';
      lines.push(`  - [${g.severity}] ${g.id}: ${g.command_or_check}${allow}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
