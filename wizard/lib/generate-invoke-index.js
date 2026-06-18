#!/usr/bin/env node
// 生成 .cyning-harness/invoke_index.json（harness-sync --index 的 JSON 引擎）
import fs from 'node:fs';
import path from 'node:path';
import { parseHarnessMeta } from '../../lib/task-meta.js';

const target = process.argv[2];
const workspaceRoot = process.argv[3] || undefined;

if (!target) {
  console.error('用法: node generate-invoke-index.js /path/to/target-repo [/path/to/workspace-root]');
  process.exit(1);
}

const byTaskDir = path.join(target, 'docs/harness/invokes/by-task');
const indexFile = path.join(target, '.cyning-harness/invoke_index.json');

function extractHatId(filename) {
  const base = path.basename(filename, '.md');
  const parts = base.split('_');
  if (parts.length >= 3 && parts[0] === 'invoke') {
    return parts[2];
  }
  return 'unknown';
}

function collectTaskEntryPoints() {
  const entryBySlug = {};
  const taskDirs = [
    path.join(target, 'docs/tasks/active'),
    path.join(target, 'docs/tasks/done'),
  ];

  for (const dir of taskDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.startsWith('task_') || !name.endsWith('.md')) continue;
      const content = fs.readFileSync(path.join(dir, name), 'utf8');
      const meta = parseHarnessMeta(content);
      const slug = meta.task_slug;
      if (!slug) continue;

      const points = {};
      if (meta.entry_invoke_10_task) points['10'] = meta.entry_invoke_10_task;
      if (meta.entry_invoke_20) points['20'] = meta.entry_invoke_20;
      if (meta.entry_invoke_30) points['30'] = meta.entry_invoke_30;

      if (Object.keys(points).length === 0) continue;

      entryBySlug[slug] = {
        task_markdown: path.relative(target, path.join(dir, name)).replace(/\\/g, '/'),
        entry_points: points,
      };
    }
  }

  return entryBySlug;
}

const index = {
  schema_version: '1',
  generated_at: new Date().toISOString(),
  index: {},
};

const taskEntries = collectTaskEntryPoints();

if (fs.existsSync(byTaskDir)) {
  for (const entry of fs.readdirSync(byTaskDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const slugDir = path.join(byTaskDir, slug);
    const invokes = [];

    for (const file of fs.readdirSync(slugDir)) {
      if (!file.startsWith('invoke_') || !file.endsWith('.md')) continue;
      const full = path.join(slugDir, file);
      const stat = fs.statSync(full);
      invokes.push({
        path: path.relative(target, full).replace(/\\/g, '/'),
        mtime: Math.floor(stat.mtimeMs / 1000),
        hat_id: extractHatId(file),
      });
    }

    invokes.sort((a, b) => a.path.localeCompare(b.path));

    const record = {
      task_slug: slug,
      invokes,
    };

    if (taskEntries[slug]) {
      record.task_markdown = taskEntries[slug].task_markdown;
      record.entry_points = taskEntries[slug].entry_points;
    }

    index.index[slug] = record;
  }
}

// task 有 entry_invoke 但尚无 invokes/by-task 目录时也索引
for (const [slug, data] of Object.entries(taskEntries)) {
  if (!index.index[slug]) {
    index.index[slug] = {
      task_slug: slug,
      invokes: [],
      task_markdown: data.task_markdown,
      entry_points: data.entry_points,
    };
  }
}

if (workspaceRoot) {
  index.workspace_root = path.resolve(workspaceRoot);
}

fs.mkdirSync(path.dirname(indexFile), { recursive: true });
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
console.log(`invoke_index: ${indexFile}`);
