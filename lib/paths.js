import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** npm 包根 = cyning-harness 产品包根 */
export function resolveHarnessRoot() {
  if (process.env.CYNING_HARNESS) {
    return path.resolve(process.env.CYNING_HARNESS);
  }
  return path.resolve(__dirname, '..');
}

export function resolvePackageVersion(harnessRoot) {
  if (process.env.HARNESS_VERSION) {
    return process.env.HARNESS_VERSION;
  }
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(harnessRoot, 'package.json'), 'utf8'),
    );
    if (pkg.version) return pkg.version;
  } catch {
    // fall through
  }
  return 'unknown';
}

export function resolveTarget(cwd, targetArg) {
  return path.resolve(targetArg || cwd);
}

export function wizardScript(harnessRoot, name) {
  return path.join(harnessRoot, 'wizard', name);
}
