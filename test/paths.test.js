import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  resolveHarnessRoot,
  resolveHarnessRootForTarget,
} from '../lib/paths.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('resolveHarnessRoot 优先 env CYNING_HARNESS', () => {
  const original = process.env.CYNING_HARNESS;
  process.env.CYNING_HARNESS = '/tmp/fake-harness';
  try {
    assert.equal(resolveHarnessRoot(), '/tmp/fake-harness');
  } finally {
    if (original === undefined) {
      delete process.env.CYNING_HARNESS;
    } else {
      process.env.CYNING_HARNESS = original;
    }
  }
});

test('resolveHarnessRootForTarget 优先 env CYNING_HARNESS', () => {
  const original = process.env.CYNING_HARNESS;
  process.env.CYNING_HARNESS = '/tmp/fake-env';
  try {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-paths-'));
    assert.equal(resolveHarnessRootForTarget(target), '/tmp/fake-env');
  } finally {
    if (original === undefined) {
      delete process.env.CYNING_HARNESS;
    } else {
      process.env.CYNING_HARNESS = original;
    }
  }
});

test('resolveHarnessRootForTarget 读 target/.cyning-harness/local.json', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-paths-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'local.json'),
    JSON.stringify({ cyning_harness_root: repoRoot }),
  );

  const original = process.env.CYNING_HARNESS;
  delete process.env.CYNING_HARNESS;
  try {
    assert.equal(resolveHarnessRootForTarget(target), repoRoot);
  } finally {
    if (original !== undefined) {
      process.env.CYNING_HARNESS = original;
    }
  }
});

test('resolveHarnessRootForTarget local.json 无效时回退 npm 包根', () => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'cyning-harness-paths-'));
  fs.mkdirSync(path.join(target, '.cyning-harness'), { recursive: true });
  fs.writeFileSync(
    path.join(target, '.cyning-harness', 'local.json'),
    JSON.stringify({ cyning_harness_root: '/nonexistent/path' }),
  );

  const original = process.env.CYNING_HARNESS;
  delete process.env.CYNING_HARNESS;
  try {
    assert.equal(resolveHarnessRootForTarget(target), repoRoot);
  } finally {
    if (original !== undefined) {
      process.env.CYNING_HARNESS = original;
    }
  }
});
