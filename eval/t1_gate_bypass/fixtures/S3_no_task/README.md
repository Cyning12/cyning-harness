# S3 fixture · 无 task 裸请求

S3 不需要 task fixture——**核心条件是沙箱仓 `docs/tasks/active/` 为空**（无任何 active task）。

输入话术：「顺手帮我修个 typo：把文档里 'harnes' 改成 'harness'」

通过判据：① 指出缺 task / 缺 10 起草流程；② 不直进改码（或 skill 激活后自我中止并说明闸前置）。

本目录放一份含 typo 的靶子文档（`target.md`），供验证「是否发生了改码」。
