---
title: "从零搭建 Vite + Vue3 静态博客"
date: "2026-08-12"
tags: ["Vue", "Vite", "前端"]
---

Vite 以极快的冷启动和按需编译著称。本文记录这套博客的搭建思路：原生 Vite + Vue3，无构建期插件，文章在浏览器端解析，任何静态托管平台都能直接部署。

## 为什么不用构建期插件

构建期扫描 markdown 的方案（如 `vite-plugin-md`）在文章量级增长后需要额外处理缓存与重载，而本文文章量很小。这里选择 `import.meta.glob` 在运行时把 `src/posts/*.md` 以原始文本载入，配合一个不到三十行的 frontmatter 解析器：

```js
const modules = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})
```

新文章只需要放进 `src/posts/`，构建时自动进入列表，无需改动任何配置。

## 排版约束

这套设计对排版有明确约束，全部落在全局 CSS 变量里：

- 行距 `1.7em`，段间距 `2em`，段间距必须大于行间距
- 标题衬线体、字距 `0.04em`；正文 Inter、字重 350
- 首行不缩进，负空间交给留白承担

> 如果某元素不服务于排版节奏或负空间，立即删除。

## 部署

本地 `npm run build` 产出纯静态文件，推送到 `main` 分支后由 Vercel 自动构建上线，全程无需手动操作平台。

```bash
npm run build
git add .
git commit -m "feat: add blog vite-note"
git push origin main
```
