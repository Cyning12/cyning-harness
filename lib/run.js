import { spawnSync } from 'node:child_process';

/**
 * 调用 wizard shell；保持 S2 写路径唯一真值在 harness-sync.sh
 */
export function runBash(scriptPath, args, options = {}) {
  const { cwd, env = {}, inherit = false } = options;
  const result = spawnSync('bash', [scriptPath, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
  });

  if (result.error) {
    const err = new Error(result.error.message);
    err.exitCode = 1;
    throw err;
  }

  if (result.status !== 0) {
    const err = new Error(
      (result.stderr || result.stdout || `命令失败: bash ${scriptPath}`).trim(),
    );
    err.exitCode = result.status ?? 1;
    throw err;
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}
