# 个人博客 Constitution

本项目的宪法：所有 AI 驱动的开发必须遵守以下原则。这些原则是锁定的，修改需在 AGENTS.md 与 devlog 中同步记录。

## Core Principles

### I. 设计系统锁定
所有页面必须使用 `src/styles/design.css` 中锁定的 Design Tokens：`--bg:#FBF9F6; --text:#1A1816; --accent:#B68D73` 等。衬线标题（字距 0.04em）、Inter 350 正文、容器 900px、圆角 12px、段间距 > 行间距、无渐变、无彩色图标。禁止引入新设计风格或偏离 tokens 的硬编码颜色。

### II. 共享骨架组件优先
新页面一律使用共享骨架组件：`PageHero.vue`（页面头部）、`GroupLabel.vue`（分组标题）、`EmptyState.vue`（空状态）、`DeleteBar.vue`（密码确认条）。页面骨架约定：`PageHero → 筛选/工具区 → GroupLabel 分组 → EmptyState 兜底`。禁止写内联重复类或手写空态。

### III. 内容模块约定
- 文章：`src/posts/*.md`，frontmatter 含 title/date/tags，英文短横线命名
- 随笔：`src/notes/*.md`，frontmatter 仅需 date（title 可选）
- 视频：`src/videos/*.md` + `public/videos/`，分类/集合由 `src/videos/video-meta.json` 单一数据源驱动
- 音乐：`src/music/*.md` + `public/music/`，可选 cover/lyrics(.lrc)/yrc
- 背景图：`public/bg/`，无元数据
- 随笔删除走回收站：`moveFile` 移入 `src/notes-trash/`，还原移回，彻底删除直接 DELETE

### IV. 构建与发布红线
- 本地 `npm run build` 必须零错误
- 禁止修改 `vite.config.js`、`scripts/`、`src/generated/` 构建相关文件
- 修改已有文件直接编辑，不新建副本
- 提交使用语义化前缀：feat:/docs:/chore:/ci:，简洁英文描述

### V. 安全与凭据
- 媒体上传/删除走 `src/utils/githubFiles.js`，密码门禁 `123456`（仅前端防刷）
- Token 复用 localStorage `notes-token`（fine-grained PAT，仅本仓库 Contents 读写）
- 任何 Token 永不进仓库；git 已配置代理 `http://127.0.0.1:7897`（本机直连 GitHub 超时）

## Development Workflow

- 开发结束后同步 `devlog/README.md`（按日期分节）与 AGENTS.md（项目记忆）
- AI 代理团队：`.opencode/agent/` 中 blog-dev（实现）、blog-reviewer（只读审查）、blog-qa（构建验证+验收裁决）
- 循环流程 `/devloop <需求>`：开发 → 构建 → 审查 → 验收，不通过自动带修复指令重跑（最多 3 轮）
- 验收铁律：build 零错误、不碰构建文件、符合设计 tokens、无副本文件、需求逐项覆盖
- 本地命令行桥接：`npm run bridge` 启动 `127.0.0.1:9876` HTTP+WebSocket 服务，页面 `/cmd` 连接