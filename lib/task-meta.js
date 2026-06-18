import fs from 'node:fs';
import path from 'node:path';

const META_FIELD_RE = /\|\s*\*\*([^*]+)\*\*\s*\|\s*`([^`]+)`/;
const GATE_ROW_RE = /^\|\s*(?:\*\*)?([^*|]+?)(?:\*\*)?\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]*)\|/;

/**
 * 从 task Markdown 解析 Harness 元信息表（反引号包裹的值）。
 */
export function parseHarnessMeta(content) {
  const meta = {};
  const section = extractSection(content, '## Harness 元信息', '###');
  if (!section) return meta;

  for (const line of section.split('\n')) {
    const match = line.match(META_FIELD_RE);
    if (!match) continue;
    const key = match[1].trim();
    meta[key] = match[2].trim();
  }
  return meta;
}

/**
 * 解析 ### 人工闸 表。
 */
export function parseHumanGates(content) {
  const section = extractSection(content, '### 人工闸', '##');
  if (!section) return [];

  const gates = [];
  for (const line of section.split('\n')) {
    const match = line.match(GATE_ROW_RE);
    if (!match) continue;
    const id = match[1].trim();
    if (!id.startsWith('HG-') || id.includes('human_gate')) continue;
    gates.push({
      id,
      status: normalizeCell(match[2]),
      blocks_hats: normalizeCell(match[3]),
      note: normalizeCell(match[4]),
    });
  }
  return gates;
}

/**
 * 机械判定 may_start_30（与 gate-check.sh 一致）。
 */
export function evaluateMayStart30(gates) {
  const byId = Object.fromEntries(gates.map((g) => [g.id, g]));
  const draft = byId['HG-TASK-DRAFT'];
  const audit = byId['HG-AUDIT-R1'];
  const graph = byId['HG-GRAPH-MODULES'];

  if (audit?.status !== 'approved') {
    return {
      may_start_30: false,
      blocked_reason: 'HG-AUDIT-R1 非 approved（须维护者签 task 表）',
    };
  }

  if (
    draft?.status !== 'approved' &&
    draft?.blocks_hats?.includes('30')
  ) {
    return {
      may_start_30: false,
      blocked_reason: 'HG-TASK-DRAFT pending 且 blocks 30',
    };
  }

  if (graph?.status === 'pending') {
    return {
      may_start_30: false,
      blocked_reason: 'HG-GRAPH-MODULES pending',
    };
  }

  return { may_start_30: true, blocked_reason: null };
}

/**
 * 解析 Projects/ 前缀路径；需 workspaceRoot 才 resolve。
 */
export function resolveInvokePath(rawPath, { target, workspaceRoot } = {}) {
  if (!rawPath) {
    return { resolved: null, warnings: [] };
  }

  const warnings = [];

  if (rawPath.startsWith('Projects/')) {
    if (!workspaceRoot) {
      warnings.push(
        `entry_invoke 路径以 Projects/ 开头但未提供 --workspace-root：${rawPath}`,
      );
      return { resolved: null, warnings };
    }
    const abs = path.join(workspaceRoot, rawPath.replace(/^Projects\//, ''));
    if (!fs.existsSync(abs)) {
      warnings.push(`entry_invoke 路径不存在：${rawPath}`);
    }
    return { resolved: abs, warnings };
  }

  if (path.isAbsolute(rawPath)) {
    if (!fs.existsSync(rawPath)) {
      warnings.push(`entry_invoke 路径不存在：${rawPath}`);
    }
    return { resolved: rawPath, warnings };
  }

  const abs = path.resolve(target ?? process.cwd(), rawPath);
  if (!fs.existsSync(abs)) {
    warnings.push(`entry_invoke 路径不存在（相对 target）：${rawPath}`);
  }
  return { resolved: abs, warnings };
}

/**
 * 查找最新 R1 审查文（相对 target）。
 */
export function findReviewPath(target, taskFile) {
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  if (!fs.existsSync(reviewsDir)) return null;

  const taskBase = path.basename(taskFile, '.md');
  const prefix = `${taskBase}_audit_R1_`;

  let best = null;
  let bestMtime = 0;

  for (const name of fs.readdirSync(reviewsDir)) {
    if (!name.startsWith(prefix) || !name.endsWith('.md')) continue;
    const full = path.join(reviewsDir, name);
    const mtime = fs.statSync(full).mtimeMs;
    if (mtime > bestMtime) {
      bestMtime = mtime;
      best = path.relative(target, full).replace(/\\/g, '/');
    }
  }

  return best;
}

/**
 * 聚合单 task 的 Agent handoff 结果。
 */
export function buildTaskHandoff(target, taskFile, options = {}) {
  const { workspaceRoot } = options;
  const absTask = path.isAbsolute(taskFile)
    ? taskFile
    : path.join(target, taskFile);

  const content = fs.readFileSync(absTask, 'utf8');
  const meta = parseHarnessMeta(content);
  const gates = parseHumanGates(content);
  const gateEval = evaluateMayStart30(gates);

  const warnings = [];
  const entry30Raw = meta.entry_invoke_30 ?? null;
  const entry20Raw = meta.entry_invoke_20 ?? null;

  const entry30 = resolveInvokePath(entry30Raw, { target, workspaceRoot });
  const entry20 = resolveInvokePath(entry20Raw, { target, workspaceRoot });
  warnings.push(...entry30.warnings, ...entry20.warnings);

  const reviewPath = findReviewPath(target, taskFile);

  return {
    task: path.basename(taskFile),
    task_path: taskFile.replace(/\\/g, '/'),
    task_slug: meta.task_slug ?? null,
    may_start_30: gateEval.may_start_30,
    blocked_reason: gateEval.blocked_reason,
    review_path: reviewPath,
    entry_invoke_20: entry20Raw,
    entry_invoke_20_resolved: entry20.resolved,
    entry_invoke_30: entry30Raw,
    entry_invoke_30_resolved: entry30.resolved,
    next_hat: gateEval.may_start_30 ? '30' : null,
    agent_preamble: gateEval.may_start_30
      ? '首输出 GATE_VERIFY 闸扫描表，再读 entry_invoke_30 开 30 帽。'
      : null,
    warnings,
    gates: gates.map((g) => ({
      id: g.id,
      status: g.status,
      blocks_hats: g.blocks_hats,
    })),
  };
}

/**
 * 扫描 target 下 active task 列表。
 */
export function listActiveTasks(target) {
  const activeDir = path.join(target, 'docs/tasks/active');
  if (!fs.existsSync(activeDir)) return [];

  return fs
    .readdirSync(activeDir)
    .filter((f) => f.startsWith('task_') && f.endsWith('.md'))
    .map((f) => path.join('docs/tasks/active', f).replace(/\\/g, '/'))
    .sort();
}

function extractSection(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) return null;

  let end = content.length;
  if (endMarker) {
    const next = content.indexOf(endMarker, start + startMarker.length);
    if (next !== -1) end = next;
  }
  return content.slice(start, end);
}

function normalizeCell(cell) {
  return cell.replace(/\*/g, '').trim();
}
