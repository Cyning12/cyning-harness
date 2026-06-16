import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syncScript = path.join(repoRoot, 'wizard', 'harness-sync.sh');

test('harness-sync --index 生成 invoke_index.json', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-index-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.mkdirSync(path.join(target, 'docs/harness/invokes/by-task/demo-task'), { recursive: true });
  fs.writeFileSync(
    path.join(target, 'docs/harness/invokes/by-task/demo-task/invoke_20260616_30_demo.md'),
    '# 30 invoke',
  );

  const result = spawnSync('bash', [syncScript, '--index', '--target', target], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const indexPath = path.join(target, '.cyning-harness/invoke_index.json');
  assert.ok(fs.existsSync(indexPath), 'invoke_index.json 应存在');

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert.equal(index.schema_version, '1');
  assert.ok(index.generated_at);
  assert.ok(index.index['demo-task']);
  assert.equal(index.index['demo-task'].task_slug, 'demo-task');
  assert.equal(index.index['demo-task'].invokes.length, 1);
  assert.equal(index.index['demo-task'].invokes[0].hat_id, '30');
  assert.match(index.index['demo-task'].invokes[0].path, /invoke_20260616_30_demo\.md$/);
  assert.equal(typeof index.index['demo-task'].invokes[0].mtime, 'number');
});

test('harness-sync --index 空 invokes 目录生成空索引', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-index-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.mkdirSync(path.join(target, 'docs/harness/invokes/by-task'), { recursive: true });

  const result = spawnSync('bash', [syncScript, '--index', '--target', target], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const index = JSON.parse(
    fs.readFileSync(path.join(target, '.cyning-harness/invoke_index.json'), 'utf8'),
  );
  assert.deepEqual(index.index, {});
});
