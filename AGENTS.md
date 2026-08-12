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
- 修改已有文件直接编辑，不新建副本
- 禁止修改 `vite.config.js`、`scripts/`、`src/generated/` 构建相关文件

## 设计系统

锁定的 Design Tokens 与排版规则见 `src/styles/design.css` 及 README：
`--bg:#FBF9F6; --text:#1A1816; --accent:#B68D73` 等；衬线标题（字距 0.04em）、Inter 350 正文、容器 900px、圆角 12px、段间距 > 行间距、无渐变无彩色图标。

## 编辑工具

- 网页端随笔编辑器：https://wmoonlq.github.io/blog/#/notes/editor（首次需在高级选项中粘贴一次 Token，存于浏览器 localStorage，之后免粘贴）
