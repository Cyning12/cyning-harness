import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { readManifest, isNewerVersion } from './manifest.js';
import {
  resolveHarnessRoot,
  resolveHarnessRootForTarget,
  resolvePackageVersion,
  resolveTarget,
  wizardScript,
} from './paths.js';
import { runBash } from './run.js';
import { checkTaskFile } from './task.js';
import { auditTarget } from './audit.js';
import { mergePackageScripts } from './package-scripts.js';
import {
  allGraphIds,
  checkGraph,
  compileGraph,
  GraphYamlError,
  yamlPathFor,
} from './graph-yaml.js';
import {
  buildSnapshot,
  checkAxioms,
  ingestRepoIdempotent,
  loadEvents,
  writeSnapshot,
} from './graph-hgm.js';

function usage(version = 'unknown') {
  console.log(`@cyning/harness · cyning-harness CLI (v${version})

用法:
  npx @cyning/harness --version | -V
  npx @cyning/harness --help | -h
  npx @cyning/harness init [--preset NAME] [--ide LIST] [--target PATH] [--yes] [--with-scripts] [--pm pnpm|npm|yarn|auto]
  npx @cyning/harness upgrade [--target PATH] [--ide LIST] [--yes] [--force] [--gate-check] [--with-scripts] [--pm pnpm|npm|yarn|auto]
  npx @cyning/harness check [--target PATH]
  npx @cyning/harness audit [--target PATH] [--task FILE]
  npx @cyning/harness gate-check [--target PATH] [--task FILE] [--graph] [--json]
  npx @cyning/harness verify [--target PATH] [--task FILE] [--graph] [--json] [--agent-hint] [--workspace-root PATH]
  npx @cyning/harness sync index [--target PATH]
  npx @cyning/harness task check --file PATH [--no-circular] [--registry DIR]...
  npx @cyning/harness graph yaml compile --graph-id ID [--input DIR] [--output FILE]
  npx @cyning/harness graph yaml check --graph-id ID [--input DIR] [--graph-json FILE]
  npx @cyning/harness graph yaml compile --all [--input DIR]
  npx @cyning/harness graph yaml check --all [--input DIR] [--graph-json FILE]
  npx @cyning/harness graph ingest [--target PATH] [--actor ACTOR] [--dry-run]
  npx @cyning/harness graph snapshot [--target PATH]
  npx @cyning/harness graph axioms check [--target PATH] [--json]

说明:
  init        首次接入 · 内部调用 wizard/install.sh + harness-sync.sh apply
  upgrade     升级已接入仓 · 等价 wizard/upgrade.sh --yes
  check       读 manifest.json · 对比当前包版本是否有可升级版本
  audit       ICVO 机械审计：复用 gate-check · D5 测试声明检查 · S5 git-clean 提醒
  gate-check  调用 wizard/gate-check.sh（业务仓无需 clone 即可用）
  verify      30 前聚合：gate-check + audit D5 + S5 warn + 可选 --graph
  sync index  生成 .cyning-harness/invoke_index.json
  task check  校验 task.harness.v1.json sidecar · --no-circular 检测 depends_on 环
  graph yaml    Inform 图谱 YAML 编译 / 校验（v1.1+）
  graph ingest  扫描业务仓 → 追加 HGM 事件（v2.0+）
  graph snapshot 事件重放 → graph/snapshot.json（v2.0+）
  graph axioms  跑 HGM 公理检查（v2.0+）

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
    usage(pkgVersion);
    return;
  }

  if (argv.includes('--version') || argv.includes('-V')) {
    console.log(pkgVersion);
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
  if (cmd === 'audit') {
    await cmdAudit(rest);
    return;
  }
  if (cmd === 'gate-check') {
    await cmdGateCheck(rest);
    return;
  }
  if (cmd === 'verify') {
    await cmdVerify(rest);
    return;
  }
  if (cmd === 'sync') {
    await cmdSync(rest);
    return;
  }
  if (cmd === 'task') {
    await cmdTask(rest);
    return;
  }
  if (cmd === 'graph') {
    await cmdGraph(rest);
    return;
  }

  const err = new Error(`未知命令: ${cmd}\n`);
  err.exitCode = 1;
  throw err;
}

async function cmdInit(args, harnessRoot, pkgVersion) {
  const yes = args.includes('--yes');
  const withScripts = args.includes('--with-scripts');
  let rest = args.filter((a) => a !== '--yes' && a !== '--with-scripts');
  const { value: preset, rest: r1 } = takeOption(rest, '--preset');
  rest = r1;
  const { value: ide, rest: r2 } = takeOption(rest, '--ide');
  rest = r2;
  const { value: targetArg, rest: r3 } = takeOption(rest, '--target');
  rest = r3;
  const { value: pm, rest: r4 } = takeOption(rest, '--pm');
  rest = r4;

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

  if (withScripts) {
    const ps = mergePackageScripts(target, pkgVersion, pm || 'auto');
    if (ps.skipped) {
      console.log(`warn: ${ps.reason}`);
    } else if (ps.changed) {
      console.log(`scripts: ${ps.reason}（pm: ${ps.pm}）`);
      console.log('提示: 运行 `pnpm install` 或对应 install 使 devDep 生效');
    } else {
      console.log(`scripts: ${ps.reason}`);
    }
  }

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
  const withScripts = args.includes('--with-scripts');
  let rest = args.filter(
    (a) =>
      ![
        '--check',
        '--force',
        '--gate-check',
        '--yes',
        '--with-scripts',
      ].includes(a),
  );
  const { value: ide, rest: r1 } = takeOption(rest, '--ide');
  rest = r1;
  const { value: targetArg, rest: r2 } = takeOption(rest, '--target');
  rest = r2;
  const { value: pm, rest: r3 } = takeOption(rest, '--pm');
  rest = r3;

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

  if (withScripts) {
    const ps = mergePackageScripts(target, pkgVersion, pm || 'auto');
    if (ps.skipped) {
      console.log(`warn: ${ps.reason}`);
    } else if (ps.changed) {
      console.log(`scripts: ${ps.reason}（pm: ${ps.pm}）`);
      console.log('提示: 运行 `pnpm install` 或对应 install 使 devDep 生效');
    } else {
      console.log(`scripts: ${ps.reason}`);
    }
  }
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

async function cmdAudit(args) {
  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;
  const { value: taskFile, rest: r2 } = takeOption(rest, '--task');
  rest = r2;

  if (rest.length > 0) {
    const err = new Error(`audit 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const result = auditTarget(target, { taskFile });

  console.log(`目标: ${target}`);
  if (taskFile) console.log(`task: ${taskFile}`);
  console.log(`audit: ${result.ok ? 'PASS' : 'FAIL'}`);

  // D3 gate-check
  console.log(`  gate-check: ${result.gate.ok ? 'PASS' : 'FAIL'}`);
  if (!result.gate.ok && result.gate.stdout) {
    for (const line of result.gate.stdout.split('\n')) {
      if (line.trim()) console.log(`    ${line}`);
    }
  }

  // D5 test
  console.log(`  test-check: ${result.test.ok ? 'PASS' : 'FAIL'}`);
  if (result.test.reason) console.log(`    ${result.test.reason}`);

  // S5 git-clean
  console.log(`  git-clean: ${result.git.dirty ? 'DIRTY' : 'CLEAN'}`);
  if (result.git.warning) console.log(`    ${result.git.warning}`);

  if (!result.ok) {
    const err = new Error('ICVO audit 未通过');
    err.exitCode = 2;
    throw err;
  }
}

async function cmdGateCheck(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`用法: npx @cyning/harness gate-check [--target PATH] [--task FILE] [--graph] [--json]`);
    return;
  }

  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;
  const { value: taskFile, rest: r2 } = takeOption(rest, '--task');
  rest = r2;
  const graph = rest.includes('--graph');
  const json = rest.includes('--json');
  rest = rest.filter((a) => a !== '--graph' && a !== '--json');

  if (rest.length > 0) {
    const err = new Error(`gate-check 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const harnessRoot = resolveHarnessRootForTarget(target);
  const script = wizardScript(harnessRoot, 'gate-check.sh');
  const childArgs = ['--target', target];
  if (taskFile) childArgs.push('--task', taskFile);
  if (graph) childArgs.push('--graph');
  if (json) childArgs.push('--json');

  const result = spawnSync('bash', [script, ...childArgs], {
    stdio: 'inherit',
    env: { ...process.env, CYNING_HARNESS: harnessRoot },
  });

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    const err = new Error('');
    err.exitCode = exitCode;
    throw err;
  }
}

async function cmdVerify(args) {
  // D3 · implemented in lib/verify.js
  const { verifyTarget, buildVerifyHandoff, formatAgentHint } = await import('./verify.js');
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`用法: npx @cyning/harness verify [--target PATH] [--task FILE] [--graph] [--json] [--agent-hint] [--workspace-root PATH]

无 --task 时：扫描 docs/tasks/active/task_*.md 并逐项列出闸表（同 gate-check）。
任一 task 阻塞则 VERIFY: BLOCKED · exit 2；全部可 30 则 VERIFY: PASS。
--json：输出 Agent handoff JSON（may_start_30 · entry_invoke_30 · review_path 等）。
--agent-hint：人类可读 handoff 摘要（可与 --json 同用）。
--workspace-root：解析 task 中 Projects/ 前缀的 entry_invoke 路径。
`);
    return;
  }

  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;
  const { value: taskFile, rest: r2 } = takeOption(rest, '--task');
  rest = r2;
  const { value: workspaceRoot, rest: r3 } = takeOption(rest, '--workspace-root');
  rest = r3;
  const graph = rest.includes('--graph');
  const json = rest.includes('--json');
  const agentHint = rest.includes('--agent-hint');
  rest = rest.filter((a) => a !== '--graph' && a !== '--json' && a !== '--agent-hint');

  if (rest.length > 0) {
    const err = new Error(`verify 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const result = verifyTarget(target, { taskFile, graph });

  // forward gate-check/audit/graph stdout if any（--json 时仍透传机械闸表）
  if (result.stdout && !json) {
    process.stdout.write(result.stdout);
  } else if (result.stdout && json) {
    // JSON 模式：闸表走 stderr 避免污染 stdout JSON
    process.stderr.write(result.stdout);
  }

  const handoff = buildVerifyHandoff(target, {
    taskFile,
    workspaceRoot: workspaceRoot ? path.resolve(workspaceRoot) : undefined,
  });

  if (json) {
    console.log(JSON.stringify(handoff, null, 2));
  }
  if (agentHint) {
    console.log(formatAgentHint(handoff));
  }

  if (!json && !agentHint) {
    const summary = taskFile
      ? `VERIFY: ${result.ok ? 'PASS' : 'BLOCKED'}${result.reason ? ` · ${result.reason}` : ''} · ${path.basename(taskFile)}`
      : `VERIFY: ${result.ok ? 'PASS' : 'BLOCKED'}${result.reason ? ` · ${result.reason}` : ''}`;
    console.log(summary);
  } else if (json || agentHint) {
    const summary = taskFile
      ? `VERIFY: ${result.ok ? 'PASS' : 'BLOCKED'}${result.reason ? ` · ${result.reason}` : ''} · ${path.basename(taskFile)}`
      : `VERIFY: ${result.ok ? 'PASS' : 'BLOCKED'}${result.reason ? ` · ${result.reason}` : ''}`;
    console.error(summary);
  }

  if (!result.ok) {
    process.exitCode = result.exitCode ?? 2;
    return;
  }
}

async function cmdSync(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`用法: npx @cyning/harness sync index [--target PATH]`);
    return;
  }

  const [sub, ...rest] = args;
  if (sub !== 'index') {
    const err = new Error(`sync 子命令未知: ${sub ?? '(空)'}\n用法: sync index [--target PATH]`);
    err.exitCode = 1;
    throw err;
  }

  let remaining = rest;
  const { value: targetArg, rest: r1 } = takeOption(remaining, '--target');
  remaining = r1;

  if (remaining.length > 0) {
    const err = new Error(`sync index 未知参数: ${remaining.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const harnessRoot = resolveHarnessRootForTarget(target);
  const script = wizardScript(harnessRoot, 'harness-sync.sh');

  const result = spawnSync('bash', [script, '--index', '--target', target], {
    stdio: 'inherit',
    env: { ...process.env, CYNING_HARNESS: harnessRoot },
  });

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    const err = new Error('');
    err.exitCode = exitCode;
    throw err;
  }
}

async function cmdTask(args) {
  const [sub, ...rest] = args;
  if (sub !== 'check') {
    const err = new Error(`task 子命令未知: ${sub ?? '(空)'}\n用法: task check --file PATH [--no-circular] [--registry DIR]...`);
    err.exitCode = 1;
    throw err;
  }

  const noCircular = rest.includes('--no-circular');
  let filePath;
  const registryDirs = [];
  const filtered = [];

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--no-circular') continue;
    if (arg === '--file') {
      filePath = rest[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--registry') {
      registryDirs.push(rest[i + 1]);
      i += 1;
      continue;
    }
    filtered.push(arg);
  }

  if (filtered.length > 0) {
    const err = new Error(`task check 未知参数: ${filtered.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }
  if (!filePath) {
    const err = new Error('task check 须指定 --file PATH');
    err.exitCode = 1;
    throw err;
  }

  const result = checkTaskFile(filePath, { noCircular, registryDirs });
  console.log(`文件: ${result.file}`);
  console.log(`task_slug: ${result.task_slug}`);

  if (!result.validation.ok) {
    console.log('schema: FAIL');
    for (const msg of result.validation.errors) {
      console.log(`  - ${msg}`);
    }
    const err = new Error('task sidecar 校验失败');
    err.exitCode = 1;
    throw err;
  }

  console.log('schema: OK');

  if (noCircular) {
    if (!result.cycle.ok) {
      console.log(`depends_on: CYCLE ${result.cycle.cycle.join(' → ')}`);
      const err = new Error('depends_on 存在环');
      err.exitCode = 1;
      throw err;
    }
    console.log('depends_on: acyclic');
  }
}

async function cmdGraph(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`用法: npx @cyning/harness graph <子命令> [选项]

子命令:
  graph yaml compile --graph-id ID [--input DIR] [--output FILE]
  graph yaml compile --all [--input DIR]
  graph yaml check --graph-id ID [--input DIR] [--graph-json FILE]
  graph yaml check --all [--input DIR] [--graph-json FILE]
  graph ingest [--target PATH] [--actor ACTOR] [--dry-run]
  graph snapshot [--target PATH]
  graph axioms check [--target PATH] [--json]

选项:
  --input DIR         graph yaml 输入目录（默认 target/docs/_tech_graph）
  --output FILE       graph yaml 输出 MD 路径（仅单图 compile）
  --graph-json FILE   graph yaml 对比的 graph.json 路径
  --target PATH       业务仓根目录（默认当前目录）
  --actor ACTOR       ingest actor（默认 system）
  --dry-run           ingest 仅输出事件数 · 不写入
  --json              axioms 输出 JSON
`);
    return;
  }

  const [sub, ...subRest] = args;
  if (sub === 'yaml') {
    await cmdGraphYaml(subRest);
    return;
  }
  if (sub === 'ingest') {
    await cmdGraphIngest(subRest);
    return;
  }
  if (sub === 'snapshot') {
    await cmdGraphSnapshot(subRest);
    return;
  }
  if (sub === 'axioms') {
    await cmdGraphAxioms(subRest);
    return;
  }

  const err = new Error(`graph 子命令未知: ${sub ?? '(空)'}`);
  err.exitCode = 1;
  throw err;
}

async function cmdGraphYaml(args) {
  const [action, ...actionRest] = args;
  if (action !== 'compile' && action !== 'check') {
    const err = new Error(`graph yaml 动作未知: ${action ?? '(空)'}`);
    err.exitCode = 1;
    throw err;
  }

  const all = actionRest.includes('--all');
  let rest = actionRest.filter((a) => a !== '--all');

  const { value: graphId, rest: r1 } = takeOption(rest, '--graph-id');
  rest = r1;
  const { value: inputArg, rest: r2 } = takeOption(rest, '--input');
  rest = r2;
  const { value: outputArg, rest: r3 } = takeOption(rest, '--output');
  rest = r3;
  const { value: graphJsonArg, rest: r4 } = takeOption(rest, '--graph-json');
  rest = r4;

  if (rest.length > 0) {
    const err = new Error(`graph yaml ${action} 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  if (!all && !graphId) {
    const err = new Error('须指定 --graph-id ID 或 --all');
    err.exitCode = 1;
    throw err;
  }

  const cwd = process.cwd();
  const inputRoot = inputArg ? path.resolve(cwd, inputArg) : path.resolve(cwd, 'docs', '_tech_graph');
  const graphJsonPath = graphJsonArg
    ? path.resolve(cwd, graphJsonArg)
    : path.join(inputRoot, 'graph.json');

  try {
    if (action === 'compile') {
      if (all) {
        const ids = allGraphIds(inputRoot);
        if (ids.length === 0) {
          console.log('未找到 *.graph.yaml');
          return;
        }
        for (const id of ids) {
          const out = compileGraph(id, inputRoot);
          console.log(`Generated: ${out}`);
        }
      } else {
        const out = compileGraph(graphId, inputRoot, outputArg ? path.resolve(cwd, outputArg) : null);
        console.log(`Generated: ${out}`);
      }
      return;
    }

    // action === 'check'
    if (all) {
      const ids = allGraphIds(inputRoot);
      if (ids.length === 0) {
        console.log('未找到 *.graph.yaml');
        return;
      }
      let failed = false;
      for (const id of ids) {
        const result = checkGraph(id, inputRoot, graphJsonPath);
        if (result.ok) {
          console.log(`OK: ${id}`);
        } else {
          failed = true;
          console.error(`ERROR: ${id}\n${result.diff}`);
        }
      }
      if (failed) {
        const err = new Error('graph yaml check 发现差异');
        err.exitCode = 1;
        throw err;
      }
      return;
    }

    const result = checkGraph(graphId, inputRoot, graphJsonPath);
    if (result.ok) {
      console.log(`OK: YAML matches graph.json ${graphId} slice`);
    } else {
      console.error(`ERROR: Diff detected for ${graphId}:\n${result.diff}`);
      const err = new Error('graph yaml check 发现差异');
      err.exitCode = 1;
      throw err;
    }
  } catch (err) {
    if (err instanceof GraphYamlError) {
      console.error(err.message);
      const exitErr = new Error('');
      exitErr.exitCode = 1;
      throw exitErr;
    }
    throw err;
  }
}

async function cmdGraphIngest(args) {
  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;
  const { value: actor, rest: r2 } = takeOption(rest, '--actor');
  rest = r2;
  const dryRun = rest.includes('--dry-run');
  rest = rest.filter((a) => a !== '--dry-run');

  if (rest.length > 0) {
    const err = new Error(`graph ingest 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const result = ingestRepoIdempotent(target, {
    actor: actor || 'system',
    source: 'cli',
    dryRun,
  });

  console.log(`目标: ${target}`);
  console.log(`新事件: ${result.count}`);
  console.log(`跳过（已存在）: ${result.skipped}`);
  if (dryRun) {
    console.log('mode: dry-run（未写入）');
  }
}

async function cmdGraphSnapshot(args) {
  let rest = args;
  const { value: targetArg, rest: r1 } = takeOption(rest, '--target');
  rest = r1;

  if (rest.length > 0) {
    const err = new Error(`graph snapshot 未知参数: ${rest.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const events = loadEvents(target);
  const snapshot = buildSnapshot(events);
  const out = writeSnapshot(target, snapshot);

  console.log(`events: ${events.length}`);
  console.log(`nodes: ${Object.keys(snapshot.nodes).length}`);
  console.log(`edges: ${snapshot.edges.length}`);
  console.log(`snapshot: ${out}`);
}

async function cmdGraphAxioms(args) {
  const [sub, ...rest] = args;
  if (sub !== 'check') {
    const err = new Error(`graph axioms 动作未知: ${sub ?? '(空)'}`);
    err.exitCode = 1;
    throw err;
  }

  let remaining = rest;
  const { value: targetArg, rest: r1 } = takeOption(remaining, '--target');
  remaining = r1;
  const json = remaining.includes('--json');
  remaining = remaining.filter((a) => a !== '--json');

  if (remaining.length > 0) {
    const err = new Error(`graph axioms check 未知参数: ${remaining.join(' ')}`);
    err.exitCode = 1;
    throw err;
  }

  const target = resolveTarget(process.cwd(), targetArg);
  const events = loadEvents(target);
  const snapshot = buildSnapshot(events);
  const result = checkAxioms(snapshot, events);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`axioms: ${result.ok ? 'PASS' : 'FAIL'}`);
    console.log(`violations: ${result.violations.length}`);
    for (const v of result.violations) {
      console.log(`  [${v.axiom}/${v.severity}] ${v.message}`);
    }
  }

  if (!result.ok) {
    const err = new Error('HGM axioms 未通过');
    err.exitCode = 2;
    throw err;
  }
}
