import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

/**
 * Agent Skills 标准封装（SPEC-agent-skills-packaging_v1 · task cyning-harness-agent-skills-packaging）
 *
 * 真值：harness/prompts/*.md 头部 frontmatter + 正文（单源）。
 * 本模块：frontmatter 校验 + 生成 skills/ 标准目录（纯生成物）+ drift 只读校验。
 * 哲学同 lifecycle show：check 只读，不做引擎。
 */

export const EXECUTE_TRACK = 'starter-experimental';

/** 条文中被引用即复制进 references/ 的资源文件名模式（词界防 TASK_TEMPLATE_ 等子串误配） */
const RESOURCE_RE = /(?<![A-Za-z0-9_])(?:FRAGMENT|TEMPLATE)_[A-Za-z0-9_\-]+\.md/g;
/** markdown 相对链接 `./X.md`（仅 FRAGMENT/TEMPLATE 两类会被重写） */
const MD_LINK_RE = /\]\(\.\/((?:FRAGMENT|TEMPLATE)_[A-Za-z0-9_\-]+\.md)\)/g;

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;

export function parseSkillPrompt(content) {
  const m = FRONTMATTER_RE.exec(content);
  if (!m) return { frontmatter: null, body: content };
  let frontmatter;
  try {
    frontmatter = yaml.load(m[1]);
  } catch (e) {
    return { frontmatter: null, body: content, parseError: e.message };
  }
  return { frontmatter, body: m[2] };
}

/** agentskills.io 规范约束 · 返回错误字符串数组（空 = 合法） */
export function validateSkillFrontmatter(fm, source) {
  const errors = [];
  if (!fm || typeof fm !== 'object') {
    return [`${source}: 缺 frontmatter 或非对象`];
  }
  const { name, description, compatibility } = fm;
  if (typeof name !== 'string' || name.length < 1 || name.length > 64) {
    errors.push(`${source}: name 缺失或超长（1–64）`);
  } else if (!NAME_RE.test(name)) {
    errors.push(`${source}: name 非法（仅小写字母/数字/单连字符 · 不得首尾连字符/连续连字符）: ${name}`);
  }
  if (typeof description !== 'string' || description.length < 1) {
    errors.push(`${source}: description 缺失`);
  } else if (description.length > 1024) {
    errors.push(`${source}: description 超长（${description.length} > 1024）`);
  }
  if (compatibility !== undefined) {
    if (typeof compatibility !== 'string' || compatibility.length > 500) {
      errors.push(`${source}: compatibility 超长或非字符串（≤500）`);
    }
  }
  return errors;
}

/** 读 promptsDir 下全部含 frontmatter 的条文（排除 README/FRAGMENT/TEMPLATE 资源文件） */
export function loadSkillPrompts({ promptsDir }) {
  const files = fs
    .readdirSync(promptsDir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !/^(README|FRAGMENT_|TEMPLATE_)/.test(f))
    .sort();
  const out = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(promptsDir, file), 'utf8');
    const { frontmatter, body, parseError } = parseSkillPrompt(content);
    const errors = parseError
      ? [`${file}: frontmatter YAML 解析失败: ${parseError}`]
      : validateSkillFrontmatter(frontmatter, file);
    out.push({ file, frontmatter: frontmatter || {}, body, errors });
  }
  return out;
}

function rewriteLinks(body) {
  return body.replace(MD_LINK_RE, '](references/$1)');
}

function referencedResources(body) {
  return [...new Set(body.match(RESOURCE_RE) || [])].sort();
}

function renderSkillMd(frontmatter, body) {
  return `---\n${yaml.dump(frontmatter, { lineWidth: -1 })}---\n${body}`;
}

function renderReadme(skills, { withExecuteHats }) {
  const rows = skills
    .map(
      (s) =>
        `| [\`${s.frontmatter.name}/\`](./${s.frontmatter.name}/SKILL.md) | ${s.frontmatter.metadata?.hat_id ?? ''} | ${firstSentence(s.frontmatter.description)} |`,
    )
    .join('\n');
  const excluded = withExecuteHats
    ? ''
    : `
## 执行帽缺席说明

\`harness-30-execute\` / \`harness-40-self-check\`（执行帽）**不在本分发**：其 skill 化须先通过 T1 闸绕开评测（\`eval/t1_gate_bypass/\` S1–S3）。
评测/维护者可用 \`harness skills build --with-execute-hats\` 本地生成（仅供评测环境，勿装入生产 client）。
`;
  return `# skills/ · Agent Skills 标准封装（生成物 · 勿手改）

> **本目录由 \`harness skills build\` 生成**；真值 = \`harness/prompts/\` 条文（frontmatter + 正文）。
> 改动请改条文后重跑 build；\`harness skills check\` 会拦截任何手改 drift。
> 规范：https://agentskills.io/specification

## 安装（各 client 路径不同 · 复制或软链均可）

| client | 放置路径 |
|--------|----------|
| Claude Code | \`<repo>/.claude/skills/\` 或 \`~/.claude/skills/\` |
| 其他 skills 兼容 client | 见各 client 文档（Cursor / Codex / Copilot / Gemini CLI …） |

## 技能清单

| skill | hat_id | 用途 |
|-------|--------|------|
${rows}
${excluded}`;
}

function firstSentence(description) {
  const idx = description.indexOf('。');
  return idx === -1 ? description : description.slice(0, idx + 1);
}

/**
 * 内存生成 skills/ 目录内容。
 * 返回 { files: Map<相对路径, 内容>, skills, errors }。
 * files 键形如 "harness-10-task/SKILL.md" / "README.md"。
 */
export function generateSkills({ promptsDir, withExecuteHats = false }) {
  const prompts = loadSkillPrompts({ promptsDir });
  const errors = prompts.flatMap((p) => p.errors);
  const files = new Map();
  const selected = prompts.filter(
    (p) => withExecuteHats || p.frontmatter.metadata?.track !== EXECUTE_TRACK,
  );
  for (const p of selected) {
    const name = p.frontmatter.name;
    files.set(`${name}/SKILL.md`, renderSkillMd(p.frontmatter, rewriteLinks(p.body)));
    for (const res of referencedResources(p.body)) {
      const src = path.join(promptsDir, res);
      if (fs.existsSync(src)) {
        files.set(`${name}/references/${res}`, fs.readFileSync(src, 'utf8'));
      } else {
        errors.push(`${p.file}: 引用的资源不存在: ${res}`);
      }
    }
  }
  files.set('README.md', renderReadme(selected, { withExecuteHats }));
  return { files, skills: selected, errors };
}

/** 全量重写 outDir（生成物无手写部分 · 无残留策略） */
export function buildSkills({ promptsDir, outDir, withExecuteHats = false }) {
  const { files, errors } = generateSkills({ promptsDir, withExecuteHats });
  if (errors.length > 0) {
    const err = new Error(`skills build 前置校验失败:\n${errors.join('\n')}`);
    err.errors = errors;
    throw err;
  }
  fs.rmSync(outDir, { recursive: true, force: true });
  const written = [];
  for (const [rel, content] of [...files.entries()].sort()) {
    const abs = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    written.push(rel);
  }
  return { written };
}

function readTreeFiles(dir) {
  const out = new Map();
  const walk = (cur, rel) => {
    for (const entry of fs.readdirSync(cur, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(cur, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(abs, r);
      else out.set(r, fs.readFileSync(abs, 'utf8'));
    }
  };
  if (fs.existsSync(dir)) walk(dir, '');
  return out;
}

/**
 * 只读校验：frontmatter 约束 + 重新生成默认集与 skillsDir 逐一比对（drift 检测）。
 * 默认集不含执行帽 → 盘上出现执行帽即 drift。
 */
export function checkSkills({ promptsDir, skillsDir }) {
  const { files: expected, errors } = generateSkills({ promptsDir });
  if (errors.length > 0) return { ok: false, errors };

  const actual = readTreeFiles(skillsDir);
  const driftErrors = [];
  for (const key of [...expected.keys()].sort()) {
    if (!actual.has(key)) driftErrors.push(`缺失: ${key}`);
    else if (actual.get(key) !== expected.get(key)) driftErrors.push(`drift: ${key}`);
  }
  for (const key of [...actual.keys()].sort()) {
    if (!expected.has(key)) driftErrors.push(`多余（非生成物或执行帽误入）: ${key}`);
  }
  return { ok: driftErrors.length === 0, errors: driftErrors };
}
