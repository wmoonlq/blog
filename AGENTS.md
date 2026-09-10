# Blog 运维约定

个人博客仓库（Vite + Vue3 静态站，GitHub Pages 托管）。用户不做任何构建操作，所有构建与发布由 AI 代理完成。

## 仓库与网络

- 远端：https://github.com/wmoonlq/blog.git，默认分支 `main`
- 本机直连 GitHub 超时，git 已配置代理 `http://127.0.0.1:7897`（仓库级 http.proxy）
- GitHub API 调用（查 Actions、配 Pages 等）需走代理，凭据从 git credential 读取，勿打印 token
- 用户提供的是 fine-grained PAT（仅限本仓库 Contents 读写），已存入 Windows 凭据管理器，同时用户浏览器 localStorage 各存一份；此 Token 永不进仓库

## 构建发布流程

1. 本地执行 `npm run build` 验证无错误
2. `git add` + 语义化 commit（feat:/docs:/chore:/ci: 前缀，简洁英文描述）
3. `git push origin main`
4. GitHub Actions（.github/workflows/deploy.yml）自动构建并发布到 https://wmoonlq.github.io/blog/
5. 如需确认部署结果，可查询 Actions API 的 run conclusion

## 内容规则

- 文章：`src/posts/*.md`，frontmatter 含 title/date/tags，英文短横线命名
- 随笔：`src/notes/*.md`，frontmatter 仅需 date（title 可选）
- 随笔回收站：删除时 `moveFile` 把 `src/notes/<slug>.md` 移至 `src/notes-trash/`（glob 排除在站点外），还原移回，彻底删除直接 DELETE；`utils/notes.js` 的 `getTrashedNotes()` 与 `utils/localMedia.js` 的本地 trash 记录供回收站 UI 读取
- 修改已有文件直接编辑，不新建副本
- 禁止修改 `vite.config.js`、`scripts/`、`src/generated/` 构建相关文件

## 设计系统

锁定的 Design Tokens 与排版规则见 `src/styles/design.css` 及 README：
`--bg:#FCFDFF; --text:#1B2430; --accent:#3B6FE0` 等（暗色 `#0F172A`/`#E6EDF7`/`#7AA2FF`）；衬线标题（字距 0.04em）、Inter 350 正文、容器 900px、圆角 12px、段间距 > 行间距、无渐变无彩色图标。

## 共享骨架组件（2026-08-23 起）

- `src/components/PageHero.vue`：统一页面头部（title/sub/stats/actions 插槽），新页面一律用它
- `src/components/GroupLabel.vue`：统一分组标题（label + count + countUnit），替代手写 year/month/day 标题
- `src/components/EmptyState.vue`：统一空状态（text/sub/操作插槽），禁止再写内联 `hero-sub` + padding 空态
- `src/components/DeleteBar.vue`：统一密码确认条（`v-model:pwd` + confirm/cancel + busy 防并发），删除/危险操作必用
- 页面骨架约定：`PageHero → 筛选/工具区 → GroupLabel 分组 → EmptyState 兜底`；改动样式优先复用既有 tokens 类，不新增重复类

## 随笔回收站 Token 配置

- 随笔页「管理」的删除/还原/彻底删除走 GitHub API（`utils/githubFiles.js`），密码门禁 `123456`（前端防刷），Token 复用 localStorage `notes-token`
- 网页端编辑器已下线（2026-09-10 站点收敛），Token 需在浏览器控制台执行 `localStorage.setItem('notes-token', '你的 PAT')` 配置，仅本仓库 Contents 读写权限

## 开发日记

- 每轮开发结束，将功能迭代、踩坑记录同步到 `devlog/README.md`（Markdown，按日期分节）
- 本文件（AGENTS.md）为项目记忆：新增模块/约定时同步更新；本文件变动随代码一起提交

## AI 代理团队与循环编码验收

- 团队定义在 `.opencode/agent/`：`blog-dev`（实现）、`blog-reviewer`（只读审查）、`blog-qa`（构建验证+验收裁决）
- 循环流程：`/devloop <需求>` — 开发 → 构建 → 审查 → 验收，不通过自动带修复指令重跑（最多 3 轮），通过后同步开发日记、语义化 commit、push
- 验收铁律：`npm run build` 零错误、不碰 `vite.config.js`/`scripts/`/`src/generated/`、符合设计系统 tokens、无副本文件、需求逐项覆盖
- 单个子代理可单独使用：task 工具调 blog-dev / blog-reviewer / blog-qa

## Spec Kit（规格驱动开发，2026-09-03 起）

- 已装 GitHub Spec Kit（`specify-cli` 1.0.4，pip 安装）+ opencode integration：斜杠命令在 `.opencode/commands/speckit.*.md`，模板/脚本/工作流在 `.specify/`，宪法在 `.specify/memory/constitution.md`
- 流程：`/speckit.constitution`（项目原则，博客版宪法 v2.0.0）→ `/speckit.specify`（功能规格，生成 `specs/<NNN>-<name>/spec.md`）→ `/speckit.plan`（技术计划）→ `/speckit.tasks`（任务分解）→ `/speckit.implement`（实现）→ `/speckit.converge`（对照收敛，循环至 Converged）
- 可选命令：`/speckit.clarify`（plan 前澄清）、`/speckit.analyze`（tasks 后一致性分析）、`/speckit.checklist`（质量清单）
- 命令格式为 markdown、`$ARGUMENTS` 传参；脚本类型选了 `ps`（Windows 默认），核心命令模板的 `{SCRIPT}` 会解析到 `.specify/scripts/powershell/`
- 首个功能规格：`specs/001-blog-simplify/`（2026-09-10 站点收敛）；后续 feature 编号顺延（`feature_numbering: sequential`）
- 升级 CLI：`specify self check` / `specify self upgrade`；本项目从 PyPI 装 `specify-cli`（非 git 版本）
- 与既有 devloop 的关系：小改动继续走 `/devloop`；较大功能需求可先用 speckit 流程产出 spec/plan/tasks，再交 blog-dev 实现

## 全站体验与 SEO（2026-09-03 起）

- Markdown 渲染（`src/utils/markdown.js`）：marked + highlight.js 代码高亮（`hljs` class，亮/暗两套 token 色在 design.css）、图片 `loading="lazy" decoding="async"`、外链自动 `target="_blank" rel="noopener"`；该模块只在懒加载路由使用，不影响首屏
- 首屏优化：App.vue 全部非核心组件 `defineAsyncComponent` 异步加载；路由切换用 `<Suspense>` 骨架屏（`.route-skeleton`，纯色块呼吸动画，无渐变）
- SEO：`index.html` 含 description/keywords/OG/Twitter/canonical/theme-color（随主题切换，settings.js）；`public/` 下有 `favicon.svg`、`robots.txt`、`sitemap.xml`（手写维护，新增文章/笔记后同步更新）
- 动态标题：`router.js` afterEach 按路由 meta 设置 `document.title`（文章页取 post title）
- 文章页（PostView.vue）：分享按钮（Web Share API，桌面回退复制链接）、正文图片点击预览大图（`.lightbox`，Esc/点击关闭）、≤1080px 目录折叠为按钮（`.toc-toggle`）
- 搜索（SearchModal.vue）：关键词 `<mark>` 高亮 + 标题/标签命中优先排序 + 文章也显示摘要
- 设置（SettingsPanel.vue）：外观（暗色模式）+ 背景图片（URL 引用，`settings.background` / `settings.navBackground`，全站背景层 `BgImage.vue`，无上传流程）
- 评论：`src/components/GiscusComments.vue` 已挂载于文章页，`data-mapping="specific"` + `term=slug`（适配 hash 路由）；**待办**：需用户在 GitHub 仓库启用 Discussions 后，把真实 `CATEGORY_ID`（API 查询 `GET /repos/wmoonlq/blog/discussions/categories`）填入组件，评论区即生效（repo-id=`R_kgDOT2U2qw`）

## 内容与模块速查

| 模块 | 元数据目录 | 说明 |
|---|---|---|
| 文章 | `src/posts/*.md` | frontmatter: title/date/tags |
| 随笔 | `src/notes/*.md` | frontmatter: date（title 可选） |
| 随笔回收站 | `src/notes-trash/*.md` | 删除/还原/彻底删除（GitHub API + 本地 trash 记录） |

- 已下线模块（2026-09-10 站点收敛，git 历史可恢复）：视频（`src/videos/`、`public/videos/`、下载器与 `download.yml`）、音乐（`src/music/`、`public/music/`、播放器与歌词）、工作台小工具、特效陈列室（three.js 与 `components/effects/`）、网页编辑器（文章/随笔）、媒体管理器与背景上传、身份档案
- 背景图：`public/bg/` 保留，仅由设置面板以 URL 引用，无上传流程
- 随笔删除/还原/彻底删除走 `src/utils/githubFiles.js`（密码门禁 `123456` 前端防刷），Token 复用 localStorage `notes-token`
