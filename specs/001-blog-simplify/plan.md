# Implementation Plan: 站点收敛（blog-simplify）

**Branch**: `main`（项目惯例直接推送） | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-blog-simplify/spec.md`

## Summary

将个人博客从「什么都有」的杂烩站收敛为纯写作站：信息架构收敛为 4 项导航（文章/随笔/时间线/关于），移除视频、音乐、工作台小工具、特效陈列室、在线编辑器、媒体上传六大模块及其数据与样式，瘦身工具库与依赖，同步文档与 SEO，构建验证后推送发布。遵循 speckit 流程产出 spec → plan → tasks，在 main 分支直接实现与提交。

## Technical Context

**Language/Version**: JavaScript（ES Modules）；Vite 6 + Vue 3.5（Composition API）；Node 22（CI 同版本）

**Primary Dependencies**: vue、vue-router（hash 路由）、marked、highlight.js；移除 three

**Storage**: 内容源为仓库内 Markdown（`import.meta.glob` 运行时扫描）；用户设置存 localStorage（`settings` 键）

**Testing**: 无测试框架；验收 = `npm run build` 零错误 + 源码静态检索无残留引用 + Actions 部署结论成功（与项目既有验收铁律一致）

**Target Platform**: 静态站点（SPA，hash 路由），GitHub Pages 托管

**Project Type**: 静态前端站点，无后端

**Performance Goals**: 移除 three.js 与 19 个特效组件后，首屏与整体 chunk 显著减小；design.css 从 110KB 裁剪至核心页面所需

**Constraints**: 禁止修改 `vite.config.js`、`scripts/`、`src/generated/`；符合设计 tokens（只裁剪不重设计）；不新建副本文件；语义化提交（feat:/docs:/chore:/ci:）

**Scale/Scope**: 单仓库收敛：视图 11 → 5，组件 26+19 特效 → 11，stores 6 → 1，utils 15 → 8，依赖移除 three

## Constitution Check

*GATE: Must pass before implementation.*

- I 设计系统锁定：保留 `design.css` tokens 与骨架组件，仅裁剪无用规则 → PASS
- II 共享骨架组件优先：保留 PageHero/GroupLabel/EmptyState/DeleteBar 骨架 → PASS
- III 内容模块约定：宪法已修订 v2.0.0（移除视频/音乐/上传约定）→ PASS
- IV 构建与发布红线：不碰构建文件、build 零错误、语义化提交 → PASS
- V 安全与凭据：保留 githubFiles 回收站能力（密码门禁 + notes-token 复用）→ PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-blog-simplify/
├── spec.md              # 功能规格（/speckit.specify 输出）
├── checklists/
│   └── requirements.md  # 规格质量清单（PASS）
├── plan.md              # 本文件（/speckit.plan 输出）
└── tasks.md             # 任务分解（/speckit.tasks 输出）
```

### Source Code (repository root)

```text
src/views/                # 保留 5：Home / Notes / Post / Timeline / About
src/components/           # 保留 11：BlogNav / SettingsPanel / SearchModal / GiscusComments
                          #           PageHero / GroupLabel / EmptyState / DeleteBar
                          #           BackToTop / ScrollProgress / BgImage
src/stores/settings.js    # 瘦身：theme / fontSize / background / navBackground
src/utils/                # 保留：posts / notes / frontmatter / markdown / format / media
                          #        githubFiles（瘦身）/ localMedia（瘦身）
src/styles/design.css     # 裁剪至核心页面所需样式
specs/                    # speckit 产物（随代码提交）

# 移除（git rm）：
#   views: Music / Videos / Workbench / WorkbenchEffects / NotesEditor / PostsEditor
#   components: MusicPlayer / MiniPlayer / VideoPlayer / VideoThumb / VideoDownloader
#               MediaManager / MarkdownEditor / GlobalParticleTrail
#               CountdownTimer / DiceTool / PomodoroTimer / RandomPick / SnakeGame
#               StickyNotes / PasswordGenerator / effects/（19 个特效组件）
#   stores: music / musicPrefs / audioEngine / effects / user
#   utils: music / videos / lrc / videoPoster / uploadWorker
#   内容: src/videos/ src/music/ public/videos/ public/music/
#   工作流: .github/workflows/download.yml  downloads/
#   依赖: three（package.json）
```

**Structure Decision**: 沿用既有单目录结构，不做目录重组；仅收敛文件数量与依赖，最小化改动面。

## Complexity Tracking

无宪法违背项，本表留空（N/A）。
