import fs from 'node:fs';
import path from 'node:path';

export const WIKI_GRAPH_SCHEMA = 'harness.wiki_graph.v1';

/**
 * 扫描 wiki 根目录，导出节点与边（wikilink + 相对 md 链）。
 * @returns {{ schema: string, root: string, nodes: object[], edges: object[], warnings: string[] }}
 */
export function exportWikiGraph(repoRoot, options = {}) {
  const rootRel = (options.root || 'docs/coding_wiki').replace(/^\.\/+/, '').replace(/\\/g, '/');
  const absRoot = path.join(repoRoot, rootRel);
  const warnings = [];

  if (!fs.existsSync(absRoot)) {
    const err = new Error(`wiki 根不存在: ${rootRel}`);
    err.code = 'wiki_root_missing';
    throw err;
  }

  const files = listMarkdownFiles(absRoot);
  const nodes = [];
  const nodeByStem = new Map();
  const nodeByRel = new Map();

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
    const stem = path.basename(abs, path.extname(abs));
    const title = extractTitle(fs.readFileSync(abs, 'utf8')) || stem;
    const node = { id: rel, path: rel, title };
    nodes.push(node);
    nodeByRel.set(rel, node);
    nodeByStem.set(stem.toLowerCase(), node);
  }

  const edges = [];
  const edgeKey = new Set();

  const pushEdge = (source, target, kind) => {
    if (!source || !target || source === target) return;
    const key = `${source}|${target}|${kind}`;
    if (edgeKey.has(key)) return;
    edgeKey.add(key);
    edges.push({ source, target, kind });
  };

  for (const abs of files) {
    const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
    const content = fs.readFileSync(abs, 'utf8');
    const dir = path.dirname(abs);

    for (const name of extractWikilinks(content)) {
      const target = resolveWikilink(name, nodeByStem, nodeByRel, repoRoot, dir);
      if (target) pushEdge(rel, target, 'wikilink');
      else warnings.push(`未解析 wikilink [[${name}]] @ ${rel}`);
    }

    for (const href of extractMdRelLinks(content)) {
      const targetAbs = path.resolve(dir, href.split('#')[0]);
      if (!targetAbs.startsWith(absRoot)) continue;
      if (!fs.existsSync(targetAbs)) {
        warnings.push(`md 链目标不存在: ${href} @ ${rel}`);
        continue;
      }
      const targetRel = path.relative(repoRoot, targetAbs).replace(/\\/g, '/');
      if (nodeByRel.has(targetRel)) pushEdge(rel, targetRel, 'md_link');
    }
  }

  return {
    schema: WIKI_GRAPH_SCHEMA,
    root: rootRel,
    nodes,
    edges,
    warnings,
  };
}

function listMarkdownFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const p = path.join(d, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.md$/i.test(ent.name)) out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : null;
}

function extractWikilinks(content) {
  const names = [];
  const re = /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    names.push(m[1].trim());
  }
  return names;
}

function extractMdRelLinks(content) {
  const hrefs = [];
  const re = /\[[^\]]*\]\((\.\/[^)\s]+\.md(?:#[^)\s]*)?|\.\.\/[^)\s]+\.md(?:#[^)\s]*)?)\)/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    hrefs.push(m[1].trim());
  }
  return hrefs;
}

function resolveWikilink(name, nodeByStem, nodeByRel, repoRoot, fromDir) {
  const cleaned = name.replace(/\\/g, '/').replace(/\.md$/i, '');
  const byStem = nodeByStem.get(path.basename(cleaned).toLowerCase());
  if (byStem) return byStem.path;

  const asRel = cleaned.replace(/^\.\/+/, '');
  if (nodeByRel.has(asRel)) return asRel;
  if (nodeByRel.has(`${asRel}.md`)) return `${asRel}.md`;

  const fromRepo = path.relative(repoRoot, path.resolve(fromDir, cleaned)).replace(/\\/g, '/');
  if (nodeByRel.has(fromRepo)) return fromRepo;
  if (nodeByRel.has(`${fromRepo}.md`)) return `${fromRepo}.md`;

  return null;
}
