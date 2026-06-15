import { readManifest, isNewerVersion } from './manifest.js';
import {
  resolveHarnessRoot,
  resolvePackageVersion,
  resolveTarget,
  wizardScript,
} from './paths.js';
import { runBash } from './run.js';

function usage() {
  console.log(`@cyning/harness · cyning-harness CLI (v0.3+)

用法:
  npx @cyning/harness init [--preset NAME] [--ide LIST] [--target PATH] [--yes]
  npx @cyning/harness upgrade [--target PATH] [--ide LIST] [--yes] [--force] [--gate-check]
  npx @cyning/harness check [--target PATH]

说明:
  init     首次接入 · 内部调用 wizard/install.sh + harness-sync.sh apply
  upgrade  升级已接入仓 · 等价 wizard/upgrade.sh --yes
  check    读 manifest.json · 对比当前包版本是否有可升级版本

环境:
  CYNING_HARNESS   覆盖产品包根（维护者本地 clone 开发）
  HARNESS_VERSION  覆盖写入 manifest 的版本号
`);
}

function takeOption(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx + 1 >= args.length) {
    return { value: undefined, rest: args };
  }
  const value = args[idx + 1];
  const rest = args.slice(0, idx).concat(args.slice(idx + 2));
  return { value, rest };
}

export async function runCli(argv) {
  const harnessRoot = resolveHarnessRoot();
  const pkgVersion = resolvePackageVersion(harnessRoot);

  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    usage();
    return;
  }

  const [cmd, ...rest] = argv;

  if (cmd === 'init') {
    await cmdInit(rest, harnessRoot, pkgVersion);
    return;
  }
  if (cmd === 'upgrade') {
    await cmdUpgrade(rest, harnessRoot, pkgVersion);
    return;
  }
  if (cmd === 'check') {
    await cmdCheck(rest, harnessRoot, pkgVersion);
    return;
  }

  const err = new Error(`未知命令: ${cmd}\n`);
  err.exitCode = 1;
  throw err;
}

async function cmdInit(args, harnessRoot, pkgVersion) {
  const yes = args.includes('--yes');
  let rest = args.filter((a) => a !== '--yes');
  const { value: preset, rest: r1 } = takeOption(rest, '--preset');
  rest = r1;
  const { value: ide, rest: r2 } = takeOption(rest, '--ide');
  rest = r2;
  const { value: targetArg, rest: r3 } = takeOption(rest, '--target');
  rest = r3;

  if (rest.length > 0) {
    const err = new Error(`init 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const installSh = wizardScript(harnessRoot, 'install.sh');
  const installArgs = ['--target', target];
  if (preset) installArgs.push('--preset', preset);
  if (ide) installArgs.push('--ide', ide);

  runBash(installSh, installArgs, {
    env: {
      CYNING_HARNESS: harnessRoot,
      HARNESS_VERSION: pkgVersion,
    },
    inherit: true,
  });

  console.log(`manifest: ${target}/.cyning-harness/manifest.json`);
  if (!yes) {
    console.log('init 完成。');
  }
}

async function cmdUpgrade(args, harnessRoot, pkgVersion) {
  const checkOnly = args.includes('--check');
  const force = args.includes('--force');
  const gateCheck = args.includes('--gate-check');
  const yes = args.includes('--yes') || !checkOnly;
  let rest = args.filter(
    (a) => !['--check', '--force', '--gate-check', '--yes'].includes(a),
  );
  const { value: ide, rest: r1 } = takeOption(rest, '--ide');
  rest = r1;
  const { value: targetArg, rest: r2 } = takeOption(rest, '--target');
  rest = r2;

  if (rest.length > 0) {
    const err = new Error(`upgrade 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);

  if (checkOnly) {
    await cmdCheck(['--target', target], harnessRoot, pkgVersion);
    return;
  }

  const upgradeSh = wizardScript(harnessRoot, 'upgrade.sh');
  const upgradeArgs = ['--target', target];
  if (ide) upgradeArgs.push('--ide', ide);
  if (yes) upgradeArgs.push('--yes');
  if (force) upgradeArgs.push('--force');
  if (gateCheck) upgradeArgs.push('--gate-check');

  runBash(upgradeSh, upgradeArgs, {
    env: {
      CYNING_HARNESS: harnessRoot,
      HARNESS_VERSION: pkgVersion,
      ...(force ? { HARNESS_SYNC_FORCE: '1' } : {}),
    },
    inherit: true,
  });
}

async function cmdCheck(args, harnessRoot, pkgVersion) {
  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;

  if (rest.length > 0) {
    const err = new Error(`check 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const manifest = readManifest(target);

  console.log(`目标: ${target}`);
  console.log(`包版本: ${pkgVersion}`);

  if (!manifest) {
    console.log('状态: 未接入（无 .cyning-harness/manifest.json）');
    console.log('建议: npx @cyning/harness init --preset harness-only --ide cursor,agents');
    return;
  }

  console.log(`manifest.version: ${manifest.version}`);
  console.log(`manifest.preset: ${manifest.preset}`);
  console.log(`manifest.ide: ${(manifest.ide || []).join(',')}`);

  if (isNewerVersion(manifest.version, pkgVersion)) {
    console.log('状态: 可升级');
    console.log(`建议: npx @cyning/harness upgrade --target ${target}`);
  } else {
    console.log('状态: 已是最新（或版本不可 semver 比较且相同）');
  }
}
