#!/usr/bin/env node
// 生成 .cyning-harness/invoke_index.json（harness-sync --index 的 JSON 引擎）
import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('用法: node generate-invoke-index.js /path/to/target-repo');
  process.exit(1);
}

const byTaskDir = path.join(target, 'docs/harness/invokes/by-task');
const indexFile = path.join(target, '.cyning-harness/invoke_index.json');

function extractHatId(filename) {
  // invoke_YYYYMMDD_<hat_id>_*.md 或 invoke_YYYYMMDD_<hat_id>.md
  const base = path.basename(filename, '.md');
  const parts = base.split('_');
  if (parts.length >= 3 && parts[0] === 'invoke') {
    return parts[2];
  }
  return 'unknown';
}

const index = {
  schema_version: '1',
  generated_at: new Date().toISOString(),
  index: {},
};

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

    index.index[slug] = {
      task_slug: slug,
      invokes,
    };
  }
}

fs.mkdirSync(path.dirname(indexFile), { recursive: true });
fs.writeFileSync(indexFile, JSON.stringify(index, null, 2) + '\n');
console.log(`invoke_index: ${indexFile}`);
