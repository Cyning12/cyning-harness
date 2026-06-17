import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const SCHEMA_VERSION = 'inform_graph.v3';
const FREEZE_ID = 'TECH_GRAPH_S2_FREEZE_20260519_V2_3';

export class GraphYamlError extends Error {
  constructor(message, { path: filePath = null, line = null } = {}) {
    super(message);
    this.name = 'GraphYamlError';
    this.filePath = filePath;
    this.line = line;
  }
}

export function loadYaml(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return yaml.load(raw);
  } catch (err) {
    const line = err.mark ? err.mark.line + 1 : null;
    throw new GraphYamlError(`YAML 解析失败: ${err.message}`, { path: filePath, line });
  }
}

export function validateGraphYaml(data, filePath = null) {
  const errors = [];

  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    errors.push('根节点须为 object');
    return errors;
  }

  const required = ['graph_id', 'title', 'nodes', 'edges'];
  for (const key of required) {
    if (!(key in data)) errors.push(`缺少必填字段: ${key}`);
  }

  if (data.schema_version != null && data.schema_version !== SCHEMA_VERSION) {
    errors.push(`schema_version 建议为 ${SCHEMA_VERSION}，实际为 ${data.schema_version}`);
  }

  if (data.graph_id != null && !/^[a-zA-Z0-9_]+$/.test(String(data.graph_id))) {
    errors.push(`graph_id 非法: ${data.graph_id}`);
  }

  if (data.nodes != null) {
    if (!Array.isArray(data.nodes)) {
      errors.push('nodes 须为 array');
    } else {
      const seen = new Set();
      for (let i = 0; i < data.nodes.length; i += 1) {
        const n = data.nodes[i];
        if (n == null || typeof n !== 'object' || Array.isArray(n)) {
          errors.push(`nodes[${i}] 须为 object`);
          continue;
        }
        if (!n.id) errors.push(`nodes[${i}] 缺少 id`);
        else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(n.id))) {
          errors.push(`nodes[${i}].id 非法: ${n.id}`);
        }
        if (!n.label) errors.push(`nodes[${i}] 缺少 label`);
        if (n.id && seen.has(n.id)) errors.push(`重复节点 id: ${n.id}`);
        if (n.id) seen.add(n.id);
        if (n.kind != null && !['flow', 'struct', 'external'].includes(n.kind)) {
          errors.push(`nodes[${i}].kind 非法: ${n.kind}`);
        }
      }
    }
  }

  if (data.edges != null) {
    if (!Array.isArray(data.edges)) {
      errors.push('edges 须为 array');
    } else {
      const nodeIds = new Set((data.nodes || []).map((n) => n?.id).filter(Boolean));
      for (let i = 0; i < data.edges.length; i += 1) {
        const e = data.edges[i];
        if (e == null || typeof e !== 'object' || Array.isArray(e)) {
          errors.push(`edges[${i}] 须为 object`);
          continue;
        }
        if (!e.from) errors.push(`edges[${i}] 缺少 from`);
        if (!e.to) errors.push(`edges[${i}] 缺少 to`);
        if (e.from && !nodeIds.has(e.from)) errors.push(`edges[${i}] 引用未知节点: ${e.from}`);
        if (e.to && !nodeIds.has(e.to)) errors.push(`edges[${i}] 引用未知节点: ${e.to}`);
        if (e.anchors != null) {
          if (!Array.isArray(e.anchors)) {
            errors.push(`edges[${i}].anchors 须为 array`);
          } else {
            for (let j = 0; j < e.anchors.length; j += 1) {
              const a = e.anchors[j];
              if (!a || typeof a !== 'object') {
                errors.push(`edges[${i}].anchors[${j}] 须为 object`);
              } else if (!a.path) {
                errors.push(`edges[${i}].anchors[${j}] 缺少 path`);
              }
            }
          }
        }
      }
    }
  }

  if (errors.length > 0 && filePath) {
    return errors.map((e) => `${filePath}: ${e}`);
  }
  return errors;
}

export function allGraphIds(inputRoot) {
  if (!fs.existsSync(inputRoot)) return [];
  return fs
    .readdirSync(inputRoot)
    .filter((name) => name.endsWith('.graph.yaml'))
    .map((name) => name.slice(0, -'.graph.yaml'.length))
    .sort();
}

export function yamlPathFor(inputRoot, graphId) {
  return path.join(inputRoot, `${graphId}.graph.yaml`);
}

export function mdPathFor(inputRoot, graphId) {
  return path.join(inputRoot, `${graphId}.md`);
}

function utcNowIsoZ() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function classifyLabel(label) {
  const t = String(label || '').trim();
  if (t.startsWith('::') && t.length > 2) return [t.slice(2).trim() || 'meta', true];
  if (t.includes('~>')) return ['async_calls', false];
  if (t.includes('?>') || t === '?>') return ['condition', true];
  return ['depends_on', true];
}

function edgeToGraphV2(edge) {
  const mark = edge.mark || '';
  const label = edge.label || '';
  const explicitType = edge.type || '';

  let baseMark;
  let baseLabel;
  let inferredType;

  if (mark) {
    if (mark === 'classDiagram') {
      baseMark = 'classDiagram';
      baseLabel = '';
      inferredType = 'has_metadata';
    } else if (mark === '~>') {
      baseMark = '~>';
      baseLabel = '';
      inferredType = 'async_calls';
    } else if (mark === '?>') {
      baseMark = '?>';
      baseLabel = '';
      inferredType = 'condition';
    } else if (mark.startsWith('::')) {
      baseMark = mark;
      baseLabel = '';
      inferredType = mark.slice(2) || 'meta';
    } else if (mark.startsWith('[') && mark.endsWith(']')) {
      baseMark = mark;
      baseLabel = '';
      inferredType = 'depends_on';
    } else if (mark === '->') {
      baseMark = '->';
      baseLabel = label;
      inferredType = label ? classifyLabel(label)[0] : 'depends_on';
    } else {
      baseMark = mark;
      baseLabel = label;
      inferredType = label ? classifyLabel(label)[0] : 'depends_on';
    }
  } else {
    baseMark = '->';
    baseLabel = label;
    if (!label) {
      inferredType = 'depends_on';
    } else if (label === 'classDiagram') {
      baseMark = 'classDiagram';
      baseLabel = '';
      inferredType = 'has_metadata';
    } else if (label === '?>') {
      baseMark = '?>';
      baseLabel = '';
      inferredType = 'condition';
    } else if (label.startsWith('::')) {
      baseMark = label;
      baseLabel = '';
      inferredType = label.slice(2) || 'meta';
    } else {
      inferredType = classifyLabel(label)[0];
    }
  }

  const finalType = explicitType || inferredType;
  const sync = finalType !== 'async_calls';
  return { mark: baseMark, type: finalType, sync, label: baseLabel };
}

function normalizeAnchors(anchors) {
  if (!anchors) return [];
  return anchors.map((a) => {
    const out = { path: a.path, symbol: a.symbol || '' };
    if (a.line != null) out.line = a.line;
    return out;
  });
}

export function buildGraphPayload(inputRoot, { generatedAt = null, freezeId = FREEZE_ID } = {}) {
  if (!fs.existsSync(inputRoot)) {
    throw new GraphYamlError(`输入目录不存在: ${inputRoot}`);
  }

  const graphIds = allGraphIds(inputRoot);
  const nodes = [];
  const edges = [];
  const graphs = [];

  for (const graphId of graphIds) {
    const yamlPath = yamlPathFor(inputRoot, graphId);
    const data = loadYaml(yamlPath);
    const validationErrors = validateGraphYaml(data, yamlPath);
    if (validationErrors.length > 0) {
      throw new GraphYamlError(validationErrors.join('\n'));
    }

    graphs.push({
      id: graphId,
      title: data.title,
      source_yaml_path: path.relative(inputRoot, yamlPath).replace(/\\/g, '/'),
    });

    for (const n of data.nodes) {
      nodes.push({
        id: n.id,
        label: n.label,
        graph_id: graphId,
      });
    }

    for (const e of data.edges) {
      const { mark, type, sync, label } = edgeToGraphV2(e);
      edges.push({
        from: e.from,
        to: e.to,
        mark,
        type,
        sync,
        label,
        anchors: normalizeAnchors(e.anchors),
        graph_id: graphId,
      });
    }
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => {
    const keys = ['graph_id', 'from', 'to', 'mark', 'type', 'sync', 'label'];
    for (const k of keys) {
      const va = a[k] ?? '';
      const vb = b[k] ?? '';
      if (va !== vb) return String(va).localeCompare(String(vb));
    }
    return 0;
  });

  return {
    schema_version: 'graph_v2',
    freeze_id: freezeId,
    generated_at: generatedAt || utcNowIsoZ(),
    nodes,
    edges,
    graphs,
  };
}

function formatAnchorComment(anchor) {
  const p = anchor.path || '';
  const symbol = anchor.symbol || '';
  const line = anchor.line;
  if (!p) return '';
  if (line != null) return `// → ${p}#L${line}`;
  if (symbol) return `// → ${p}::${symbol}`;
  return `// → ${p}`;
}

function generateMermaid(data) {
  const nodes = new Map((data.nodes || []).map((n) => [n.id, n]));
  const direction = data.direction || 'TD';
  const lines = [`flowchart ${direction}`];

  for (const [nid, node] of nodes) {
    const label = node.label || nid;
    let shape;
    if (label.startsWith('>')) {
      shape = `[${label}]`;
    } else if (label.includes('子流程') || label.endsWith('子流程')) {
      shape = `[[${label}]]`;
    } else if (nid === 'Q' || nid === 'E') {
      shape = `[[${label}]]`;
    } else if (nid.includes('DOC')) {
      shape = `[>${label}]`;
    } else {
      shape = `[${label}]`;
    }
    lines.push(`    ${nid}${shape}`);
  }

  lines.push('');

  for (const e of data.edges || []) {
    const src = e.from;
    const dst = e.to;
    const mark = e.mark || '->';
    const label = e.label || '';

    let edgeLine;
    if (label) {
      edgeLine = `    ${src} --"${label}"--> ${dst}`;
    } else if (mark && mark !== '->') {
      edgeLine = `    ${src} --"${mark}"--> ${dst}`;
    } else {
      edgeLine = `    ${src} --> ${dst}`;
    }
    lines.push(edgeLine);

    for (const a of e.anchors || []) {
      const comment = formatAnchorComment(a);
      if (comment) lines.push(`    ${comment}`);
    }
  }

  lines.push('');
  lines.push('    classDef phase fill:#e1f5fe,stroke:#01579b,stroke-width:2px');
  lines.push('    classDef doc fill:#fff8e1,stroke:#ff6f00,stroke-width:1px');
  lines.push('    classDef infra fill:#e8f5e9,stroke:#2e7d32,stroke-width:1px');

  const phaseNodes = [...nodes.keys()].filter((n) => ['Q', 'E', 'U1', 'U2', 'RAG', 'T2S', 'RPC', 'FTS'].includes(n));
  const docNodes = [...nodes.keys()].filter((n) => n.includes('DOC'));
  const infraNodes = [...nodes.keys()].filter((n) => ['AUTH', 'EV_TYPES'].includes(n));

  if (phaseNodes.length) lines.push(`    class ${phaseNodes.join(',')} phase`);
  if (docNodes.length) lines.push(`    class ${docNodes.join(',')} doc`);
  if (infraNodes.length) lines.push(`    class ${infraNodes.join(',')} infra`);

  return lines.join('\n');
}

function generateNodeTable(data) {
  const lines = ['### Nodes', '', '| ID | Label | Kind |', '|----|-------|------|'];
  for (const n of data.nodes || []) {
    const label = String(n.label || '').replace(/\|/g, '\\|');
    const kind = n.kind || '';
    lines.push(`| ${n.id} | ${label} | ${kind} |`);
  }
  return lines.join('\n');
}

function generateEdgeTable(data) {
  const lines = [
    '### Edges',
    '',
    '| From | To | Mark | Type | Label | Anchors |',
    '|------|----|------|------|-------|---------|',
  ];
  for (const e of data.edges || []) {
    const src = e.from || '';
    const dst = e.to || '';
    const mark = e.mark || '->';
    const type = e.type || 'depends_on';
    const label = String(e.label || '').replace(/\|/g, '\\|');
    const anchors = e.anchors || [];
    const anchorSummary = anchors.length ? `${anchors.length} anchor(s)` : '';
    lines.push(`| ${src} | ${dst} | ${mark} | ${type} | ${label} | ${anchorSummary} |`);
  }
  return lines.join('\n');
}

function generateNotesSection(data) {
  const notes = data.notes;
  if (!notes) return '';
  let body;
  if (typeof notes === 'string') body = notes;
  else if (Array.isArray(notes)) body = notes.join('\n\n');
  else body = String(notes);
  return `\n\n## Notes\n\n${body}\n`;
}

function generateSubGraphLinks(graphId) {
  if (graphId !== '00_main') return '';
  return [
    '## Sub-graph Links',
    '',
    "- `Struct`: [`01_struct.md`](01_struct.md)（手写 · 无 `.graph.yaml`）",
    "- `Version`: [`02_version.md`](02_version.md)（手写 · 无 `.graph.yaml`）",
    "- 子图编辑源见 `docs/_tech_graph/*.graph.yaml`",
    '',
  ].join('\n');
}

export function generateMarkdown(data, { sourcePath = null } = {}) {
  const graphId = data.graph_id || 'main';
  const title = data.title || graphId;
  const description = data.description || '';
  const version = data.version || '';
  const generatedAt = utcNowIsoZ();
  const src = sourcePath || `docs/_tech_graph/${graphId}.graph.yaml`;

  const frontmatter = `---
graph_id: ${graphId}
version: ${version}
generated_at: ${generatedAt}
source: ${src}
---
`;

  const header = `# ${title}\n\n${description}`.trim();
  const mermaid = generateMermaid(data);
  const subLinks = generateSubGraphLinks(graphId);
  const notes = generateNotesSection(data);

  const body = `${header}

## Mermaid

\`\`\`mermaid
${mermaid}
\`\`\`

## Structured Data

${generateNodeTable(data)}

${generateEdgeTable(data)}${notes}${subLinks ? `\n\n${subLinks}` : ''}
`;

  return frontmatter + '\n' + body;
}

export function compileGraph(graphId, inputRoot, outputPath = null) {
  const yamlPath = yamlPathFor(inputRoot, graphId);
  if (!fs.existsSync(yamlPath)) {
    throw new GraphYamlError(`YAML 源不存在: ${yamlPath}`);
  }
  const data = loadYaml(yamlPath);
  const validationErrors = validateGraphYaml(data, yamlPath);
  if (validationErrors.length > 0) {
    throw new GraphYamlError(validationErrors.join('\n'));
  }
  const md = generateMarkdown(data, { sourcePath: path.relative(inputRoot, yamlPath).replace(/\\/g, '/') });
  const outPath = outputPath || mdPathFor(inputRoot, graphId);
  fs.writeFileSync(outPath, md, 'utf8');
  return outPath;
}

export function loadGraphJson(graphJsonPath) {
  if (!fs.existsSync(graphJsonPath)) return null;
  const raw = fs.readFileSync(graphJsonPath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new GraphYamlError(`graph.json 解析失败: ${err.message}`, { path: graphJsonPath });
  }
}

export function extractGraphJsonSlice(graphJson, graphId) {
  const nodes = (graphJson?.nodes || []).filter((n) => n?.graph_id === graphId);
  const edges = (graphJson?.edges || []).filter(
    (e) => e?.graph_id === graphId && 'from' in e && 'to' in e,
  );
  return { nodes, edges };
}

export function diffGraphYaml(graphId, inputRoot, graphJsonPath) {
  const yamlPath = yamlPathFor(inputRoot, graphId);
  if (!fs.existsSync(yamlPath)) {
    throw new GraphYamlError(`YAML 源不存在: ${yamlPath}`);
  }
  const yamlData = loadYaml(yamlPath);
  const validationErrors = validateGraphYaml(yamlData, yamlPath);
  if (validationErrors.length > 0) {
    throw new GraphYamlError(validationErrors.join('\n'));
  }

  if (!fs.existsSync(graphJsonPath)) {
    return { ok: false, diff: `graph.json 不存在: ${graphJsonPath}` };
  }

  const graphJson = loadGraphJson(graphJsonPath);
  const jsonNodes = (graphJson?.nodes || []).filter((n) => n?.graph_id === graphId);
  const jsonEdges = (graphJson?.edges || []).filter(
    (e) => e?.graph_id === graphId && 'from' in e && 'to' in e,
  );

  const yamlNodes = new Map((yamlData.nodes || []).map((n) => [n.id, n]));
  const yamlNodeIds = new Set(yamlNodes.keys());
  const jsonNodeIds = new Set(jsonNodes.map((n) => n.id));

  const diffs = [];

  if (yamlNodeIds.size !== jsonNodeIds.size || ![...yamlNodeIds].every((id) => jsonNodeIds.has(id))) {
    const onlyYaml = [...yamlNodeIds].filter((id) => !jsonNodeIds.has(id));
    const onlyJson = [...jsonNodeIds].filter((id) => !yamlNodeIds.has(id));
    if (onlyYaml.length) diffs.push(`Nodes only in YAML: ${onlyYaml.sort().join(', ')}`);
    if (onlyJson.length) diffs.push(`Nodes only in JSON: ${onlyJson.sort().join(', ')}`);
  }

  if ((yamlData.nodes || []).length !== jsonNodes.length) {
    diffs.push(`Node count mismatch: YAML=${(yamlData.nodes || []).length}, JSON=${jsonNodes.length}`);
  }

  const yamlEdgeSet = new Set(
    (yamlData.edges || []).map((e) => {
      const { mark, type } = edgeToGraphV2(e);
      return JSON.stringify([e.from, e.to, mark, type]);
    }),
  );
  const jsonEdgeSet = new Set(
    jsonEdges.map((e) => JSON.stringify([e.from, e.to, e.mark || '->', e.type || 'depends_on'])),
  );

  if (yamlEdgeSet.size !== jsonEdgeSet.size || ![...yamlEdgeSet].every((k) => jsonEdgeSet.has(k))) {
    const onlyYaml = [...yamlEdgeSet].filter((k) => !jsonEdgeSet.has(k)).map((k) => JSON.parse(k));
    const onlyJson = [...jsonEdgeSet].filter((k) => !yamlEdgeSet.has(k)).map((k) => JSON.parse(k));
    if (onlyYaml.length) diffs.push(`Edges only in YAML: ${JSON.stringify(onlyYaml)}`);
    if (onlyJson.length) diffs.push(`Edges only in JSON: ${JSON.stringify(onlyJson)}`);
  }

  if ((yamlData.edges || []).length !== jsonEdges.length) {
    diffs.push(`Edge count mismatch: YAML=${(yamlData.edges || []).length}, JSON=${jsonEdges.length}`);
  }

  if (diffs.length === 0) return { ok: true, diff: '' };
  return { ok: false, diff: diffs.join('\n') };
}

export function checkGraph(graphId, inputRoot, graphJsonPath) {
  const result = diffGraphYaml(graphId, inputRoot, graphJsonPath);
  return result;
}
