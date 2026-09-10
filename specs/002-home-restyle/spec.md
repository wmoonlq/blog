# Feature 002 · Home Restyle（首页改版）

- **Date**: 2026-09-10
- **Request**: 用户要求参考 http://mrzym.top/#/home 的形态改造首页（“抄这个”）
- **Feature numbering**: 002（顺序编号，接续 001-blog-simplify）

## 背景与边界

参考站「小张的个人博客」首页形态：满屏插画 hero（标题+标语）、左侧图文文章卡片（封面图+置顶+日期+分类+标签+阅读量+摘要）、右侧栏（博主信息/网站资讯统计/标签/友链/公告）、暗色主题。

本 feature 只改首页（HomeView）的呈现形态与文章元数据支持，**不动**：导航（文章/随笔/时间线/关于）、随笔/时间线/关于/文章详情页、构建配置（vite.config.js/scripts/src/generated）、设计 tokens 主值（--bg/--text/--accent/圆角 12px/衬线标题/Inter 350/容器 900px/无渐变/无彩色图标）、内容体系（posts/notes 目录结构）。

参考站的素材图（插画/摄影/Logo）与文案不搬运，仅借鉴布局；封面与 hero 背景使用本仓库 `public/bg/` 既有素材。

## Functional Requirements

| FR | 描述 |
|---|---|
| FR-001 | 首页顶部改为横幅 hero：全宽、背景大图（`public/bg/bg-1786809364416.png` 海上日落）+ 纯色遮罩（--bg 派生变量，无渐变），居中标题「记录与思考」+ 副标题 + 统计（篇文章/篇随笔/个标签） |
| FR-002 | hero 下方改双栏：左主栏（文章卡片流）+ 右侧栏；≤960px 单栏、侧栏置底 |
| FR-003 | 文章卡片：左侧封面缩略图（frontmatter `cover`，缺省用首字衬线占位）+ 标题 + 置顶徽标（`pinned`）+ 发表于/更新于 + 阅读时间 + 分类（`category`）+ 标签 chips + 两行摘要；整卡可点击进文章页 |
| FR-004 | 排序：置顶优先，其余按日期倒序 |
| FR-005 | 侧栏卡片：① 博主信息（favicon 头像 + 站名 + 一句话）② 网站资讯（文章/随笔/标签/建站天数）③ 标签云（点击筛选，复用 .chip）④ GitHub 源码链接 |
| FR-006 | 主栏保留搜索框与 EmptyState 兜底；移除原顶部标签 chips（筛选职责移交侧栏标签云） |
| FR-007 | 两篇文章补 frontmatter：`cover`、`category`；`vite-blog-note` 加 `pinned: true` |
| FR-008 | 宪法升 v2.0.1：记录「首页 hero 允许自定义横幅（复用 .hero-title 等全局类，不再强制 PageHero）」与新增元数据字段；同步 AGENTS.md、devlog、README |

## Success Criteria

| SC | 描述 |
|---|---|
| SC-001 | 首页呈现 hero 横幅 + 双栏卡片流 + 侧栏资讯，观感贴近参考站形态 |
| SC-002 | 页面仅用设计 tokens（新增变量均为 --bg/--text/--accent 派生），无硬编码新色值、无 CSS 渐变 |
| SC-003 | 亮/暗两主题下 hero 与卡片文字可读 |
| SC-004 | `npm run build` 零错误；Actions 部署 success；线上站点 200 |
| SC-005 | 其余页面与导航不变，无副本文件，无构建文件改动 |
| SC-006 | 宪法/AGENTS/devlog 已同步本次设计变更 |
