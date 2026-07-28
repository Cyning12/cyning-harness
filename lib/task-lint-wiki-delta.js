import fs from 'node:fs';
import path from 'node:path';
import { parseHarnessMeta } from './task-meta.js';
import { evaluateWikiDelta } from './close-loop-gates.js';

/** Starter + 编排仓 task 布局 */
const TASK_DIR_CANDIDATES = [
  { rel: 'docs/tasks/active', scope: 'active' },
  { rel: 'docs/tasks/done', scope: 'done' },
  { rel: 'docs/harness/tasks/active', scope: 'active' },
  { rel: 'docs/harness/tasks/done', scope: 'done' },
];

/**
 * 扫描业务仓 task md 的 wiki_delta 缺口（升级后迁移 / 关账预检 · v2.19+）。
 *
 * 默认：仅「缺字段」。
 * `--strict`（v2.20+）：复用 close 的 evaluateWikiDelta，另报 none/n/a 无 note、path 非法/不存在。
 *
 * @param {string} target 仓根
 * @param {{ scope?: 'all'|'active'|'done', strict?: boolean }} [options]
 * @returns {{
 *   ok: boolean,
 *   missing: { path: string, scope: string, code: string, detail: string }[],
 *   issues: { path: string, scope: string, code: string, detail: string }[],
 *   scanned: number,
 *   scope: string,
 *   strict: boolean,
 * }}
 */
export function lintWikiDeltaMissing(target, options = {}) {
  const scope = options.scope || 'all';
  const strict = Boolean(options.strict);
  if (!['all', 'active', 'done'].includes(scope)) {
    throw new Error(`lint-wiki-delta --scope 须为 all|active|done（当前: ${scope}）`);
  }

  const missing = [];
  const issues = [];
  let scanned = 0;
  const seen = new Set();

  for (const { rel, scope: dirScope } of TASK_DIR_CANDIDATES) {
    if (scope !== 'all' && scope !== dirScope) continue;
    const dir = path.join(target, rel);
    if (!fs.existsSync(dir)) continue;
    for (const abs of collectTaskMarkdown(dir)) {
      const relPath = path.relative(target, abs).replace(/\\/g, '/');
      if (seen.has(relPath)) continue;
      seen.add(relPath);
      scanned += 1;
      const content = fs.readFileSync(abs, 'utf8');
      const meta = parseHarnessMeta(content);
      const raw = meta.wiki_delta;

      if (raw == null || String(raw).trim() === '') {
        const row = {
          path: relPath,
          scope: dirScope,
          code: 'wiki_delta_missing',
          detail: '缺 wiki_delta 字段（须 path|none|n/a · v2.18+ BLOCK）',
        };
        missing.push(row);
        issues.push(row);
        continue;
      }

      if (!strict) continue;

      const wd = evaluateWikiDelta(meta, { repoRoot: target });
      if (wd.status === 'fail') {
        issues.push({
          path: relPath,
          scope: dirScope,
          code: wd.code || 'wiki_delta_fail',
          detail: wd.detail,
        });
      }
    }
  }

  missing.sort((a, b) => a.path.localeCompare(b.path));
  issues.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));

  return {
    ok: (strict ? issues : missing).length === 0,
    missing,
    issues: strict ? issues : missing.map((m) => ({ ...m })),
    scanned,
    scope,
    strict,
  };
}

function collectTaskMarkdown(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
      out.push(...collectTaskMarkdown(full));
    } else if (
      ent.isFile() &&
      ent.name.endsWith('.md') &&
      !/^readme\.md$/i.test(ent.name)
    ) {
      out.push(full);
    }
  }
  return out;
}
