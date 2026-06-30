#!/usr/bin/env node
/**
 * graph_yaml_compile.js
 * 读取 cyning-harness/graph/templates/*.graph.yaml，生成同名 .md
 * 生成物包含：YAML frontmatter、Mermaid flowchart、Nodes/Edges table
 * 支持 --check：不写入文件，仅做 drift 检查
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const TEMPLATES_DIR = path.resolve(process.cwd(), 'graph', 'templates');
const CHECK = process.argv.includes('--check');

function shapeForNode(node) {
  const label = String(node.label || node.id);
  if (label.startsWith('>')) return `[${label}]`;       // 文档指针
  if (label.startsWith('?') || label.endsWith('?')) return `{${label}}`; // 判断
  if (label.includes('数据库') || label.includes('持久化') || label.includes('存储')) return `[(${label})]`;
  if (label.includes('日志')) return `(( ${label} ))`;
  return `[[${label}]]`;
}

function edgeMark(edge) {
  if (edge.mark) return edge.mark;
  const label = edge.label || '';
  if (label === '->') return '';
  return label;
}

function escapeMermaidLabel(label) {
  return String(label).replace(/"/g, '#quot;');
}

function renderMermaid(graph) {
  const lines = ['```mermaid', 'flowchart TD'];

  // 节点定义
  for (const node of graph.nodes || []) {
    const id = node.id;
    const shape = shapeForNode(node);
    // Mermaid 语法：id[label] / id[[label]] 等
    lines.push(`    ${id}${shape}`);
  }

  // 边
  for (const edge of graph.edges || []) {
    const mark = edgeMark(edge);
    const from = edge.from;
    const to = edge.to;
    if (mark) {
      lines.push(`    ${from} --"${escapeMermaidLabel(mark)}"--> ${to}`);
    } else {
      lines.push(`    ${from} --> ${to}`);
    }
  }

  // 锚点注释（仅 .ai.md 风格，这里作为生成备注）
  lines.push('    %% 锚点：见 YAML 源 edges[].anchors');

  lines.push('```');
  return lines.join('\n');
}

function renderTables(graph) {
  const nodeRows = (graph.nodes || [])
    .map(n => `| ${n.id} | ${n.label || ''} |`)
    .join('\n');

  const edgeRows = (graph.edges || [])
    .map(e => {
      const label = e.label || e.mark || '';
      const type = e.type || '';
      const anchors = (e.anchors || [])
        .map(a => `${a.path}${a.line ? `#L${a.line}` : a.symbol ? `::${a.symbol}` : ''}`)
        .join(', ');
      return `| ${e.from} | ${e.to} | ${label} | ${type} | ${anchors} |`;
    })
    .join('\n');

  return [
    '## Nodes',
    '',
    '| ID | Label |',
    '|----|-------|',
    nodeRows,
    '',
    '## Edges',
    '',
    '| From | To | Label | Type | Anchors |',
    '|------|----|-------|------|---------|',
    edgeRows,
    ''
  ].join('\n');
}

function renderMarkdown(graph, sourceFileName) {
  const frontmatter = {
    graph_id: graph.graph_id,
    title: graph.title,
    description: graph.description,
    version: graph.version,
    generated_from: sourceFileName,
    generator: 'scripts/graph_yaml_compile.js'
  };

  const parts = [
    '---',
    yaml.dump(frontmatter).trim(),
    '---',
    '',
    `# ${graph.title}`,
    '',
    `> ${graph.description}`,
    '',
    `> **源文件**：\`${sourceFileName}\` · 由 \`scripts/graph_yaml_compile.js\` 生成 · 请勿直接手写本文件`,
    '',
    renderMermaid(graph),
    '',
    renderTables(graph)
  ];

  return parts.join('\n');
}

function normalizeMd(md) {
  return md.replace(/\r\n/g, '\n').trim();
}

function main() {
  const files = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.graph.yaml'))
    .sort();

  if (files.length === 0) {
    console.error('No .graph.yaml files found in', TEMPLATES_DIR);
    process.exit(1);
  }

  let drift = false;

  for (const file of files) {
    const yamlPath = path.join(TEMPLATES_DIR, file);
    const mdName = file.replace(/\.graph\.yaml$/, '.md');
    const mdPath = path.join(TEMPLATES_DIR, mdName);

    const raw = fs.readFileSync(yamlPath, 'utf8');
    let graph;
    try {
      graph = yaml.load(raw);
    } catch (err) {
      console.error(`YAML parse error in ${file}:`, err.message);
      process.exit(1);
    }

    const rendered = renderMarkdown(graph, file);

    if (CHECK) {
      if (!fs.existsSync(mdPath)) {
        console.error(`[DRIFT] ${mdName} missing (expected from ${file})`);
        drift = true;
        continue;
      }
      const existing = fs.readFileSync(mdPath, 'utf8');
      if (normalizeMd(existing) !== normalizeMd(rendered)) {
        console.error(`[DRIFT] ${mdName} is out of sync with ${file}`);
        drift = true;
      } else {
        console.log(`[OK] ${mdName} in sync with ${file}`);
      }
    } else {
      fs.writeFileSync(mdPath, rendered, 'utf8');
      console.log(`[GENERATED] ${mdName}`);
    }
  }

  if (CHECK && drift) {
    process.exit(1);
  }
}

main();
