import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  allGraphIds,
  checkGraph,
  compileGraph,
  diffGraphYaml,
  loadYaml,
  validateGraphYaml,
} from '../lib/graph-yaml.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessCli = path.join(repoRoot, 'bin', 'harness.js');

const sampleYaml = `schema_version: "inform_graph.v3"
graph_id: "00_main"
title: "Demo Graph"
description: "Test graph"
version: "2026-06-17"
direction: "TD"

nodes:
  - id: "A"
    label: "Start"
  - id: "B"
    label: "End"

edges:
  - from: "A"
    to: "B"
    label: "flow"
`;

function writeSample(inputRoot, name = '00_main.graph.yaml') {
  fs.mkdirSync(inputRoot, { recursive: true });
  fs.writeFileSync(path.join(inputRoot, name), sampleYaml, 'utf8');
}

function writeGraphJson(inputRoot) {
  const payload = {
    schema_version: 'graph_v2',
    freeze_id: 'TECH_GRAPH_S2_FREEZE_20260519_V2_3',
    generated_at: '2026-06-17T00:00:00Z',
    graphs: [{ id: '00_main', title: 'Demo Graph', source_yaml_path: '00_main.graph.yaml' }],
    nodes: [
      { graph_id: '00_main', id: 'A', label: 'Start' },
      { graph_id: '00_main', id: 'B', label: 'End' },
    ],
    edges: [
      {
        anchors: [],
        from: 'A',
        graph_id: '00_main',
        label: 'flow',
        mark: '->',
        sync: true,
        to: 'B',
        type: 'depends_on',
      },
    ],
  };
  fs.writeFileSync(path.join(inputRoot, 'graph.json'), JSON.stringify(payload, null, 2), 'utf8');
}

test('loadYaml 解析 schema_version', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp);
  const data = loadYaml(path.join(tmp, '00_main.graph.yaml'));
  assert.equal(data.schema_version, 'inform_graph.v3');
  assert.equal(data.graph_id, '00_main');
});

test('validateGraphYaml 通过合法 YAML', () => {
  const data = yamlToObj(sampleYaml);
  const errors = validateGraphYaml(data);
  assert.equal(errors.length, 0);
});

test('validateGraphYaml 检测重复节点 id', () => {
  const data = yamlToObj(sampleYaml);
  data.nodes.push({ id: 'A', label: 'Duplicate' });
  const errors = validateGraphYaml(data);
  assert.ok(errors.some((e) => e.includes('重复节点 id')));
});

test('validateGraphYaml 检测边引用未知节点', () => {
  const data = yamlToObj(sampleYaml);
  data.edges[0].to = 'C';
  const errors = validateGraphYaml(data);
  assert.ok(errors.some((e) => e.includes('引用未知节点')));
});

test('allGraphIds 列出 *.graph.yaml', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp, '00_main.graph.yaml');
  writeSample(tmp, '10_flow.graph.yaml');
  const ids = allGraphIds(tmp);
  assert.deepEqual(ids, ['00_main', '10_flow']);
});

test('compileGraph 生成 MD', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp);
  const out = compileGraph('00_main', tmp);
  assert.equal(out, path.join(tmp, '00_main.md'));
  const md = fs.readFileSync(out, 'utf8');
  assert.match(md, /graph_id: 00_main/);
  assert.match(md, /```mermaid/);
  assert.match(md, /A --"flow"--> B/);
});

test('checkGraph YAML 与 graph.json 一致', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp);
  writeGraphJson(tmp);
  const result = checkGraph('00_main', tmp, path.join(tmp, 'graph.json'));
  assert.equal(result.ok, true);
});

test('diffGraphYaml 检测节点差异', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp);
  writeGraphJson(tmp);
  const data = loadYaml(path.join(tmp, '00_main.graph.yaml'));
  data.nodes.push({ id: 'C', label: 'Extra' });
  fs.writeFileSync(path.join(tmp, '00_main.graph.yaml'), objToYaml(data), 'utf8');
  const result = diffGraphYaml('00_main', tmp, path.join(tmp, 'graph.json'));
  assert.equal(result.ok, false);
  assert.match(result.diff, /Nodes only in YAML/);
});

test('CLI graph yaml compile --all', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp, '00_main.graph.yaml');
  const result = spawnSync('node', [harnessCli, 'graph', 'yaml', 'compile', '--all', '--input', tmp], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Generated:/);
  assert.ok(fs.existsSync(path.join(tmp, '00_main.md')));
});

test('CLI graph yaml check --all', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-graph-yaml-'));
  writeSample(tmp, '00_main.graph.yaml');
  writeGraphJson(tmp);
  const result = spawnSync(
    'node',
    [harnessCli, 'graph', 'yaml', 'check', '--all', '--input', tmp, '--graph-json', path.join(tmp, 'graph.json')],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /OK: 00_main/);
});

function yamlToObj(text) {
  // 依赖 js-yaml 已在 lib/graph-yaml.js 导入；此处用简单 eval 仅做测试辅助
  return loadYamlFromText(text);
}

function loadYamlFromText(text) {
  const tmpFile = path.join(os.tmpdir(), `cyning-graph-yaml-test-${Date.now()}.yaml`);
  fs.writeFileSync(tmpFile, text, 'utf8');
  const data = loadYaml(tmpFile);
  fs.unlinkSync(tmpFile);
  return data;
}

function objToYaml(obj) {
  // 简易 YAML 序列化，仅用于测试差异场景
  const lines = [];
  lines.push(`schema_version: "${obj.schema_version}"`);
  lines.push(`graph_id: "${obj.graph_id}"`);
  lines.push(`title: "${obj.title}"`);
  lines.push(`description: "${obj.description}"`);
  lines.push(`version: "${obj.version}"`);
  lines.push(`direction: "${obj.direction}"`);
  lines.push('nodes:');
  for (const n of obj.nodes) {
    lines.push(`  - id: "${n.id}"`);
    lines.push(`    label: "${n.label}"`);
  }
  lines.push('edges:');
  for (const e of obj.edges) {
    lines.push(`  - from: "${e.from}"`);
    lines.push(`    to: "${e.to}"`);
    if (e.label) lines.push(`    label: "${e.label}"`);
  }
  return lines.join('\n');
}
