import fs from 'node:fs';
import path from 'node:path';

const SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * 读取并解析 task sidecar JSON。
 */
export function loadTaskSidecar(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    const e = new Error(`JSON 解析失败: ${filePath}: ${err.message}`);
    e.exitCode = 1;
    throw e;
  }
  return data;
}

/**
 * 轻量校验 task.harness.v1（无外部 JSON Schema 依赖）。
 */
export function validateTaskSidecar(data, fileLabel = 'task') {
  const errors = [];

  if (data == null || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: [`${fileLabel}: 根节点须为 object`] };
  }

  const allowed = new Set([
    'schema_version',
    'task_slug',
    'test_strategy',
    'test_strategy_note',
    'depends_on',
    'parallel_group',
    'git_branch',
    'worktree_root',
    'epic_slug',
    'status',
    'task_markdown',
  ]);

  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      errors.push(`${fileLabel}: 未知字段 "${key}"`);
    }
  }

  if (data.schema_version !== '1') {
    errors.push(`${fileLabel}: schema_version 须为 "1"`);
  }

  if (typeof data.task_slug !== 'string' || !SLUG_RE.test(data.task_slug)) {
    errors.push(`${fileLabel}: task_slug 无效（小写 slug）`);
  }

  const strategies = ['required', 'recommended', 'not_applicable'];
  if (!strategies.includes(data.test_strategy)) {
    errors.push(`${fileLabel}: test_strategy 须为 ${strategies.join(' | ')}`);
  }

  if (data.test_strategy === 'not_applicable') {
    if (typeof data.test_strategy_note !== 'string' || !data.test_strategy_note.trim()) {
      errors.push(`${fileLabel}: test_strategy=not_applicable 须填 test_strategy_note`);
    }
  }

  if (data.depends_on !== undefined) {
    if (!Array.isArray(data.depends_on)) {
      errors.push(`${fileLabel}: depends_on 须为 array`);
    } else {
      const seen = new Set();
      for (const dep of data.depends_on) {
        if (typeof dep !== 'string' || !SLUG_RE.test(dep)) {
          errors.push(`${fileLabel}: depends_on 项无效 "${dep}"`);
        }
        if (dep === data.task_slug) {
          errors.push(`${fileLabel}: depends_on 不可自引用 "${dep}"`);
        }
        if (seen.has(dep)) {
          errors.push(`${fileLabel}: depends_on 重复 "${dep}"`);
        }
        seen.add(dep);
      }
    }
  }

  if (data.status !== undefined) {
    const statuses = ['draft', 'pending', 'in_progress', 'done'];
    if (!statuses.includes(data.status)) {
      errors.push(`${fileLabel}: status 无效`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * 扫描目录下所有 *.harness.json（一层 + 递归可选）。
 */
export function collectTaskSidecars(dirs, { recursive = true } = {}) {
  const map = new Map();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory() && recursive) {
        scanDir(full);
      } else if (ent.isFile() && ent.name.endsWith('.harness.json')) {
        const data = loadTaskSidecar(full);
        const label = path.relative(process.cwd(), full) || full;
        map.set(data.task_slug, {
          filePath: full,
          label,
          data,
        });
      }
    }
  }

  for (const dir of dirs) {
    scanDir(path.resolve(dir));
  }
  return map;
}

/**
 * depends_on 有向图环检测（DFS）。
 */
export function detectDependsOnCycle(taskMap) {
  const visiting = new Set();
  const visited = new Set();
  let cyclePath = null;

  function dfs(slug, stack) {
    if (visited.has(slug)) return false;
    if (visiting.has(slug)) {
      const idx = stack.indexOf(slug);
      cyclePath = stack.slice(idx).concat(slug);
      return true;
    }
    visiting.add(slug);
    stack.push(slug);
    const entry = taskMap.get(slug);
    const deps = entry?.data?.depends_on ?? [];
    for (const dep of deps) {
      if (dfs(dep, stack)) return true;
    }
    stack.pop();
    visiting.delete(slug);
    visited.add(slug);
    return false;
  }

  for (const slug of taskMap.keys()) {
    if (dfs(slug, [])) {
      return { ok: false, cycle: cyclePath };
    }
  }
  return { ok: true };
}

/**
 * 校验单文件；可选合并 registry 目录做环检测。
 */
export function checkTaskFile(filePath, { noCircular = false, registryDirs = [] } = {}) {
  const abs = path.resolve(filePath);
  const data = loadTaskSidecar(abs);
  const label = path.basename(abs);
  const validation = validateTaskSidecar(data, label);
  const result = {
    file: abs,
    task_slug: data.task_slug,
    validation,
    cycle: { ok: true },
  };

  if (!validation.ok) {
    return result;
  }

  if (noCircular) {
    const dirs = new Set([path.dirname(abs), ...registryDirs.map((d) => path.resolve(d))]);
    const taskMap = collectTaskSidecars([...dirs]);
    if (!taskMap.has(data.task_slug)) {
      taskMap.set(data.task_slug, { filePath: abs, label, data });
    }
    for (const dep of data.depends_on ?? []) {
      if (!taskMap.has(dep)) {
        validation.errors.push(`${label}: depends_on 未找到 sidecar "${dep}"`);
        validation.ok = false;
      }
    }
    if (validation.ok) {
      result.cycle = detectDependsOnCycle(taskMap);
    }
  }

  return result;
}
