# invoke · 30+40 · agent-skills-packaging 实施与自检闭环

> **hat**：30 → 40（同上下文）· **日期**：2026-08-06 · **分支**：`task/agent-skills-packaging`

## 30 实施摘要（≤10 行）

1. 先红：`test/skills.test.js` 11 例先行（module not found fail）→ 实现转绿
2. D1：6 条文 frontmatter（正文零 diff）· D2：`lib/skills.js` + CLI（js-yaml 复用 · 零新依赖）
3. 实测 bug 修一处：资源引用正则误配 `TASK_TEMPLATE_upstream_pr_v1.md` 子串 → 加词界 lookbehind
4. D3：`skills/` 生成入库（默认 4 帽 + 生成 README 含执行帽缺席标注）· files[] + prompts README 段
5. 脏树纪律执行：`harness/prompts/README.md` 含**他人未提交改动** → 暂存区手术（git show HEAD + 段落插入）只提交本 task 段落，他人改动完整留在工作区
6. D4：266/266 pass（含 sync 回归）· ci 样例（skills-ref 包名标占位 · 防虚构分发名）
7. D5：eval S1–S3 fixture + 判死线 · D6：dogfood 装入工作区 `.claude/skills/` + rethink 回写 + CHANGELOG 2.23.0

## 40 自检

真跑 4 组验证命令全绿（详见 task「自检结论（执行者）」表：`npm test` 266 pass · `skills check` PASS · build 再生确定 · `verify --task` PASS）。验收标准逐条 pass。

## 遗留（不挡本 task CLOSE）

- T1 评测未执行（设计如此：30/40 维持不进默认分发）
- dogfood 触发观察数据待后续会话回写 rethink README
- `skills-ref` npm 分发名待官方核实（ci 样例已标占位）
