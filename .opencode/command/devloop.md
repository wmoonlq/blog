---
description: AI 循环编码验收。需求 → blog-dev 开发 → 构建 → blog-reviewer 审查 → blog-qa 验收，不通过自动带修复指令重跑，最多 3 轮收敛；通过后同步开发日记并提交发布。
---

# AI 循环编码验收

任务需求：$ARGUMENTS

按以下循环执行，直到验收通过或达到最大轮次。全程由你（主 agent）编排子代理，子代理间通过你的中转传递信息。

## 循环（最多 3 轮）

1. **开发**：用 task 工具调 `blog-dev` 子代理实现需求，把上一轮验收的修复指令（如有）原样附上
2. **构建**：本机运行 `npm run build`；失败则让 blog-dev 修复后重跑，直到构建通过
3. **审查**：用 task 工具调 `blog-reviewer` 子代理审查本轮全部改动
4. **验收**：用 task 工具调 `blog-qa` 子代理，附任务需求原文作为验收标准
   - 裁决「验收通过」→ 跳出循环
   - 裁决「验收不通过」→ 把其修复指令整理后交给 blog-dev 进入下一轮

每轮结束向用户简报：轮次、构建状态、审查问题数、验收裁决。

## 收尾（验收通过后）

1. 按 AGENTS.md 把本轮功能迭代/踩坑同步到 `devlog/README.md`（按日期分节，追加到最新一节）
2. `git add` 只暂存本轮相关文件 + 语义化 commit（feat:/fix:/style:/docs:/chore:/ci: 前缀，简洁英文）
3. `git push origin main`
4. 如需确认部署，查询 GitHub Actions API 的 run conclusion（走代理，凭据从 git credential 读取，勿打印 token）

## 汇报

循环结束后向用户输出：最终验收裁决、改动文件清单、构建结果、commit 信息、部署状态（如已确认）。
