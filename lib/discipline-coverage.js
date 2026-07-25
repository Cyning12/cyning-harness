import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { resolveHarnessRoot } from './paths.js';

const STATUSES = new Set(['mechanical', 'partial', 'prompt-only']);
const GAP_STATUSES = new Set(['open', 'closed', 'deferred']);

/**
 * 轻量结构校验（对齐 schema/discipline-coverage.v1.schema.json 必填约束）。
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateDisciplineCoverage(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { ok: false, errors: ['根须为 object'] };
  }
  if (typeof data.version !== 'string' || !data.version.trim()) {
    errors.push('缺 version');
  }
  if (typeof data.as_of_package_version !== 'string' || !data.as_of_package_version.trim()) {
    errors.push('缺 as_of_package_version');
  }
  if (typeof data.scope !== 'string' || !data.scope.trim()) {
    errors.push('缺 scope');
  }
  if (!Array.isArray(data.statements) || data.statements.length === 0) {
    errors.push('缺 statements[] 或为空');
  } else {
    data.statements.forEach((s, i) => {
      if (!s || typeof s.id !== 'string' || !s.id.trim()) {
        errors.push(`statements[${i}] 缺 id`);
      }
      if (!s || typeof s.source !== 'string') {
        errors.push(`statements[${i}] 缺 source`);
      }
      if (!s || typeof s.summary !== 'string') {
        errors.push(`statements[${i}] 缺 summary`);
      }
      if (!s || !STATUSES.has(s.status)) {
        errors.push(`statements[${i}] status 非法: ${s?.status}`);
      }
    });
  }
  if (data.gaps != null) {
    if (!Array.isArray(data.gaps)) {
      errors.push('gaps 须为 array');
    } else {
      data.gaps.forEach((g, i) => {
        if (!g || typeof g.id !== 'string') errors.push(`gaps[${i}] 缺 id`);
        if (!g || typeof g.title !== 'string') errors.push(`gaps[${i}] 缺 title`);
        if (!g || !GAP_STATUSES.has(g.status)) {
          errors.push(`gaps[${i}] status 非法: ${g?.status}`);
        }
      });
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * 加载并校验 harness/discipline-coverage.yaml。
 */
export function loadDisciplineCoverage(options = {}) {
  const harnessRoot = options.harnessRoot ?? resolveHarnessRoot();
  const filePath =
    options.filePath ??
    path.join(harnessRoot, 'harness', 'discipline-coverage.yaml');

  if (!fs.existsSync(filePath)) {
    const e = new Error(`discipline-coverage.yaml 不存在: ${filePath}`);
    e.exitCode = 1;
    throw e;
  }

  let data;
  try {
    data = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    const e = new Error(`discipline-coverage.yaml 解析失败: ${err.message}`);
    e.exitCode = 1;
    throw e;
  }

  const v = validateDisciplineCoverage(data);
  if (!v.ok) {
    const e = new Error(
      `discipline-coverage.yaml 校验失败:\n  - ${v.errors.join('\n  - ')}`,
    );
    e.exitCode = 1;
    e.validationErrors = v.errors;
    throw e;
  }

  return { data, filePath, harnessRoot };
}
