import fs from 'node:fs';
import path from 'node:path';

const HGM_DIR = '.cyning-harness';
const EVENTS_DIR = 'events';
const SNAPSHOT_FILE = 'graph/snapshot.json';

export class HgmError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HgmError';
  }
}

export function eventsDir(target) {
  return path.join(target, HGM_DIR, EVENTS_DIR);
}

export function eventsFileForMonth(target, date = new Date()) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return path.join(eventsDir(target), `${y}-${m}.jsonl`);
}

export function snapshotPath(target) {
  return path.join(target, HGM_DIR, SNAPSHOT_FILE);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isoDate(date = new Date()) {
  return date.toISOString();
}

function eventId(date = new Date(), seq = 0) {
  const d = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return `evt:${d}:${String(seq).padStart(3, '0')}`;
}

/**
 * 追加单条事件到 events/YYYY-MM.jsonl。
 */
export function appendEvent(target, event) {
  const file = eventsFileForMonth(target, new Date(event.occurred_at));
  ensureDir(path.dirname(file));
  const line = JSON.stringify(event);
  fs.appendFileSync(file, `${line}\n`);
  return file;
}

/**
 * 读取全部事件，按 occurred_at 排序。
 */
export function loadEvents(target) {
  const dir = eventsDir(target);
  if (!fs.existsSync(dir)) return [];
  const events = [];
  const files = fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.jsonl'))
    .sort();
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        events.push(JSON.parse(trimmed));
      } catch (err) {
        throw new HgmError(`JSONL 解析失败 ${f}: ${err.message}`);
      }
    }
  }
  events.sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.event_id.localeCompare(b.event_id));
  return events;
}

/**
 * 轻量解析 task markdown：提取 slug、status、title、gates、must_read。
 */
export function parseTaskMarkdown(content, fileName) {
  const slugMatch = content.match(/\*\*task_slug\*\*\s*[:：]\s*`?([a-zA-Z0-9_-]+)`?/) ||
    fileName.match(/task_([a-zA-Z0-9_-]+)_v\d+/);
  const taskSlug = slugMatch ? slugMatch[1] : path.basename(fileName, '.md');

  const titleMatch = content.match(/^#\s+Task\s*[·•]\s*(.+)$/m) || content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : taskSlug;

  const statusMatch = content.match(/\*\*状态\*\*\s*[:：]\s*`?([a-zA-Z0-9_-]+)`?/);
  const status = statusMatch ? statusMatch[1] : 'pending';

  const gates = [];
  const gateHeader = content.search(/^\s*\|\s*human_gate_id\s*\|/m);
  if (gateHeader !== -1) {
    const tableStart = content.lastIndexOf('\n', gateHeader) + 1;
    let tableEnd = content.indexOf('\n\n', gateHeader);
    if (tableEnd === -1) tableEnd = content.length;
    const table = content.slice(tableStart, tableEnd).trim();
    const lines = table.split('\n').filter((l) => l.trim().startsWith('|'));
    for (let i = 2; i < lines.length; i += 1) {
      const cols = lines[i].split('|').map((c) => c.trim().replace(/\*/g, ''));
      if (cols.length >= 3) {
        const humanGateId = cols[1];
        const gateStatus = cols[2];
        const blocksHats = cols[3] && cols[3] !== '—' ? cols[3].split(/[,\s]+/).filter(Boolean) : [];
        if (humanGateId && gateStatus) {
          gates.push({ human_gate_id: humanGateId, status: gateStatus, blocks_hats: blocksHats });
        }
      }
    }
  }

  const mustRead = [];
  const mustReadMatch = content.match(/MUST_READ|must_read|必须阅读/);
  if (mustReadMatch) {
    const sectionStart = content.indexOf(mustReadMatch[0]);
    const sectionEnd = content.indexOf('\n\n', sectionStart);
    const section = content.slice(sectionStart, sectionEnd === -1 ? content.length : sectionEnd);
    const paths = section.match(/`(docs\/[^`]+\.(?:md|yaml|graph\.yaml))`/g) || [];
    for (const p of paths) {
      mustRead.push(p.slice(1, -1));
    }
  }

  return { task_slug: taskSlug, title, status, gates, must_read: mustRead };
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(dir, e.name));
}

/**
 * 扫描业务仓并追加 HGM 事件。
 */
export function ingestRepo(target, options = {}) {
  const {
    actor = 'system',
    source = 'cli',
    dryRun = false,
    occurredAt = isoDate(),
  } = options;

  const events = [];
  let seq = 0;

  // RepositoryAdopted
  const manifestPath = path.join(target, HGM_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const repoSlug = path.basename(target);
    events.push({
      event_id: eventId(new Date(occurredAt), seq++),
      type: 'RepositoryAdopted',
      occurred_at: occurredAt,
      actor,
      subject: `repo:${repoSlug}`,
      data: {
        manifest_version: manifest.version,
        preset: manifest.preset,
        ide: manifest.ide || [],
      },
      source,
    });
  }

  // Tasks + gates
  const activeDir = path.join(target, 'docs/tasks/active');
  for (const tf of listMarkdownFiles(activeDir)) {
    const parsed = parseTaskMarkdown(fs.readFileSync(tf, 'utf8'), tf);
    const taskSubject = `task:${parsed.task_slug}`;
    events.push({
      event_id: eventId(new Date(occurredAt), seq++),
      type: 'TaskCreated',
      occurred_at: occurredAt,
      actor,
      subject: taskSubject,
      data: {
        task_slug: parsed.task_slug,
        title: parsed.title,
        status: parsed.status,
        path: path.relative(target, tf),
        must_read: parsed.must_read,
      },
      source,
    });

    for (const g of parsed.gates) {
      events.push({
        event_id: eventId(new Date(occurredAt), seq++),
        type: 'GateStatusChanged',
        occurred_at: occurredAt,
        actor,
        subject: `gate:${parsed.task_slug}:${g.human_gate_id}`,
        data: {
          old_status: 'pending',
          new_status: g.status,
          task_slug: parsed.task_slug,
          human_gate_id: g.human_gate_id,
          blocks_hats: g.blocks_hats,
        },
        source,
      });
      if (g.status === 'rejected') {
        events.push({
          event_id: eventId(new Date(occurredAt), seq++),
          type: 'HumanGateRejected',
          occurred_at: occurredAt,
          actor,
          subject: `gate:${parsed.task_slug}:${g.human_gate_id}`,
          data: {
            task_slug: parsed.task_slug,
            human_gate_id: g.human_gate_id,
            reason: 'from task table',
            returns_to_status: 'draft',
          },
          source,
        });
      }
    }

    const hasRejectedGate = parsed.gates.some((g) => g.status === 'rejected');
    if (hasRejectedGate && parsed.status === 'draft') {
      events.push({
        event_id: eventId(new Date(occurredAt), seq++),
        type: 'TaskStatusChanged',
        occurred_at: occurredAt,
        actor,
        subject: taskSubject,
        data: { task_slug: parsed.task_slug, new_status: 'draft', reason: 'rejected→draft from task table' },
        source,
      });
    }

    for (const mr of parsed.must_read) {
      events.push({
        event_id: eventId(new Date(occurredAt), seq++),
        type: 'InformArtifactUpdated',
        occurred_at: occurredAt,
        actor,
        subject: `inform:${mr}`,
        data: { path: mr, inform_schema: 'inform_graph.v3' },
        source,
      });
    }
  }

  // Reviews
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  if (fs.existsSync(reviewsDir)) {
    for (const rf of listMarkdownFiles(reviewsDir)) {
      const name = path.basename(rf, '.md');
      const taskMatch = name.match(/^task_([a-zA-Z0-9_-]+)_/);
      const roundMatch = name.match(/_(r\d|close)_/i);
      const taskSlug = taskMatch ? taskMatch[1] : 'unknown';
      const round = roundMatch ? roundMatch[1].toUpperCase() : 'R1';
      events.push({
        event_id: eventId(new Date(occurredAt), seq++),
        type: 'AuditReviewProduced',
        occurred_at: occurredAt,
        actor,
        subject: `task:${taskSlug}`,
        data: {
          review_path: path.relative(target, rf),
          round,
        },
        source,
      });
    }
  }

  // Invokes
  const invokesDir = path.join(target, 'docs/harness/invokes/by-task');
  if (fs.existsSync(invokesDir)) {
    const stack = [invokesDir];
    while (stack.length > 0) {
      const dir = stack.pop();
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile() && ent.name.endsWith('.md')) {
          const rel = path.relative(target, full);
          const taskMatch = rel.match(/by-task\/([a-zA-Z0-9_-]+)\//);
          const taskSlug = taskMatch ? taskMatch[1] : 'unknown';
          events.push({
            event_id: eventId(new Date(occurredAt), seq++),
            type: 'InvokeSnapshotCreated',
            occurred_at: occurredAt,
            actor,
            subject: `task:${taskSlug}`,
            data: { invoke_path: rel },
            source,
          });
        }
      }
    }
  }

  if (!dryRun) {
    for (const e of events) {
      appendEvent(target, e);
    }
  }

  return { events, count: events.length };
}

/**
 * 从事件流投影图快照。
 */
export function buildSnapshot(events) {
  const nodes = new Map();
  const edges = [];

  function ensureNode(id, label, kind, extra = {}) {
    if (!nodes.has(id)) {
      nodes.set(id, { id, label, kind, ...extra });
    }
    return nodes.get(id);
  }

  function addEdge(from, to, type, props = {}) {
    edges.push({ from, to, type, ...props });
  }

  const sorted = [...events].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const taskStatus = new Map();
  const gateStatus = new Map();
  const rejectedEvents = [];

  for (const e of sorted) {
    const { type, subject, data } = e;
    switch (type) {
      case 'RepositoryAdopted': {
        ensureNode(subject, data.preset || subject, 'BusinessRepository', {
          manifest_version: data.manifest_version,
        });
        break;
      }
      case 'TaskCreated': {
        ensureNode(subject, data.title, 'Task', { status: data.status, path: data.path });
        taskStatus.set(subject, data.status);
        if (data.path) {
          const parts = data.path.split('/');
          for (let i = 1; i < parts.length; i += 1) {
            const parent = parts.slice(0, i).join('/');
            const child = parts.slice(0, i + 1).join('/');
            ensureNode(`file:${child}`, parts[i], 'File');
            addEdge(`file:${parent || '.'}`, `file:${child}`, 'CONTAINS');
          }
        }
        break;
      }
      case 'TaskStatusChanged': {
        ensureNode(subject, data.task_slug || subject, 'Task');
        taskStatus.set(subject, data.new_status);
        break;
      }
      case 'GateStatusChanged': {
        ensureNode(subject, data.human_gate_id, 'HumanGate', {
          task_slug: data.task_slug,
          status: data.new_status,
        });
        gateStatus.set(subject, data.new_status);
        addEdge(`task:${data.task_slug}`, subject, 'HAS_GATE', { since: e.occurred_at });
        if (data.blocks_hats && data.blocks_hats.length > 0) {
          for (const hat of data.blocks_hats) {
            ensureNode(`hat:${hat}`, hat, 'Hat');
            addEdge(subject, `hat:${hat}`, 'BLOCKS', { hat_id: hat });
          }
        }
        break;
      }
      case 'HumanGateRejected': {
        rejectedEvents.push(e);
        break;
      }
      case 'AuditReviewProduced': {
        ensureNode(subject, data.task_slug || subject, 'Task');
        const reviewId = `review:${data.review_path}`;
        ensureNode(reviewId, path.basename(data.review_path), 'AuditReview', {
          round: data.round,
          path: data.review_path,
        });
        addEdge(subject, reviewId, 'PRODUCED', { round: data.round, hat_id: data.hat_id });
        break;
      }
      case 'InvokeSnapshotCreated': {
        ensureNode(subject, data.task_slug || subject, 'Task');
        const invokeId = `invoke:${data.invoke_path}`;
        ensureNode(invokeId, path.basename(data.invoke_path), 'InvokeSnapshot', {
          path: data.invoke_path,
        });
        addEdge(subject, invokeId, 'PRODUCED', { hat_id: data.hat_id });
        break;
      }
      case 'FailureReportProduced': {
        ensureNode(subject, data.task_slug || subject, 'Task');
        const failureId = `failure:${data.failure_path}`;
        ensureNode(failureId, path.basename(data.failure_path), 'FailureReport', {
          path: data.failure_path,
        });
        addEdge(subject, failureId, 'FAILED_WITH', { at_gate: data.at_gate });
        break;
      }
      case 'GateCheckRunCompleted': {
        const gcrId = `gcr:${e.occurred_at}:${data.task_slug}`;
        ensureNode(gcrId, `gate-check ${data.task_slug}`, 'GateCheckRun', {
          exit_code: data.exit_code,
        });
        addEdge(gcrId, `task:${data.task_slug}`, 'CHECKED', { exit_code: data.exit_code });
        break;
      }
      case 'SyncOperationCompleted': {
        const syncId = `sync:${e.occurred_at}:${data.mode}`;
        ensureNode(syncId, `sync ${data.mode}`, 'SyncOperation', {
          mode: data.mode,
          version: data.version,
        });
        addEdge(syncId, subject, 'SYNCED', {
          mode: data.mode,
          version: data.version,
          files_touched: data.files_touched || [],
        });
        break;
      }
      case 'InformArtifactUpdated': {
        ensureNode(subject, data.path, 'InformArtifact', {
          inform_schema: data.inform_schema,
          compiled_from: data.compiled_from,
        });
        break;
      }
      default:
        break;
    }
  }

  // MUST_READ 边：task → inform
  for (const e of sorted) {
    if (e.type === 'TaskCreated' && e.data.must_read) {
      for (const mr of e.data.must_read) {
        ensureNode(`inform:${mr}`, mr, 'InformArtifact');
        addEdge(e.subject, `inform:${mr}`, 'MUST_READ');
      }
    }
  }

  return {
    nodes: Object.fromEntries(nodes),
    edges,
    projections: {
      task_status: Object.fromEntries(taskStatus),
      gate_status: Object.fromEntries(gateStatus),
      rejected_events: rejectedEvents.map((e) => e.event_id),
    },
    generated_at: isoDate(),
  };
}

/**
 * 从事件流提取 rejected 事件（GateStatusChanged rejected 或 HumanGateRejected）。
 */
function collectRejectedEvents(events) {
  if (!events || events.length === 0) return [];
  return events.filter(
    (e) =>
      e.type === 'HumanGateRejected' ||
      (e.type === 'GateStatusChanged' && e.data?.new_status === 'rejected'),
  );
}

/**
 * rejected→draft：重放事件流，rejected 后须同 task 的 TaskStatusChanged(draft)。
 */
function checkRejectedToDraft(events) {
  const violations = [];
  if (!events || events.length === 0) return violations;

  const sorted = [...events].sort(
    (a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.event_id.localeCompare(b.event_id),
  );

  for (let i = 0; i < sorted.length; i += 1) {
    const rej = sorted[i];
    if (
      rej.type !== 'HumanGateRejected' &&
      !(rej.type === 'GateStatusChanged' && rej.data?.new_status === 'rejected')
    ) {
      continue;
    }
    const taskSlug = rej.data?.task_slug;
    if (!taskSlug) continue;
    const taskSubject = `task:${taskSlug}`;
    const hasDraftFollowUp = sorted.slice(i + 1).some(
      (e) =>
        e.type === 'TaskStatusChanged' &&
        e.subject === taskSubject &&
        e.data?.new_status === 'draft',
    );
    if (!hasDraftFollowUp) {
      violations.push({
        axiom: 'rejected→draft',
        severity: 'error',
        message: `gate rejected（${rej.event_id}）后缺少 TaskStatusChanged(draft) 回退`,
        node: rej.subject,
      });
    }
  }
  return violations;
}

/**
 * 公理检查：D2 · D3 · D4-a · rejected→draft · S2 事件审计。
 * @param {object} snapshot - buildSnapshot 产物
 * @param {object[]|null} events - 原始事件流（rejected→draft 精确匹配须传入）
 */
export function checkAxioms(snapshot, events = null) {
  const violations = [];
  const { nodes, edges, projections } = snapshot;
  const nodeMap = new Map(Object.entries(nodes));

  function outgoing(id, type) {
    return edges.filter((e) => e.from === id && e.type === type);
  }

  // D2: pending 的 HG-AUDIT-R1 BLOCKS 30 帽
  for (const [id, node] of nodeMap) {
    if (node.kind === 'HumanGate' && node.status === 'pending') {
      const blocks30 = outgoing(id, 'BLOCKS').some((e) => String(e.hat_id).includes('30'));
      if (blocks30) {
        violations.push({
          axiom: 'D2',
          severity: 'error',
          message: `gate ${id} pending 且阻塞 30 帽`,
          node: id,
        });
      }
    }
  }

  // D3: 30 首动作须关联 GateCheckRun CHECKED 边
  for (const [taskId, status] of Object.entries(projections.task_status || {})) {
    if (status === 'in_progress') {
      const checked = edges.some(
        (e) => e.to === taskId && e.type === 'CHECKED' && e.exit_code === 0,
      );
      if (!checked) {
        violations.push({
          axiom: 'D3',
          severity: 'warn',
          message: `task ${taskId} in_progress 但无通过 GateCheckRun`,
          node: taskId,
        });
      }
    }
  }

  // D4-a: in_progress 改码 task 须 HG-GRAPH-MODULES approved
  for (const [taskId, status] of Object.entries(projections.task_status || {})) {
    if (status !== 'in_progress') continue;
    const taskSlug = taskId.replace(/^task:/, '');
    const graphGateId = `gate:${taskSlug}:HG-GRAPH-MODULES`;
    const graphGate = nodeMap.get(graphGateId);
    if (graphGate && (graphGate.status === 'pending' || graphGate.status === 'rejected')) {
      violations.push({
        axiom: 'D4-a',
        severity: 'error',
        message: `task ${taskId} in_progress 但 HG-GRAPH-MODULES=${graphGate.status}`,
        node: graphGateId,
      });
    }
    const mustReadTargets = edges
      .filter((e) => e.from === taskId && e.type === 'MUST_READ')
      .map((e) => e.to.replace(/^inform:/, ''));
    const hasInformGraph = mustReadTargets.some(
      (p) => p.includes('01_struct') || p.includes('_tech_graph'),
    );
    if (mustReadTargets.length > 0 && !hasInformGraph) {
      violations.push({
        axiom: 'D4-a',
        severity: 'warn',
        message: `task ${taskId} MUST_READ 缺 01_struct / _tech_graph InformArtifact`,
        node: taskId,
      });
    }
  }

  // rejected→draft: 事件流精确匹配
  violations.push(...checkRejectedToDraft(events));

  // S2: SyncOperation 不得 touch S2 路径
  const s2Prefixes = ['docs/tasks/', 'docs/harness/reviews/', 'docs/harness/invokes/by-task/'];
  for (const edge of edges) {
    if (edge.type === 'SYNCED') {
      const files = edge.files_touched || [];
      for (const f of files) {
        if (s2Prefixes.some((p) => f.startsWith(p))) {
          violations.push({
            axiom: 'S2',
            severity: 'error',
            message: `sync 事件 touch S2 保护域: ${f}`,
            node: edge.from,
          });
        }
      }
    }
  }

  return {
    ok: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
  };
}

/**
 * 写入 snapshot.json。
 */
export function writeSnapshot(target, snapshot) {
  const p = snapshotPath(target);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(snapshot, null, 2)}\n`);
  return p;
}

/**
 * 幂等 ingest：先读已有事件，避免重复写入相同 subject+type 的关键事件。
 */
export function ingestRepoIdempotent(target, options = {}) {
  const existing = loadEvents(target);
  const existingKeys = new Set(existing.map((e) => `${e.type}:${e.subject}`));
  const { events, count } = ingestRepo(target, { ...options, dryRun: true });
  const newEvents = events.filter((e) => !existingKeys.has(`${e.type}:${e.subject}`));
  if (!options.dryRun) {
    for (const e of newEvents) {
      appendEvent(target, e);
    }
  }
  return { events: newEvents, count: newEvents.length, skipped: count - newEvents.length };
}
