import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { runTestCheck } from './audit.js';
import { resolveHarnessRoot } from './paths.js';
import { findReview, parseHumanGates } from './task-meta.js';
import { lintTaskFile } from './task-lint.js';
import { evaluateCloseChecks } from './task-close.js';

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

/** 已接线的守卫（未登记者 → unevaluated） */
const GUARD_ADAPTERS = {
  'HG-AUDIT-R1': evaluateHgGate('HG-AUDIT-R1'),
  'HG-TASK-DRAFT': evaluateHgGate('HG-TASK-DRAFT'),
  reviews_retention: evaluateReviewsRetention,
  audit_D5: evaluateAuditD5,
  task_lint: evaluateTaskLint,
  close_invoke: evaluateCloseGuard('close_invoke'),
  close_self_check: evaluateCloseGuard('close_self_check'),
  close_acceptance: evaluateCloseGuard('close_acceptance'),
  close_slug: evaluateCloseGuard('close_slug'),
  close_status: evaluateCloseGuard('close_status'),
  close_review: evaluateCloseGuard('close_review'),
};

function findRepoRootFromTask(absTask) {
  let cur = path.dirname(absTask);
  while (true) {
    if (path.basename(cur) === 'docs') return path.dirname(cur);
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function flagsAllow(flags, allowFlag) {
  if (allowFlag === '--allow-no-review') return Boolean(flags.allowNoReview);
  if (allowFlag === '--allow-lint-fail') return Boolean(flags.allowLintFail);
  if (allowFlag === '--allow-no-spec-review') return Boolean(flags.allowNoSpecReview);
  if (allowFlag === '--allow-invoke-gap') return Boolean(flags.allowInvokeGap);
  if (allowFlag === '--allow-unchecked') return Boolean(flags.allowUnchecked);
  return false;
}

function evaluateHgGate(gateId) {
  return ({ taskPath }) => {
    const content = fs.readFileSync(taskPath, 'utf8');
    const gates = parseHumanGates(content);
    const row = gates.find((g) => g.id === gateId);
    if (!row) {
      return { status: 'fail', detail: `闸表无 ${gateId} 行` };
    }
    if (row.status === 'approved') {
      return { status: 'pass', detail: `${gateId}=approved` };
    }
    return {
      status: 'fail',
      detail: `${gateId}=${row.status}（须 approved）`,
    };
  };
}

function evaluateReviewsRetention({ taskPath, target, flags }) {
  const review = findReview(target, taskPath);
  if (review.found) {
    return { status: 'pass', detail: review.latest };
  }
  if (flags.allowNoReview) {
    return {
      status: 'warn',
      detail: 'missing R<n> review（--allow-no-review）',
    };
  }
  return { status: 'fail', detail: 'missing R<n> review' };
}

function evaluateAuditD5({ taskPath, target }) {
  const result = runTestCheck(target, taskPath);
  if (result.ok) {
    return {
      status: 'pass',
      detail: result.skipped
        ? `D5 skipped · ${result.reason}`
        : result.reason,
    };
  }
  return { status: 'fail', detail: result.reason };
}

function evaluateTaskLint({ taskPath, target }) {
  try {
    const result = lintTaskFile(taskPath, { cwd: target });
    if (result.ok) {
      return { status: 'pass', detail: 'task lint PASS' };
    }
    const rules = (result.errors ?? []).map((e) => e.rule).join(',') || 'errors';
    return { status: 'fail', detail: `task lint FAIL · ${rules}` };
  } catch (err) {
    return { status: 'fail', detail: `task lint 异常: ${err.message}` };
  }
}

/** close_* · 复用 evaluateCloseChecks（与 task close 同语义） */
function evaluateCloseGuard(checkId) {
  return ({ taskPath, closeEval, target, cwd }) => {
    const ev =
      closeEval ?? evaluateCloseChecks(taskPath, { cwd: target ?? cwd });
    const c = ev.checks[checkId];
    if (!c) {
      return { status: 'fail', detail: `未知 close 检查: ${checkId}` };
    }
    return { status: c.status, detail: c.detail };
  };
}

/**
 * 转移 dry-run（引擎最小骨架 · v2.10+）。
 * 默认不写盘；无 --apply。
 *
 * @param {{
 *   transitionId: string,
 *   fromState: string,
 *   taskPath?: string,
 *   harnessRoot?: string,
 *   flags?: {
 *     allowNoReview?: boolean,
 *     allowLintFail?: boolean,
 *     allowNoSpecReview?: boolean,
 *     allowInvokeGap?: boolean,
 *     allowUnchecked?: boolean,
 *   },
 *   cwd?: string,
 * }} options
 */
export function dryRunTransition(options = {}) {
  const {
    transitionId,
    fromState,
    taskPath,
    harnessRoot,
    flags = {},
    cwd = process.cwd(),
  } = options;

  const { data } = loadLifecycle({ harnessRoot });
  const knownIds = data.transitions.map((t) => t.id);
  const transition = data.transitions.find((t) => t.id === transitionId);

  if (!transition) {
    return {
      engine: 'lifecycle-dry-run',
      lifecycle_doc_version: data.version,
      transition_id: transitionId ?? null,
      from: fromState ?? null,
      to: null,
      hat: null,
      structure_ok: false,
      guards: [],
      blocked: true,
      unevaluated_count: 0,
      detail: `未知 transition: ${transitionId}（已知: ${knownIds.join(', ')}）`,
      exitCode: 2,
    };
  }

  if (!fromState || !transition.from.includes(fromState)) {
    return {
      engine: 'lifecycle-dry-run',
      lifecycle_doc_version: data.version,
      transition_id: transition.id,
      from: fromState ?? null,
      to: transition.to,
      hat: transition.hat ?? null,
      structure_ok: false,
      guards: [],
      blocked: true,
      unevaluated_count: 0,
      detail: `from "${fromState}" ∉ ${JSON.stringify(transition.from)}`,
      exitCode: 2,
    };
  }

  const absTask = taskPath
    ? path.isAbsolute(taskPath)
      ? taskPath
      : path.resolve(cwd, taskPath)
    : null;

  if (taskPath && absTask && !fs.existsSync(absTask)) {
    const e = new Error(`--task 不可读: ${taskPath}`);
    e.exitCode = 1;
    throw e;
  }

  const canEval = Boolean(absTask);
  const target = absTask ? findRepoRootFromTask(absTask) ?? cwd : cwd;
  const closeEval =
    canEval && transition.id === 'close'
      ? evaluateCloseChecks(absTask, { cwd: target })
      : null;
  const guards = [];

  for (const g of transition.guards) {
    const adapter = GUARD_ADAPTERS[g.id];
    if (!canEval || !adapter) {
      guards.push({
        id: g.id,
        severity: g.severity,
        status: 'unevaluated',
        detail: !canEval ? '无 --task · 未求值' : '本波未接线 adapter',
        allow_flag: g.allow_flag ?? null,
      });
      continue;
    }

    const evaluated = adapter({
      taskPath: absTask,
      target,
      flags,
      guard: g,
      cwd,
      closeEval,
    });

    let status = evaluated.status;
    let detail = evaluated.detail ?? null;

    if (
      status === 'fail' &&
      g.allow_flag &&
      flagsAllow(flags, g.allow_flag)
    ) {
      status = 'warn';
      detail = `${detail ?? 'fail'}（${g.allow_flag} 豁免）`;
    }

    guards.push({
      id: g.id,
      severity: g.severity,
      status,
      detail,
      allow_flag: g.allow_flag ?? null,
    });
  }

  const unevaluated_count = guards.filter((g) => g.status === 'unevaluated').length;
  const blocked = guards.some(
    (g) => g.severity === 'block' && g.status === 'fail',
  );

  return {
    engine: 'lifecycle-dry-run',
    lifecycle_doc_version: data.version,
    transition_id: transition.id,
    from: fromState,
    to: transition.to,
    hat: transition.hat ?? null,
    structure_ok: true,
    guards,
    blocked,
    unevaluated_count,
    exitCode: blocked ? 2 : 0,
  };
}

/**
 * 人读 dry-run 报告。
 */
export function formatLifecycleDryRun(report) {
  const lines = [
    '=== Harness lifecycle dry-run ===',
    `engine: ${report.engine}`,
    `lifecycle: v${report.lifecycle_doc_version}`,
    `transition: ${report.transition_id} · ${report.from} → ${report.to}${report.hat ? ` · hat=${report.hat}` : ''}`,
    `structure_ok: ${report.structure_ok}`,
    `blocked: ${report.blocked}`,
    `unevaluated_count: ${report.unevaluated_count}`,
  ];
  if (report.detail) lines.push(`detail: ${report.detail}`);
  if (report.unevaluated_count > 0) {
    lines.push('WARN: 存在未求值守卫 · unevaluated ≠ pass（勿当作已通过）');
  }
  lines.push('', '## guards');
  for (const g of report.guards ?? []) {
    const d = g.detail ? ` · ${g.detail}` : '';
    lines.push(`- [${g.severity}] ${g.id}: ${g.status}${d}`);
  }
  lines.push('');
  lines.push(
    '注: dry-run 为旁路资格报告 · 不替代 verify / gate-check 作为 30 硬闸 · 非 G7 runner',
  );
  return lines.join('\n');
}
