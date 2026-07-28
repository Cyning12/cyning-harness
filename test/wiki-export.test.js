import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { exportWikiGraph, WIKI_GRAPH_SCHEMA } from '../lib/wiki-export.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const harnessBin = path.join(repoRoot, 'bin', 'harness.js');
const fixtureRoot = path.join(repoRoot, 'test/fixtures/wiki_graph_mini');

test('exportWikiGraph · fixture nodes/edges', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-ex-'));
  const dest = path.join(dir, 'docs/coding_wiki');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(fixtureRoot, dest, { recursive: true });
  const g = exportWikiGraph(dir);
  assert.equal(g.schema, WIKI_GRAPH_SCHEMA);
  assert.equal(g.nodes.length, 3);
  assert.ok(g.edges.length >= 3);
  assert.ok(g.edges.some((e) => e.kind === 'wikilink'));
  assert.ok(g.edges.some((e) => e.kind === 'md_link'));
});

test('wiki export --json CLI', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-cli-'));
  const dest = path.join(dir, 'docs/coding_wiki');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(fixtureRoot, dest, { recursive: true });
  const r = spawnSync(process.execPath, [harnessBin, 'wiki', 'export', '--json', '--target', dir], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const j = JSON.parse(r.stdout);
  assert.equal(j.schema, WIKI_GRAPH_SCHEMA);
  assert.equal(j.nodes.length, 3);
});

test('wiki export · 无根 → exit 2', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wiki-miss-'));
  const r = spawnSync(process.execPath, [harnessBin, 'wiki', 'export', '--json', '--target', dir], {
    encoding: 'utf8',
  });
  assert.equal(r.status, 2);
});

test('wiki export · 产品 coding_wiki/templates 互链 edges≥1', () => {
  const templates = path.join(repoRoot, 'coding_wiki/templates');
  const g = exportWikiGraph(repoRoot, { root: 'coding_wiki/templates' });
  assert.ok(g.nodes.length >= 3, `nodes=${g.nodes.length}`);
  assert.ok(g.edges.length >= 1, `edges=${g.edges.length}`);
  assert.ok(g.edges.some((e) => e.kind === 'wikilink'));
  const r = spawnSync(
    process.execPath,
    [harnessBin, 'wiki', 'export', '--json', '--root', 'coding_wiki/templates'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const j = JSON.parse(r.stdout);
  assert.ok(j.edges.length >= 1);
  void templates;
});
