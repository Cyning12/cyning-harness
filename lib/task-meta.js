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
 * 查找 task 的 R<n> 审查文（verify/close 共用）。
 * 匹配规则（G2 · R1-B1）：task basename 与审查文文件名均剥离 `_v\d+$` 后前缀比较；
 * 文件名须含 `_audit_R<n>_` 段。返回 {found, latest, rounds}。
 */
export function findReview(target, taskFile) {
  const reviewsDir = path.join(target, 'docs/harness/reviews');
  const empty = { found: false, latest: null, rounds: [] };
  if (!fs.existsSync(reviewsDir)) return empty;

  const stripVer = (s) => s.replace(/_v\d+$/, '');
  const base = stripVer(path.basename(taskFile, '.md'));
  const REVIEW_RE = /^(task_.+?)_audit_R(\d+)_.*\.md$/;

  const matches = [];
  for (const name of fs.readdirSync(reviewsDir)) {
    const m = name.match(REVIEW_RE);
    if (!m) continue;
    if (stripVer(m[1]) !== base) continue;
    matches.push({ name, round: parseInt(m[2], 10), mtime: fs.statSync(path.join(reviewsDir, name)).mtimeMs });
  }
  if (matches.length === 0) return empty;

  matches.sort((a, b) => b.round - a.round || b.mtime - a.mtime);
  const latest = matches[0];
  return {
    found: true,
    latest: path.join('docs/harness/reviews', latest.name).replace(/\\/g, '/'),
    rounds: [...new Set(matches.map((x) => x.round))].sort((a, b) => a - b),
  };
}

/**
 * 查找最新 R1+ 审查文（相对 target）· 兼容旧签名：返回路径或 null。
 */
export function findReviewPath(target, taskFile) {
  return findReview(target, taskFile).latest;
}

/** 剥离文件名末尾 `_v\d+` */
function stripVerSuffix(s) {
  return String(s).replace(/_v\d+$/, '');
}

/**
 * 自 SPEC 路径/正文解析 slug（优先表 `spec_slug`）。
 */
export function extractSpecSlug(specFile, content) {
  const meta = content ? parseHarnessMeta(content) : {};
  if (meta.spec_slug) return meta.spec_slug;

  let base = path.basename(specFile, '.md');
  base = base.replace(/^SPEC[-_]/i, '');
  base = stripVerSuffix(base);
  return base;
}

/**
 * bugfix / 显式跳过 10-spec 审计：不要求 SPEC 审查文。
 * 只认元信息表 / 文首 track 行——避免命中正文里对规则的说明文字。
 */
export function shouldSkipSpecAudit(content) {
  if (!content) return false;
  const meta = parseHarnessMeta(content);
  if (String(meta.skip_spec_audit || '').toLowerCase() === 'true') return true;
  if (String(meta.track || '').toLowerCase() === 'bugfix') return true;
  if (/^>\s*\*\*track\*\*[：:]\s*`?bugfix\b/im.test(content)) return true;
  return false;
}

/**
 * 查找 SPEC 的 R<n> 审查文（verify --spec · N3）。
 * 兼容命名：
 * 1. spec_<slug>_audit_R<n>_*.md（推荐）
 * 2. spec_<slug>_ACCEPT_R<n>_*.md
 * 3. task_<slug>_spec_ACCEPT_R<n>_*.md
 * 在 target 与可选 workspaceRoot 的 docs/harness/reviews/ 下搜索。
 */
export function findSpecReview(specFile, options = {}) {
  const { target = process.cwd(), workspaceRoot } = options;
  const empty = { found: false, latest: null, rounds: [], matched_pattern: null };

  const absSpec = path.isAbsolute(specFile)
    ? specFile
    : path.resolve(target, specFile);
  if (!fs.existsSync(absSpec)) return empty;

  const content = fs.readFileSync(absSpec, 'utf8');
  const slugNorm = normalizeSlug(stripVerSuffix(extractSpecSlug(absSpec, content)));

  const roots = [];
  const pushRoot = (root) => {
    if (!root) return;
    const abs = path.resolve(root);
    if (!roots.includes(abs)) roots.push(abs);
  };
  pushRoot(target);
  pushRoot(workspaceRoot);

  const PATTERNS = [
    { id: 'spec_audit', re: /^spec_(.+?)_audit_R(\d+)_.*\.md$/i },
    { id: 'spec_ACCEPT', re: /^spec_(.+?)_ACCEPT_R(\d+)_.*\.md$/i },
    { id: 'task_spec_ACCEPT', re: /^task_(.+?)_spec_ACCEPT_R(\d+)_.*\.md$/i },
  ];

  const matches = [];
  for (const root of roots) {
    const reviewsDir = path.join(root, 'docs/harness/reviews');
    if (!fs.existsSync(reviewsDir)) continue;
    for (const name of fs.readdirSync(reviewsDir)) {
      for (const pat of PATTERNS) {
        const m = name.match(pat.re);
        if (!m) continue;
        if (normalizeSlug(stripVerSuffix(m[1])) !== slugNorm) continue;
        matches.push({
          name,
          round: parseInt(m[2], 10),
          mtime: fs.statSync(path.join(reviewsDir, name)).mtimeMs,
          pattern: pat.id,
          root,
          rel: path.join('docs/harness/reviews', name).replace(/\\/g, '/'),
        });
        break;
      }
    }
  }

  if (matches.length === 0) return empty;

  matches.sort((a, b) => b.round - a.round || b.mtime - a.mtime);
  const latest = matches[0];
  return {
    found: true,
    latest: latest.rel,
    rounds: [...new Set(matches.map((x) => x.round))].sort((a, b) => a - b),
    matched_pattern: latest.pattern,
    reviews_root: latest.root,
  };
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

  const review = findReview(target, taskFile);

  return {
    task: path.basename(taskFile),
    task_path: taskFile.replace(/\\/g, '/'),
    task_slug: meta.task_slug ?? null,
    may_start_30: gateEval.may_start_30,
    blocked_reason: gateEval.blocked_reason,
    review_path: review.latest,
    review_found: review.found,
    review_latest: review.latest,
    review_rounds: review.rounds,
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractSection(content, startMarker, endMarker) {
  // startMarker 锚定行首：避免命中表格/正文里的「`## 验收标准`」式文本提及
  const startRe = new RegExp(`^${escapeRegExp(startMarker)}`, 'm');
  const startMatch = content.match(startRe);
  if (!startMatch) return null;
  const start = startMatch.index;

  let end = content.length;
  if (endMarker) {
    const next = content.indexOf(endMarker, start + startMarker.length);
    if (next !== -1) end = next;
  }
  return content.slice(start, end);
}

/**
 * 从 task/done 文件名提取 slug：去 .md → 去 ^task_|done_ 前缀 → 去日期后缀 → 去 _vN 后缀。
 * 兼容：task_<slug>_v1.md · done_<slug>_YYYY-MM-DD.md · done_<slug>_v1.md · <slug>.md
 */
export function extractTaskSlug(fileName) {
  let base = path.basename(fileName).replace(/\.md$/, '');
  base = base.replace(/^(task_|done_)/, '');
  base = base.replace(/_(\d{8}|\d{4}-\d{2}-\d{2})$/, '');
  base = base.replace(/_v\d+$/, '');
  return base;
}

/** 自检结论占位符：整行匹配 （…回填/待填…） */
export const PLACEHOLDER_RE = /^（[^）]*(回填|待填)[^）]*）$/;

/** 状态行：`> **状态**：`done` …（首个 [a-z_] token，反引号可选） */
export const STATUS_RE = /\*\*状态\*\*：?\s*`?([a-z_]+)/i;

/** 验收标准未勾选项 */
export const UNCHECKED_RE = /^\s*- \[ \]/;

/** 验收标准勾选项（已勾/未勾均可 · 多行模式） */
export const CHECKBOX_RE = /^\s*- \[[ xX]\]/m;

/** close 可接受的状态 token */
export const CLOSE_STATUSES = new Set(['done', 'completed']);

/** 已知状态词表（lint W1 用 · 实测工作区 13 个 task） */
export const KNOWN_STATUS_TOKENS = new Set([
  'draft',
  'pending',
  'in_progress',
  'active',
  'deferred',
  'done',
  'completed',
]);

/**
 * slug 规范化比较：文件名惯例用下划线、task_slug/invoke 目录惯例用连字符
 * （实测工作区：task_cyning_harness_a5_*_v1.md ↔ cyning-harness-a5-*）。
 */
export function normalizeSlug(slug) {
  return String(slug).replace(/_/g, '-');
}

function normalizeCell(cell) {
  return cell.replace(/[`\\*]/g, '').trim();
}
