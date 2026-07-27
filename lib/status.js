import fs from 'node:fs';
import path from 'node:path';
import {
  evaluateMayStart30,
  extractHatsFromInvokeFilename,
  findReview,
  listActiveTasks,
  normalizeSlug,
  parseHarnessMeta,
  parseHumanGates,
  STATUS_RE,
} from './task-meta.js';
import { loadEvents } from './graph-hgm.js';
import { verifyTarget } from './verify.js';

export const OBS_STATUS_SCHEMA = 'obs_status.v1';

/**
 * 聚合单 task 过程可观测投影（只读 · 不替代 verify）。
 */
export function buildTaskStatus(target, taskFile, options = {}) {
  const { check = false } = options;
  const absTask = path.isAbsolute(taskFile)
    ? taskFile
    : path.join(target, taskFile);

  if (!fs.existsSync(absTask)) {
    const err = new Error(`task 文件不存在: ${taskFile}`);
    err.exitCode = 1;
    throw err;
  }

  const content = fs.readFileSync(absTask, 'utf8');
  const meta = parseHarnessMeta(content);
  const gates = parseHumanGates(content);
  const gateEval = evaluateMayStart30(gates);
  const relTask = toRel(target, absTask);
  const slug = meta.task_slug || path.basename(absTask, '.md');
  const status = extractTaskStatus(content) || 'unknown';

  const review = findReview(target, absTask);
  const closeFound = findCloseReview(target, absTask);
  const lastInvoke = findLastInvoke(target, slug);
  const hgm = summarizeHgm(target, slug);
  const kpi = hasKpiSection(content);

  const blockers = [];
  for (const g of gates) {
    if (g.status !== 'approved' && String(g.blocks_hats || '').includes('30')) {
      blockers.push(`${g.id}=${g.status}`);
    }
  }
  if (blockers.length === 0 && !gateEval.may_start_30 && gateEval.blocked_reason) {
    blockers.push(gateEval.blocked_reason);
  }

  const verifyPreview = runVerifyPreview(target, relTask);
  const nextHint = buildNextHint({
    mayStart30: gateEval.may_start_30,
    blockers,
    reviewFound: review.found,
    verifyOk: verifyPreview.ok,
  });

  const payload = {
    schema_version: OBS_STATUS_SCHEMA,
    task_slug: slug,
    task_path: relTask,
    status,
    gates: gates.map((g) => ({
      id: g.id,
      status: g.status,
      blocks_hats: g.blocks_hats,
    })),
    may_start_30: gateEval.may_start_30,
    blockers,
    last_invoke: {
      path: lastInvoke.path,
      hat_id: lastInvoke.hat_id,
    },
    reviews: {
      R1: review.found && review.rounds.some((r) => r >= 1),
      CLOSE: closeFound,
    },
    verify_preview: {
      ok: verifyPreview.ok,
      reason: verifyPreview.reason,
    },
    hgm: {
      event_count: hgm.event_count,
      last_at: hgm.last_at,
    },
    kpi_section: kpi,
    next_hint: nextHint,
  };

  const warnings = [];
  if (check) {
    if (!review.found) {
      warnings.push('WARN: status --check · missing R<n> review（P0 不改 exit · 硬语义属 P2）');
    }
    if (!gateEval.may_start_30) {
      warnings.push(
        `WARN: status --check · may_start_30=false · ${gateEval.blocked_reason || blockers.join('; ') || 'blocked'}`,
      );
    }
  }

  return { payload, warnings };
}

/**
 * 无 --task：active 一行摘要列表。
 */
export function buildStatusList(target) {
  const files = listActiveTasks(target);
  return files.map((taskFile) => {
    const abs = path.join(target, taskFile);
    const content = fs.readFileSync(abs, 'utf8');
    const meta = parseHarnessMeta(content);
    const gates = parseHumanGates(content);
    const gateEval = evaluateMayStart30(gates);
    const pending = gates.find(
      (g) => g.status !== 'approved' && String(g.blocks_hats || '').includes('30'),
    );
    return {
      task_slug: meta.task_slug || path.basename(taskFile, '.md'),
      task_path: taskFile.replace(/\\/g, '/'),
      status: extractTaskStatus(content) || 'unknown',
      blocking_gate: pending ? `${pending.id}=${pending.status}` : null,
      may_start_30: gateEval.may_start_30,
    };
  });
}

export function formatStatusHuman(payload) {
  const gates =
    payload.gates.length === 0
      ? '  (none)'
      : payload.gates
          .map((g) => `  - ${g.id}=${g.status}  blocks=${g.blocks_hats || '—'}`)
          .join('\n');
  const blockers =
    payload.blockers.length === 0 ? '—' : payload.blockers.join('; ');
  const li = payload.last_invoke;
  const lastInvoke =
    li.path == null
      ? '—  hat=—'
      : `${li.path}  hat=${li.hat_id ?? '—'}`;
  const hgmCount =
    payload.hgm.event_count == null ? 'unknown' : String(payload.hgm.event_count);
  const hgmLast = payload.hgm.last_at ?? '—';
  const vp = payload.verify_preview.ok ? 'PASS' : 'BLOCK';

  return [
    `task: ${payload.task_slug}`,
    `path: ${payload.task_path}`,
    `status: ${payload.status}`,
    `gates:`,
    gates,
    `may_start_30: ${payload.may_start_30}`,
    `blockers: ${blockers}`,
    `last_invoke: ${lastInvoke}`,
    `reviews: R1=${payload.reviews.R1 ? 'yes' : 'no'}  CLOSE=${payload.reviews.CLOSE ? 'yes' : 'no'}`,
    `verify_preview: ${vp}  reason=${payload.verify_preview.reason}`,
    `hgm: events=${hgmCount}  last_at=${hgmLast}`,
    `kpi_section: ${payload.kpi_section ? 'present' : 'absent'}`,
    `next_hint: ${payload.next_hint}`,
    ``,
    `NOTE: verify_preview 为只读预览；30 前仍须正式运行 harness verify。`,
  ].join('\n');
}

export function formatStatusListHuman(rows) {
  if (rows.length === 0) {
    return 'active tasks: (none)\n';
  }
  const lines = ['active tasks:'];
  for (const r of rows) {
    lines.push(
      `  - ${r.task_slug}  status=${r.status}  blocking=${r.blocking_gate || '—'}  may_start_30=${r.may_start_30}  path=${r.task_path}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

function runVerifyPreview(target, taskFile) {
  try {
    const result = verifyTarget(target, {
      taskFile,
      allowNoReview: false,
      allowLintFail: true,
      allowInvokeGap: true,
    });
    if (result.ok) {
      return {
        ok: true,
        reason: '只读预览 PASS（非正式 verify · 30 前仍须正式跑）',
      };
    }
    return {
      ok: false,
      reason: truncateOneLine(result.reason || 'BLOCK'),
    };
  } catch (err) {
    return {
      ok: false,
      reason: truncateOneLine(err.message || String(err)),
    };
  }
}

function findLastInvoke(target, slug) {
  const empty = { path: null, hat_id: null };
  if (!slug) return empty;

  const candidates = [
    path.join(target, 'docs/harness/invokes/by-task', slug),
    path.join(target, 'docs/harness/invokes/by-task', normalizeSlug(slug)),
  ];
  // 亦试下划线变体
  if (slug.includes('-')) {
    candidates.push(
      path.join(target, 'docs/harness/invokes/by-task', slug.replace(/-/g, '_')),
    );
  }

  let best = null;
  for (const dir of candidates) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.md')) continue;
      const abs = path.join(dir, name);
      const st = fs.statSync(abs);
      if (!best || st.mtimeMs > best.mtimeMs) {
        const hats = [...extractHatsFromInvokeFilename(name)];
        const hatId =
          hats.find((h) => h !== 'CLOSE') || hats[0] || null;
        best = {
          mtimeMs: st.mtimeMs,
          path: path
            .relative(target, abs)
            .split(path.sep)
            .join('/'),
          hat_id: hatId,
        };
      }
    }
  }
  if (!best) return empty;
  return { path: best.path, hat_id: best.hat_id };
}

/**
 * CLOSE 审查文：文件名含 _audit_CLOSE_（与 R<n> 并存）。
 */
export function findCloseReview(target, taskFile) {
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  if (!fs.existsSync(reviewsDir)) return false;

  const stripVer = (s) => s.replace(/_v\d+$/, '');
  const base = stripVer(path.basename(taskFile, '.md'));
  const CLOSE_RE = /^(task_.+?)_audit_CLOSE_.*\.md$/i;

  for (const name of fs.readdirSync(reviewsDir)) {
    const m = name.match(CLOSE_RE);
    if (!m) continue;
    if (stripVer(m[1]) === base) return true;
  }
  return false;
}

function summarizeHgm(target, slug) {
  try {
    const events = loadEvents(target);
    if (!events.length) {
      return { event_count: 0, last_at: null };
    }
    const norm = normalizeSlug(slug || '');
    const related = events.filter((e) => {
      const subj = String(e.subject || '');
      const dataSlug = e.data?.task_slug ? normalizeSlug(e.data.task_slug) : '';
      if (dataSlug && dataSlug === norm) return true;
      if (norm && subj.includes(slug)) return true;
      if (norm && normalizeSlug(subj).includes(norm)) return true;
      return false;
    });
    // 无 slug 匹配时：不谎报全仓事件为本 task；标 null
    if (!slug || related.length === 0) {
      return { event_count: null, last_at: null };
    }
    const last = related[related.length - 1];
    return {
      event_count: related.length,
      last_at: last.occurred_at || null,
    };
  } catch {
    return { event_count: null, last_at: null };
  }
}

function hasKpiSection(content) {
  return /^###\s*KPI/m.test(content) || /###\s*KPI（00）/.test(content);
}

function extractTaskStatus(content) {
  const m = content.match(STATUS_RE);
  return m ? m[1].toLowerCase() : null;
}

function buildNextHint({ mayStart30, blockers, reviewFound, verifyOk }) {
  if (!mayStart30) {
    return `签收阻塞闸后再开 30（${blockers[0] || '见 gates'}）`;
  }
  if (!reviewFound) {
    return '补 20 R1 审查文后再 verify / 开 30';
  }
  if (!verifyOk) {
    return '先跑正式 harness verify 消除 BLOCK，再开 30';
  }
  return '可跑 harness verify --task … 后开 30（status 不替代 verify）';
}

function toRel(target, abs) {
  const rel = path.relative(target, abs);
  if (!rel || rel.startsWith('..')) return abs.replace(/\\/g, '/');
  return rel.split(path.sep).join('/');
}

function truncateOneLine(s) {
  return String(s).replace(/\s+/g, ' ').trim().slice(0, 200);
}
