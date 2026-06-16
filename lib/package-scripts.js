import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SCRIPTS = {
  'harness:verify': 'harness verify',
  'harness:gate': 'harness gate-check',
  'harness:audit': 'harness audit',
};

function detectPackageManager(target) {
  if (fs.existsSync(path.join(target, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(target, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(target, 'package-lock.json'))) return 'npm';
  return 'npm';
}

/**
 * 在 target 仓的 package.json 中 merge devDep + scripts（不覆盖已有 key）。
 * @returns {{ok: boolean, skipped?: boolean, reason?: string, changed: boolean}}
 */
export function mergePackageScripts(target, version, pm = 'auto') {
  const pkgPath = path.join(target, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return {
      ok: true,
      skipped: true,
      reason: '未找到 package.json，跳过 --with-scripts',
      changed: false,
    };
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const original = JSON.stringify(pkg);

  if (!pkg.devDependencies) pkg.devDependencies = {};
  if (pkg.devDependencies['@cyning/harness'] !== version) {
    pkg.devDependencies['@cyning/harness'] = version;
  }

  if (!pkg.scripts) pkg.scripts = {};
  for (const [key, value] of Object.entries(DEFAULT_SCRIPTS)) {
    if (!Object.prototype.hasOwnProperty.call(pkg.scripts, key)) {
      pkg.scripts[key] = value;
    }
  }

  if (JSON.stringify(pkg) !== original) {
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    return {
      ok: true,
      skipped: false,
      changed: true,
      pm: pm === 'auto' ? detectPackageManager(target) : pm,
      reason: `已写入 @cyning/harness@${version} 与 scripts`,
    };
  }

  return {
    ok: true,
    skipped: false,
    changed: false,
    pm: pm === 'auto' ? detectPackageManager(target) : pm,
    reason: 'package.json 已包含所需 devDep/scripts',
  };
}
