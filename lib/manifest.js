import fs from 'node:fs';
import path from 'node:path';

export function manifestPath(targetRoot) {
  return path.join(targetRoot, '.cyning-harness', 'manifest.json');
}

export function readManifest(targetRoot) {
  const file = manifestPath(targetRoot);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** 比较 semver 前缀；非 semver 时做字符串相等判断 */
export function normalizeVersion(version) {
  if (!version || version === 'unknown') return version;
  const m = String(version).match(/^v?(\d+\.\d+\.\d+)/);
  return m ? m[1] : String(version);
}

export function isNewerVersion(current, latest) {
  const a = normalizeVersion(current);
  const b = normalizeVersion(latest);
  if (!a || !b || a === 'unknown' || b === 'unknown') {
    return current !== latest;
  }
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (db > da) return true;
    if (db < da) return false;
  }
  return false;
}
