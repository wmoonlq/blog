# Tasks: 站点收敛（blog-simplify）

**Input**: Design documents from `specs/001-blog-simplify/`

**Prerequisites**: plan.md（已就绪）、spec.md（已就绪）

**Tests**: 本项目无测试框架，按既有验收铁律执行：`npm run build` 零错误 + 静态检索 + Actions 部署结论。

**Organization**: 任务按用户故事分组；所有任务在同一仓库内顺序执行（先删后改再验）。

## 格式说明

- **[P]**: 可并行（不同文件无依赖）
- **[Story]**: 所属用户故事（US1-US5）
- 路径为仓库内实际路径

---

## Phase 1: 移除冗余模块（US1 / US2 / US3 / US5）

**Purpose**: 先删除视频/音乐/工作台/特效/编辑器/媒体上传全部源码、数据与工作流，从根上消除残留引用。

- [ ] T001 [P] [US1] 删除视图：`src/views/MusicView.vue`、`VideosView.vue`、`WorkbenchView.vue`、`WorkbenchEffectsView.vue`、`NotesEditorView.vue`、`PostsEditorView.vue`
- [ ] T002 [P] [US1] 删除音乐组件：`src/components/MusicPlayer.vue`、`MiniPlayer.vue`
- [ ] T003 [P] [US1] 删除视频组件：`src/components/VideoPlayer.vue`、`VideoThumb.vue`、`VideoDownloader.vue`
- [ ] T004 [P] [US2] 删除工具组件：`CountdownTimer.vue`、`DiceTool.vue`、`PomodoroTimer.vue`、`RandomPick.vue`、`SnakeGame.vue`、`StickyNotes.vue`、`PasswordGenerator.vue`
- [ ] T005 [P] [US2] 删除特效：`src/components/GlobalParticleTrail.vue` 与 `src/components/effects/` 目录（19 个组件）
- [ ] T006 [P] [US3] 删除编辑器与媒体上传：`src/components/MarkdownEditor.vue`、`MediaManager.vue`
- [ ] T007 [P] [US3] 删除 stores：`src/stores/music.js`、`musicPrefs.js`、`audioEngine.js`、`effects.js`、`user.js`
- [ ] T008 [P] [US3] 删除 utils：`src/utils/music.js`、`videos.js`、`lrc.js`、`videoPoster.js`、`uploadWorker.js`
- [ ] T009 [P] [US1] 删除内容与媒体：`src/videos/`（6 md + video-meta.json）、`src/music/`（11 md）、`public/videos/`、`public/music/`
- [ ] T010 [P] [US1] 删除下载工作流：`.github/workflows/download.yml`、`downloads/` 目录
- [ ] T011 [P] [US5] 移除依赖：`package.json` 删除 `three`（npm uninstall three）

---

## Phase 2: 收敛路由与入口（US1 / US3）

**Purpose**: 路由只保留核心页面；所有已下线功能的页面入口与按钮摘除。

- [ ] T012 [US1] 更新 `src/router.js`：移除 videos / music / workbench / effects / notes-editor / posts-editor 六条路由
- [ ] T013 [US1] 更新 `src/components/BlogNav.vue`：导航收敛为 文章/随笔/时间线/关于 四项（新增 timeline 项，移除 videos/music 项）
- [ ] T014 [US3] 更新 `src/views/HomeView.vue`：移除「写文章」按钮
- [ ] T015 [US3] 更新 `src/views/NotesView.vue`：移除「写随笔」按钮与随笔「编辑」链接；保留 管理/回收站/删除/还原/彻底删除
- [ ] T016 [US3] 更新 `src/views/PostView.vue`：移除「编辑」链接
- [ ] T017 [US3] 更新 `src/App.vue`：移除 GlobalParticleTrail、MiniPlayer、全局 audio 元素与音乐 store 逻辑；保留 BgImage/ScrollProgress/BackToTop/SearchModal/页脚统计
- [ ] T018 [US3] 更新 `src/components/SettingsPanel.vue`：仅保留 外观（暗色模式）与 背景图片（URL 引用）两项；移除特效页、身份档案页、背景上传与图库逻辑
- [ ] T019 [US3] 瘦身 `src/stores/settings.js`：移除 notes（便签）字段与 addNote/removeNote；保留 theme/fontSize/background/navBackground
- [ ] T020 [US3] 瘦身 `src/utils/githubFiles.js`：移除 uploadFile / uploadFileXhr / fileToBase64 / fileToBase64Worker / terminateWorker；保留 checkPassword / getToken / getFileSha / deleteFile / moveFile
- [ ] T021 [US3] 瘦身 `src/utils/localMedia.js`：移除 getLocalUploads / addLocalUpload / removeLocalUpload / isLocalUpload；保留回收站 trash 系列函数
- [ ] T022 [US3] 更新 `src/views/AboutView.vue`：移除「工具箱」区块（工作台/特效链接），改写「使用指南」「版权声明」为收敛后说明

---

## Phase 3: 样式与 SEO 收敛（US2 / US4）

**Purpose**: design.css 裁剪至核心页面所需；站点元信息与 sitemap 与收敛后范围一致。

- [ ] T023 [US2] 编写并执行 CSS 裁剪脚本：以保留组件的类名/ID 为白名单过滤 `src/styles/design.css`，保留 tokens、全局元素样式与所需 keyframes，输出使用类覆盖率报告
- [ ] T024 [US4] 更新 `index.html`：description/og:description 移除「视频与音乐收藏」表述
- [ ] T025 [US4] 更新 `public/sitemap.xml`：移除 videos / music / workbench 条目
- [ ] T026 [US4] 更新 `.github/workflows/deploy.yml`：移除 `paths-ignore: ['downloads/**']`（downloads 已下线）

---

## Phase 4: 文档同步（US4）

**Purpose**: 项目记忆与对外文档与收敛后功能一致。

- [ ] T027 [US4] 更新 `README.md`：移除视频/音乐/工作台/编辑器/媒体上传说明，保留文章/随笔/时间线/关于与构建发布流程
- [ ] T028 [US4] 更新 `AGENTS.md`：移除视频/音乐/下载器/编辑器/媒体上传模块速查，更新导航与模块表
- [ ] T029 [US4] 更新 `devlog/README.md`：新增 2026-09-10 站点收敛记录（含踩坑与决策）

---

## Phase 5: 验证与发布（US5）

**Purpose**: 构建零错误、静态检索无残留、发布成功。

- [ ] T030 [US5] 静态检索：全局 grep 已下线组件/store/util 名称，确认无残留引用
- [ ] T031 [US5] 本地 `npm run build` 零错误
- [ ] T032 [US5] `git add` + 语义化提交（docs: 宪法 v2.0.0 等分批提交）+ `git push origin main`
- [ ] T033 [US5] 查询 GitHub Actions API 部署运行结论为 success
- [ ] T034 [US5] speckit converge：逐条核对 spec FR/SC，输出收敛报告

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1（移除）→ Phase 2（收敛入口）→ Phase 3（样式/SEO）→ Phase 4（文档）→ Phase 5（验证发布）
- Phase 1 必须先行：删除源码后，Phase 2 的引用清理才有干净的检索基线
- T011（npm uninstall three）可在 Phase 1 任意节点执行；T030 静态检索在 Phase 2 结束后执行以覆盖全量引用

### Within Each Phase

- [P] 标记任务可并行（不同文件）；无 [P] 的任务按编号顺序执行
- 同一文件多处修改（如 SettingsPanel 同时涉及模板与逻辑）在单个任务内完成

### Parallel Opportunities

- Phase 1 内 T001-T011 全部为不同文件/目录，可并行执行
- Phase 2 内 T012-T022 均为不同文件，可并行执行
- Phase 3 内 T023-T026 相互独立，可并行执行（T023 需在 Phase 2 完成后才有准确的保留类清单）
- Phase 4 内 T027-T029 相互独立

---

## Notes

- 删除全部使用 `git rm`（保留 Git 历史可恢复），不新建副本文件
- 修改已有文件直接编辑（Edit/Write 覆盖），遵守「修改已有文件直接编辑，不新建副本」
- 提交分批：宪法+specs（docs）→ 模块删除（feat/chore）→ 入口收敛（feat）→ 文档同步（docs）→ 最终构建验证
- 每个阶段完成后以 grep + build 做轻量验证，再进入下一阶段
