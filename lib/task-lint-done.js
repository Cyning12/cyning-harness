import fs from 'node:fs';
import path from 'node:path';
import { extractTaskSlug, normalizeSlug } from './task-meta.js';

const DONE_DIR_CANDIDATES = ['docs/tasks/done', 'docs/harness/tasks/done'];

/**
 * 方案 C · done 任务 slug 集合 vs invokes/by-task 目录名集合 diff。
 * done 有而 invokes 无 → ok:false（exit 2 由 CLI 决定）；invokes 多出仅 extra（warn）。
 */
export function lintDoneInvokes(target) {
  const doneSlugs = new Map(); // slug → 相对路径（首个）

  for (const rel of DONE_DIR_CANDIDATES) {
    const dir = path.join(target, rel);
    if (!fs.existsSync(dir)) continue;
    for (const file of collectMarkdown(dir)) {
      const slug = normalizeSlug(extractTaskSlug(path.basename(file)));
      if (!doneSlugs.has(slug)) {
        doneSlugs.set(slug, path.relative(target, file).replace(/\\/g, '/'));
      }
    }
  }

  const invokeRoot = path.join(target, 'docs/harness/invokes/by-task');
  const invokeSlugs = new Set();
  if (fs.existsSync(invokeRoot)) {
    for (const ent of fs.readdirSync(invokeRoot, { withFileTypes: true })) {
      if (ent.isDirectory()) invokeSlugs.add(normalizeSlug(ent.name));
    }
  }

  const missing = [...doneSlugs.keys()].filter((s) => !invokeSlugs.has(s)).sort();
  const extra = [...invokeSlugs].filter((s) => !doneSlugs.has(s)).sort();

  return {
    ok: missing.length === 0,
    missing,
    missingFiles: missing.map((s) => doneSlugs.get(s)),
    extra,
    doneCount: doneSlugs.size,
    invokeCount: invokeSlugs.size,
  };
}

function collectMarkdown(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.startsWith('_') || ent.name.startsWith('.')) continue;
      out.push(...collectMarkdown(full));
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
