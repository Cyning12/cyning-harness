import fs from 'node:fs';
import path from 'node:path';
import { parseHarnessMeta } from './task-meta.js';

/** Starter + 编排仓 task 布局 */
const TASK_DIR_CANDIDATES = [
  { rel: 'docs/tasks/active', scope: 'active' },
  { rel: 'docs/tasks/done', scope: 'done' },
  { rel: 'docs/harness/tasks/active', scope: 'active' },
  { rel: 'docs/harness/tasks/done', scope: 'done' },
];

/**
 * 扫描业务仓 task md：缺 `wiki_delta` 元信息字段的清单（升级后迁移用 · v2.19+）。
 * 仅查「字段缺失」；不校验 none/n/a note 或 path 存在性（那些仍由 close/verify 处理）。
 *
 * @param {string} target 仓根
 * @param {{ scope?: 'all'|'active'|'done' }} [options]
 * @returns {{ ok: boolean, missing: { path: string, scope: string }[], scanned: number, scope: string }}
 */
export function lintWikiDeltaMissing(target, options = {}) {
  const scope = options.scope || 'all';
  if (!['all', 'active', 'done'].includes(scope)) {
    throw new Error(`lint-wiki-delta --scope 须为 all|active|done（当前: ${scope}）`);
  }

  const missing = [];
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
        missing.push({ path: relPath, scope: dirScope });
      }
    }
  }

  missing.sort((a, b) => a.path.localeCompare(b.path));
  return {
    ok: missing.length === 0,
    missing,
    scanned,
    scope,
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
