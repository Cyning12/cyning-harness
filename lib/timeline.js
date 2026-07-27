import fs from 'node:fs';
import path from 'node:path';
import { parseHarnessMeta } from './task-meta.js';
import { loadEvents, ingestRepoIdempotent } from './graph-hgm.js';
import {
  filterEventsForTask,
  summarizeEvent,
} from './obs-hgm.js';

export const OBS_TIMELINE_SCHEMA = 'obs_timeline.v1';

/**
 * 构建 task 过程时间线（只读；默认不 ingest）。
 * @returns {{ payload, warnings, ingestResult? }}
 */
export function buildTaskTimeline(target, taskFile, options = {}) {
  const { limit = null, ingest = false, actor = 'system' } = options;
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
  const slug = meta.task_slug || path.basename(absTask, '.md');
  const relTask = toRel(target, absTask);

  let ingestResult = null;
  if (ingest) {
    try {
      ingestResult = ingestRepoIdempotent(target, {
        actor,
        source: 'timeline-cli',
        dryRun: false,
      });
    } catch (err) {
      const e = new Error(`timeline --ingest 失败: ${err.message}`);
      e.exitCode = 1;
      throw e;
    }
  }

  const all = loadEvents(target);
  let related = filterEventsForTask(all, slug);
  // loadEvents 已按 occurred_at 升序；再稳一次
  related = [...related].sort(
    (a, b) =>
      String(a.occurred_at || '').localeCompare(String(b.occurred_at || '')) ||
      String(a.event_id || '').localeCompare(String(b.event_id || '')),
  );

  const truncated =
    limit != null && Number.isFinite(limit) && limit >= 0
      ? related.slice(0, limit)
      : related;

  const events = truncated.map((e) => ({
    occurred_at: e.occurred_at ?? null,
    type: e.type ?? 'Unknown',
    subject: e.subject ?? '',
    summary: summarizeEvent(e),
    event_id: e.event_id ?? null,
  }));

  const warnings = [];
  if (related.length === 0) {
    warnings.push(
      'WARN: 无 HGM 数据（该 task 无匹配事件）。可先: npx @cyning/harness graph ingest --target <repo>；或本命令加 --ingest（显式写盘）',
    );
  }

  const payload = {
    schema_version: OBS_TIMELINE_SCHEMA,
    task_slug: slug,
    task_path: relTask,
    event_count: related.length,
    returned: events.length,
    limit: limit == null ? null : Number(limit),
    ingested: Boolean(ingest),
    ingest:
      ingestResult == null
        ? null
        : { count: ingestResult.count, skipped: ingestResult.skipped },
    events,
  };

  return { payload, warnings, ingestResult };
}

export function formatTimelineHuman(payload) {
  const lines = [
    `task: ${payload.task_slug}`,
    `path: ${payload.task_path}`,
    `events: ${payload.event_count}  returned: ${payload.returned}${payload.limit != null ? `  limit=${payload.limit}` : ''}`,
  ];
  if (payload.ingested) {
    lines.push(
      `ingest: new=${payload.ingest?.count ?? 0}  skipped=${payload.ingest?.skipped ?? 0}`,
    );
  }
  if (payload.events.length === 0) {
    lines.push('(no events)');
  } else {
    lines.push('timeline (asc):');
    for (const e of payload.events) {
      lines.push(
        `  ${e.occurred_at || '—'}  ${e.type}  ${e.subject}  · ${e.summary}`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

function toRel(target, abs) {
  const rel = path.relative(target, abs);
  if (!rel || rel.startsWith('..')) return abs.replace(/\\/g, '/');
  return rel.split(path.sep).join('/');
}
