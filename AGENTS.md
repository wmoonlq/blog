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

## 编辑工具

- 网页端随笔编辑器：https://wmoonlq.github.io/blog/#/notes/editor（首次需在高级选项中粘贴一次 Token，存于浏览器 localStorage，之后免粘贴）

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
- 流程：`/speckit.constitution`（项目原则，已填博客版宪法）→ `/speckit.specify`（功能规格，生成 `specs/<分支名>/spec.md`）→ `/speckit.plan`（技术计划）→ `/speckit.tasks`（任务分解）→ `/speckit.implement`（实现）→ `/speckit.converge`（对照收敛，循环至 Converged）
- 可选命令：`/speckit.clarify`（plan 前澄清）、`/speckit.analyze`（tasks 后一致性分析）、`/speckit.checklist`（质量清单）
- 命令格式为 markdown、`$ARGUMENTS` 传参；脚本类型选了 `ps`（Windows 默认），核心命令模板的 `{SCRIPT}` 会解析到 `.specify/scripts/powershell/`
- 升级 CLI：`specify self check` / `specify self upgrade`；本项目从 PyPI 装 `specify-cli`（非 git 版本）
- 与既有 devloop 的关系：小改动继续走 `/devloop`；较大功能需求可先用 speckit 流程产出 spec/plan/tasks，再交 blog-dev 实现

## 全站体验与 SEO（2026-09-03 起）

- Markdown 渲染（`src/utils/markdown.js`）：marked + highlight.js 代码高亮（`hljs` class，亮/暗两套 token 色在 design.css）、图片 `loading="lazy" decoding="async"`、外链自动 `target="_blank" rel="noopener"`；该模块只在懒加载路由使用，不影响首屏
- 首屏优化：App.vue 全部非核心组件 `defineAsyncComponent` 异步加载；路由切换用 `<Suspense>` 骨架屏（`.route-skeleton`，纯色块呼吸动画，无渐变）
- SEO：`index.html` 含 description/keywords/OG/Twitter/canonical/theme-color（随主题切换，settings.js）；`public/` 下有 `favicon.svg`、`robots.txt`、`sitemap.xml`（手写维护，新增文章/笔记后同步更新）
- 动态标题：`router.js` afterEach 按路由 meta 设置 `document.title`（文章页取 post title）
- 文章页（PostView.vue）：分享按钮（Web Share API，桌面回退复制链接）、正文图片点击预览大图（`.lightbox`，Esc/点击关闭）、≤1080px 目录折叠为按钮（`.toc-toggle`）
- 搜索（SearchModal.vue）：关键词 `<mark>` 高亮 + 标题/标签命中优先排序 + 文章也显示摘要
- 评论：`src/components/GiscusComments.vue` 已挂载于文章页，`data-mapping="specific"` + `term=slug`（适配 hash 路由）；**待办**：需用户在 GitHub 仓库启用 Discussions 后，把真实 `CATEGORY_ID`（API 查询 `GET /repos/wmoonlq/blog/discussions/categories`）填入组件，评论区即生效（repo-id=`R_kgDOT2U2qw`）

## 内容与媒体模块速查

| 模块 | 元数据目录 | 文件目录 | 说明 |
|---|---|---|---|
| 文章 | `src/posts/*.md` | — | frontmatter: title/date/tags |
| 随笔 | `src/notes/*.md` | — | frontmatter: date（title 可选） |
| 视频 | `src/videos/*.md` | `public/videos/` | frontmatter: title/date/source/category/collections/poster/type |
| 音乐 | `src/music/*.md` | `public/music/` | frontmatter: title/date/source/artist/cover/lyrics/yrc/type |
| 背景图 | — | `public/bg/` | 由特效页上传，无元数据 |

- 媒体上传/删除统一走 `src/utils/githubFiles.js`：密码门禁 `123456`（前端校验防刷），Token 复用 localStorage `notes-token`（fine-grained PAT）
- 上传后立即显示：`src/utils/localMedia.js` 本地记录待发布条目（带「待发布」角标），构建完成按 slug 去重自动转正式
- 视频分类/集合由 `src/videos/video-meta.json` 单一数据源驱动：`categories`（分区列表）+ `collections`（id/name/description/sort）；视频 md 用 `collections: ["id"]` 数组（多对多、可空集合），旧 `collection: "名称"` 字段由 `utils/videos.js` 按名称匹配回退兼容（上传/下载流程仍写旧字段）
- 视频支持「从链接下载」：`src/components/VideoDownloader.vue` 把链接写入 `downloads/queue.json` → push 触发 `.github/workflows/download.yml`（yt-dlp 抓取 720p≤300M 到 `public/videos/` + 生成元数据 md + 自动提交）→ 该 workflow 用 `gh workflow run deploy.yml` 显式触发部署（GITHUB_TOKEN 的 push 不会触发下游 workflow）；deploy.yml 已 `paths-ignore: ['downloads/**']` 避免队列文件触发空构建
- **B 站限制**：download.yml 已内置「调 `x/frontend/finger/spi` 拿真实 buvid3/buvid4 写 cookies」逻辑，但 GitHub runner（美国机房 IP）对 B 站内容接口仍 412 → 浏览器「从链接下载」对 B 站不可用，只能本机下载（直连 + 真实 cookie + ffmpeg，见 devlog 踩坑 5）；本机 ffmpeg 可用 `pip install imageio-ffmpeg` 取静态二进制
- 歌词：LRC 解析在 `src/utils/lrc.js`（支持 `[offset:]` 标签）；播放器内置歌词校准（±0.1/0.5s，按歌曲记忆）；官方歌词源可用网易云 API `music.163.com/api/song/lyric?id=`
- 歌曲时长可用 FLAC STREAMINFO 解析（sample rate 20bit @ offset 10，total samples 36bit @ offset 14）
- 音乐个性化（收藏/歌单/最近播放）走 `src/stores/musicPrefs.js` localStorage（`music-favorites`/`music-playlists`/`music-history`），不写仓库；播放器酷狗风格：头部唱片+信息+主控制（`.mp-head`）、进度条两端时间（`.mp-progress-row`）、歌词/播放列表 Tab 切换（`.mp-panel`+`.mp-tabs`，默认列表）、表格式曲目列表（序号/歌曲/歌手/时长，当前行跳动条 `.mp-eq`，hover 收藏，时长懒探测 `Audio preload=metadata`）、底部工具条（`.mp-bar` 音量/倍速/睡眠定时）、Media Session、播放即建队（`playTracks`，视图切换不打断播放）；音乐上传（MediaManager kind=music）支持封面/歌词 .lrc/逐字 .yrc 可选文件，写入 md `cover`/`lyrics`/`yrc`
