import { normalizeSlug } from './task-meta.js';
import { loadEvents } from './graph-hgm.js';

/**
 * 事件是否归属某 task（与 status.hgm 摘要同一匹配规则）。
 */
export function eventMatchesTaskSlug(event, slug) {
  if (!slug) return false;
  const norm = normalizeSlug(slug);
  const subj = String(event?.subject || '');
  const dataSlug = event?.data?.task_slug
    ? normalizeSlug(event.data.task_slug)
    : '';
  if (dataSlug && dataSlug === norm) return true;
  if (subj.includes(slug)) return true;
  if (normalizeSlug(subj).includes(norm)) return true;
  return false;
}

/**
 * 按 occurred_at 已排序的事件中过滤出 task 相关子集（保持升序）。
 */
export function filterEventsForTask(events, slug) {
  if (!slug || !Array.isArray(events)) return [];
  return events.filter((e) => eventMatchesTaskSlug(e, slug));
}

/**
 * status.hgm 摘要：无全仓事件 → 0；有事件但无匹配 → null；有匹配 → count+last_at。
 */
export function summarizeTaskHgm(target, slug) {
  try {
    const events = loadEvents(target);
    if (!events.length) {
      return { event_count: 0, last_at: null };
    }
    const related = filterEventsForTask(events, slug);
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

/**
 * 事件行 summary（人读一行）。
 */
export function summarizeEvent(event) {
  const d = event?.data || {};
  const type = event?.type || 'Unknown';
  switch (type) {
    case 'TaskCreated':
      return `created status=${d.status || '—'} title=${d.title || '—'}`;
    case 'TaskStatusChanged':
      return `status→${d.new_status || '—'}${d.reason ? ` (${d.reason})` : ''}`;
    case 'GateStatusChanged':
      return `${d.human_gate_id || 'gate'}: ${d.old_status || '?'}→${d.new_status || '?'}`;
    case 'HumanGateRejected':
      return `rejected ${d.human_gate_id || 'gate'} → ${d.returns_to_status || 'draft'}`;
    case 'ReviewProduced':
      return `review R${d.round ?? '?'} hat=${d.hat_id || '—'}`;
    case 'InvokeRecorded':
      return `invoke hat=${d.hat_id || '—'} path=${d.path || '—'}`;
    case 'GateCheckRun':
      return `gate-check ${d.ok === false ? 'FAIL' : 'PASS'}${d.reason ? ` · ${d.reason}` : ''}`;
    default:
      return Object.keys(d).length
        ? JSON.stringify(d).slice(0, 120)
        : type;
  }
}
