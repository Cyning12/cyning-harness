import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gateScript = path.join(repoRoot, 'wizard', 'gate-check.sh');

function writeTaskWithGraph(target, graphStatus) {
  const activeDir = path.join(target, 'docs/tasks/active');
  fs.mkdirSync(activeDir, { recursive: true });
  fs.writeFileSync(
    path.join(activeDir, 'task_demo.md'),
    `# Task

### 人工闸

| human_gate_id | status | blocks | 说明 |
| --- | --- | --- | --- |
| HG-TASK-DRAFT | approved | 22, 30 | ok |
| HG-AUDIT-R1 | approved | 30 | ok |
| HG-GRAPH-MODULES | ${graphStatus} | — | graph |
`,
  );
}

test('gate-check --graph 输出 markdown 表', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-graph-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGraph(target, 'approved');
  fs.mkdirSync(path.join(target, 'docs/_tech_graph'), { recursive: true });
  fs.writeFileSync(path.join(target, 'docs/_tech_graph/01_struct.md'), 'status: approved\n');

  const result = spawnSync('bash', [gateScript, '--target', target, '--graph'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /HG-GRAPH-MODULES: approved/);
  assert.match(result.stdout, /01_struct\.md/);
  assert.match(result.stdout, /approved/);
});

test('gate-check --graph 无 _tech_graph 时 warn 不 fail', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-graph-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGraph(target, 'pending');

  const result = spawnSync('bash', [gateScript, '--target', target, '--graph'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /HG-GRAPH-MODULES: pending/);
  assert.match(result.stdout, /warn 不 fail|未找到/);
});

test('gate-check --graph --json 输出 JSON', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-graph-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"0.4.0","preset":"harness-only"}\n',
  );
  writeTaskWithGraph(target, 'approved');
  fs.mkdirSync(path.join(target, 'docs/_tech_graph'), { recursive: true });
  fs.writeFileSync(path.join(target, 'docs/_tech_graph/01_struct.md'), 'status: approved\n');

  const result = spawnSync('bash', [gateScript, '--target', target, '--graph', '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const data = JSON.parse(result.stdout);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 1);
  assert.equal(data[0].hg_graph_modules, 'approved');
  assert.equal(data[0].files.length, 1);
  assert.equal(data[0].files[0].name, '01_struct.md');
  assert.equal(data[0].files[0].status, 'approved');
});

test('gate-check --graph 对 Inform-YAML 文件友好列出', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-graph-yaml-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness/manifest.json'),
    '{"version":"1.1.0","preset":"harness-only"}\n',
  );
  writeTaskWithGraph(target, 'approved');
  fs.mkdirSync(path.join(target, 'docs/_tech_graph'), { recursive: true });
  fs.writeFileSync(
    path.join(target, 'docs/_tech_graph/00_main.graph.yaml'),
    `schema_version: "inform_graph.v3"
graph_id: "00_main"
title: "Main"
nodes:
  - id: "A"
    label: "Start"
edges: []
`,
  );

  const result = spawnSync('bash', [gateScript, '--target', target, '--graph'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /HG-GRAPH-MODULES: approved/);
  assert.match(result.stdout, /00_main\.graph\.yaml/);
});
