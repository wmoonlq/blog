# wmoonlq · Blog

个人博客，基于原生 Vite + Vue3 的静态博客，部署于 GitHub Pages。

## 技术栈

- Vite 6 + Vue 3（Composition API）
- vue-router（hash 模式，静态托管无需重写规则）
- marked（运行时 Markdown 渲染）
- 无构建期插件：文章列表由 `import.meta.glob` 在运行时扫描 `src/posts/`

## 快速开始

```bash
npm install
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 构建产物 dist/
npm run preview  # 预览构建产物
```

## 站点结构

- 首页（文章）：横幅 hero + 图文卡片列表（封面/置顶/分类/标签/摘要），侧栏标签筛选与站内搜索
- 随笔：碎片记录，按月份分组，支持管理（删除→回收站→还原/彻底删除）
- 时间线：GitHub 提交记录（优先 API，回退本地 commits.json）
- 关于：站点统计与技术栈
- 文章详情：目录、字号调节、代码复制、图片预览、分享、评论（Giscus）

## 写文章

1. 在 `src/posts/` 新建 `.md` 文件，文件名使用英文短横线命名，例如 `vite-blog-note.md`
2. 文件头部必须携带 frontmatter，字段：`title`、`date`（YYYY-MM-DD）、`tags`（数组）

```markdown
---
title: "文章标题"
date: "2026-08-12"
tags: ["Vue", "前端"]
---
```

3. 提交并推送 `main` 分支，GitHub Actions 自动构建发布

```bash
git add .
git commit -m "feat: add blog xxx"
git push origin main
```

## 写随笔

在 `src/notes/` 新建 `.md` 文件，frontmatter 仅需 `date` 字段（`title` 可选），正文直接展示在随笔页：

```markdown
---
date: "2026-08-12"
---

随手写的内容
```

也可以直接在 GitHub 网页上新建/编辑 `src/notes/` 下的文件，保存即自动构建发布，手机也能写。

### 随笔回收站（管理）

随笔页「管理」模式支持删除（移入 `src/notes-trash/`）、还原、彻底删除，通过 GitHub API 操作，需要：

- 操作密码：`123456`（前端防刷）
- Token：在浏览器控制台执行 `localStorage.setItem('notes-token', '你的 fine-grained PAT')`（仅本仓库 Contents 读写权限）

## 目录结构

```
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── index.html                     # 入口 HTML（字体加载 + SEO 元信息）
├── vite.config.js                 # Vite 配置（base: /blog/）
├── specs/                         # Spec Kit 规格驱动开发产物（spec/plan/tasks）
└── src/
    ├── posts/                     # 文章（markdown 源）
    ├── notes/                     # 随笔（markdown 源）
    ├── notes-trash/               # 随笔回收站（glob 排除在站点外）
    ├── styles/design.css          # 设计系统（Design Tokens + 排版规则）
    ├── components/                # 导航 / 设置 / 搜索 / 评论 / 骨架组件
    ├── views/                     # 首页 / 随笔 / 文章详情 / 时间线 / 关于
    └── utils/                     # 文章扫描与 Markdown 渲染
```

## 设计系统

Design Tokens 强制锁定于 `src/styles/design.css` 的 `:root`，不得随意改动：

```css
--bg: #FCFDFF;
--text: #1B2430;
--text-secondary: #5A6B82;
--accent: #3B6FE0;
--divider: #E4E9F2;
--radius: 12px;
--shadow: 0 8px 24px -6px rgba(15, 23, 42, 0.08);
```

暗色（`:root[data-theme="dark"]`）：`--bg: #0F172A; --text: #E6EDF7; --accent: #7AA2FF; --divider: #1E293B`。

排版约束：

- 标题：衬线体（Noto Serif SC），字距 `0.04em`
- 正文：Inter，字重 350
- 容器 `max-width: 900px`
- 卡片：`0 4px 20px rgba(0,0,0,0.02)` + `1px solid rgba(0,0,0,0.03)`，无边框色
- 导航 `backdrop-filter: blur(12px)`
- 文章列表：左侧 2px 强调色竖线锚定
- 过渡：`0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- 段间距 > 行间距，首行无缩进，无渐变与彩色图标
- 首页（2026-09-10 改版）：横幅 hero（背景图 + `--hero-overlay` 遮罩）+ 左主栏图文卡片流 + 右侧栏（博主/网站资讯/标签云/GitHub），≤960px 单栏；卡片支持文章 frontmatter 可选字段 `cover` / `category` / `pinned` / `updated`

## 部署

推送 `main` 分支后，`.github/workflows/deploy.yml` 自动执行：

1. `npm ci` + `npm run build`
2. 上传 `dist/` 产物
3. `actions/deploy-pages` 发布到 GitHub Pages

站点地址：https://wmoonlq.github.io/blog/

## 维护约定

- 修改文章只编辑 `src/posts/` 下的 md 文件，不要新建副本
- 禁止修改 `vite.config.js`、`scripts/`、`src/generated/` 等构建相关文件
- 新页面使用共享骨架组件（PageHero / GroupLabel / EmptyState / DeleteBar），遵循设计 tokens
- 开发结束后同步 `devlog/README.md` 与 `AGENTS.md`（项目记忆）
