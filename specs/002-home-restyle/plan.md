# Plan · 002 Home Restyle

- **Owner**: 豆包 MainAgent（按既有 speckit 流程自行实现，无人工构建）
- **Constraints**: 不碰 vite.config.js/scripts/src/generated；无副本；build 零错误；语义化提交

## 1. 数据层：`src/utils/posts.js`

- `getAllPosts()` 解析新增字段：`cover`（字符串路径，相对 public 根，如 `bg/xxx.png`）、`category`（字符串，可选）、`pinned`（frontmatter 值为字符串 `"true"`，转为布尔）
- `excerpt`：取 content 首个非空段落，去除 markdown 语法字符（#、*、`、>、-、[ ] 等），截断 88 字符
- 排序：`pinned` 优先，其次 `date` 倒序

## 2. 视图层：`src/views/HomeView.vue`（全量重写）

- 保留：搜索框（query 过滤）、EmptyState、activeTag 筛选（route.query.tag 支持）
- 新增结构：
  - `.home-hero`：背景图（`${BASE_URL}bg/bg-1786809364416.png`）+ 遮罩伪元素 + 标题/副标题/统计（复用 .hero-title/.hero-sub/.hero-stats 全局类）
  - `.home-layout`（grid 两栏）：
    - `.home-main`：搜索框 + 文章卡片列表（`<article class="cover-card">`）
    - `.home-side`：博主卡 / 网站资讯 / 标签云 / GitHub 链接
- 标签云点击 → 设 activeTag 并滚动到列表顶部
- 建站天数：`(now - 2026-08-01) / 86400000` 取整
- 图片路径统一 `import.meta.env.BASE_URL + cover`

## 3. 样式层：`src/styles/design.css`（追加，不删既有）

- 新增派生变量：`--hero-overlay`（亮 `rgba(252,253,255,.72)` / 暗 `rgba(15,23,42,.7)`，由 --bg 派生）
- 新增类：`.home-hero`（全宽横幅）、`.home-layout`、`.home-main`、`.home-side`、`.cover-card`、`.cover-thumb`（168×112、object-fit cover、缺省占位）、`.pin-badge`、`.card-meta`、`.card-excerpt`、`.side-card`、`.side-title`、`.stat-row`、`.side-links`
- 响应式：`≤960px` 单栏（侧栏置底）、hero 高度收缩、卡片缩略图隐藏于 ≤520px
- 全部颜色/圆角/字体来自 tokens，无渐变

## 4. 内容层：文章 frontmatter

- `design-restraint.md`：`cover: "bg/bg-1786809515036.png"`、`category: "设计"`
- `vite-blog-note.md`：`cover: "bg/bg-1786809364416.png"`、`category: "前端"`、`pinned: true`

## 5. 文档同步

- `.specify/memory/constitution.md` → v2.0.1（首页 hero 例外 + 新字段约定）
- `AGENTS.md`：设计系统节补首页形态；内容规则补 cover/category/pinned
- `devlog/README.md`：新增 2026-09-10 节
- `README.md`：首页布局一句说明（如已有设计节）

## 6. 验证与发布

1. `npm run build` 零错误
2. 本地 preview 冒烟：首页 200、hero/卡片/侧栏渲染、暗色可读
3. 语义化提交（feat:/docs:）+ `git -c http.proxy= push origin main`（代理 7897 未运行时直连）
4. Actions run conclusion=success + 线上 200
5. 写 `specs/002-home-restyle/converge.md` 并提交
