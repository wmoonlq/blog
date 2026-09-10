# Feature Specification: 站点收敛（blog-simplify）

**Feature Branch**: `main`（项目惯例：直接推送 main，specs/ 随代码提交）

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "初始化speckit，整体优化个人博客，博客太杂、什么都有，不必要的功能不再保留，全程自主推进不需确认"

## User Scenarios & Testing

### User Story 1 - 信息架构收敛为纯写作站 (Priority: P1)

作为博客主人，我希望打开站点只看到与「写作」相关的入口（文章、随笔、时间线、关于），不再看到视频、音乐等大杂烩入口，这样访客一眼就知道这是一个个人写作博客。

**Why this priority**: 这是「太杂了，什么都有」的核心观感来源，导航与路由是用户第一接触面，必须先收敛。

**Independent Test**: 打开导航栏，只出现 文章/随笔/时间线/关于 四项 + 搜索 + 设置；直接访问 `#/videos`、`#/music`、`#/workbench`、`#/workbench/effects`、`#/notes/editor`、`#/posts/editor` 均不再呈现对应功能页。

**Acceptance Scenarios**:

1. **Given** 站点已部署，**When** 用户查看导航栏，**Then** 导航仅含 文章/随笔/时间线/关于 四项（含搜索与设置按钮）
2. **Given** 站点已部署，**When** 用户直接访问已下线路由，**Then** 不渲染任何已下线功能（回到核心页面或空态兜底），控制台无报错

---

### User Story 2 - 下线全部工具与特效 (Priority: P1)

作为博客主人，我希望工作台小工具（贪吃蛇、番茄钟、骰子、随机抽取、倒计时、密码生成、便签）与特效陈列室（19 种效果、全站粒子轨迹、3D 粒子）彻底下线，连同其依赖（three.js）与样式一起移除，让代码库与站点都恢复克制。

**Why this priority**: 工具与特效是「杂」的另一个主要来源，且引入 three.js 等重依赖，直接影响首屏与包体积。

**Independent Test**: 在代码库中检索已下线组件名（SnakeGame、PomodoroTimer、ParticleNebula、GlobalParticleTrail 等），全部无引用；`package.json` 不再包含 three 依赖；构建产物中无相关 chunk。

**Acceptance Scenarios**:

1. **Given** 重构后的代码库，**When** 全局检索上述组件与特效名称，**Then** 无任何源码引用
2. **Given** 重构后的代码库，**When** 执行构建，**Then** `package.json` 依赖中无 three，构建产物体积小于重构前

---

### User Story 3 - 下线在线编辑器与媒体上传，保留随笔回收站 (Priority: P2)

作为博客主人，我希望网页端文章/随笔编辑器、媒体管理器、背景图上传、身份档案下线（写作改回直接编辑仓库 md 文件），同时保留随笔的删除→回收站→还原→彻底删除闭环，管理入口保持可用。

**Why this priority**: 编辑器与上传涉及 Token、密码、上传管道，属于高复杂度低收益的功能；回收站是随笔模块既有核心能力，必须保留。

**Independent Test**: 随笔页「管理」→ 删除/还原/彻底删除三个操作在本地构建产物中流程完整可用；设置面板不再出现上传/特效/身份页面。

**Acceptance Scenarios**:

1. **Given** 重构后的站点，**When** 打开随笔页并进入管理模式，**Then** 删除（移入回收站）、回收站内还原、回收站内彻底删除均可触发
2. **Given** 重构后的站点，**When** 打开设置面板，**Then** 仅剩 外观（暗色模式）与 背景图片（URL 引用）两项，无上传/特效/身份入口
3. **Given** 重构后的文章页/随笔页/首页，**When** 查看操作入口，**Then** 不再出现「写文章」「写随笔」「编辑」链接

---

### User Story 4 - 文档与 SEO 同步收敛 (Priority: P2)

作为博客主人，我希望 README、AGENTS.md、开发日记、宪法、sitemap、站点描述全部更新为收敛后的范围，不残留已下线模块的说明，访客与搜索引擎看到的信息与站点实际一致。

**Why this priority**: 文档是项目记忆与对外名片，残留说明会造成误导。

**Independent Test**: 检索 README/AGENTS.md/devlog/宪法/sitemap/index.html，无「视频」「音乐」「工作台」「编辑器」「媒体上传」「下载」等已下线功能说明；sitemap 中无已下线路由。

**Acceptance Scenarios**:

1. **Given** 重构后的仓库，**When** 检索上述文档，**Then** 已下线模块相关说明全部移除或改写
2. **Given** 重构后的仓库，**When** 查看 sitemap.xml 与 index.html 元信息，**Then** 不含 videos/music/workbench 等条目

---

### User Story 5 - 构建发布验证通过 (Priority: P3)

作为博客主人，我希望重构后 `npm run build` 零错误、推送 main 后 GitHub Actions 部署成功、核心页面可正常访问，保证优化不破坏站点可用性。

**Why this priority**: 一切优化以站点可用为前提，属于最终验收。

**Independent Test**: 本地执行构建命令无错误；推送后查询 Actions 运行结论为成功。

**Acceptance Scenarios**:

1. **Given** 重构完成，**When** 本地执行 `npm run build`，**Then** 零错误退出
2. **Given** 推送 main 后，**When** 查询 Actions 部署结论，**Then** 为成功（success），站点核心页面可访问

---

### Edge Cases

- 用户浏览器已保存的设置（localStorage）中，背景图 URL 指向已移除的 `public/bg` 之外的资源：背景不展示但不报错、不影响其他功能
- 用户浏览器已保存的音乐收藏/歌单/播放历史等 localStorage 键：重构后不再被读取，无残留副作用
- 直接访问已下线路由（收藏夹、外链、搜索快照）：不渲染已下线功能，且不产生控制台错误
- Giscus 评论 CATEGORY_ID 仍未配置（既有 TODO，仓库未启用 Discussions）：评论暂不生效，不属于本任务范围，不改动

## Requirements

### Functional Requirements

- **FR-001**: 导航栏 MUST 仅包含 文章、随笔、时间线、关于 四项导航（另含搜索与设置按钮），不再有视频/音乐入口
- **FR-002**: 路由 MUST 移除 videos、music、workbench、workbench/effects、notes/editor、posts/editor 六个页面
- **FR-003**: 首页、随笔页、文章详情页 MUST 不再提供「写文章」「写随笔」「编辑」入口
- **FR-004**: 工作台小工具（SnakeGame、PomodoroTimer、DiceTool、RandomPick、CountdownTimer、PasswordGenerator、StickyNotes）MUST 全部下线，源码与引用一并移除
- **FR-005**: 特效陈列室（components/effects/ 下全部效果）、全站粒子轨迹（GlobalParticleTrail）、3D 相关（useThree/threeTheme/effects store/three 依赖）MUST 全部下线
- **FR-006**: 在线编辑器（NotesEditorView、PostsEditorView、MarkdownEditor）MUST 下线
- **FR-007**: 媒体管理器（MediaManager）、背景图上传与图库（SettingsPanel 内）、身份档案（user store）MUST 下线
- **FR-008**: 随笔回收站 MUST 保留：删除（移入 src/notes-trash/）、还原、彻底删除三个操作可用，密码门禁与 Token 复用逻辑不变
- **FR-009**: 设置面板 MUST 仅保留 外观（暗色模式）与 背景图片（URL 引用）两项设置
- **FR-010**: 音乐模块（视图/播放器/迷你播放器/音频引擎/歌词解析/音乐数据与媒体文件）与视频模块（视图/播放器/下载器/视频数据与媒体文件/download.yml 工作流/downloads 目录）MUST 全部下线
- **FR-011**: sitemap.xml 与 index.html 元信息 MUST 移除已下线模块的条目与描述
- **FR-012**: `package.json` MUST 移除 three 依赖；design.css MUST 裁剪为仅保留核心页面所需样式
- **FR-013**: README.md、AGENTS.md、devlog/README.md、宪法 MUST 与收敛后的功能范围一致
- **FR-014**: 本地 `npm run build` MUST 零错误
- **FR-015**: 提交推送 main 后，GitHub Actions 部署 MUST 成功

### Key Entities

- **页面/路由**: 保留 首页、随笔、文章详情、时间线、关于；移除 视频、音乐、工作台、特效、两个编辑器
- **内容源**: 保留 `src/posts/`、`src/notes/`（含 `src/notes-trash/` 回收站）；移除 `src/videos/`、`src/music/`、`public/videos/`、`public/music/`
- **设置项**: 保留 theme/fontSize/background/navBackground；移除 effects（粒子轨迹）、notes（便签）、user（身份档案）
- **构建与发布**: 保留 deploy.yml（含路径忽略清理）；移除 download.yml

## Success Criteria

### Measurable Outcomes

- **SC-001**: 导航项从 5 项（含视频/音乐）收敛为 4 项，无死链
- **SC-002**: 已下线路由（videos/music/workbench/effects/两个编辑器）全部不可达，不渲染任何残留功能
- **SC-003**: 构建产物体积与 CSS 体积相对重构前显著下降（产物可量化对比）
- **SC-004**: 随笔删除/还原/彻底删除三个操作在构建产物中流程完整可用
- **SC-005**: `npm run build` 零错误，Actions 部署成功，首页/文章/随笔/时间线/关于 5 个核心页面正常渲染
- **SC-006**: 检索 README/AGENTS.md/devlog/宪法/sitemap/index.html，无已下线模块残留说明

## Assumptions

- 已下线模块的内容（音乐 md 与媒体、视频 md 与媒体）从仓库移除，均可从 Git 历史恢复
- `public/bg/` 背景图文件保留，设置面板的 URL 引用仍可指向这些文件
- 工作直接在 main 分支进行（项目既有惯例：直接推送 main 自动部署），`specs/` 目录随代码提交
- specify-cli 保持 1.0.4，不升级（自检仅提示 1.0.5 可用）
- 不新增任何测试框架；验证以构建 + 静态检索 + 部署结论为准（与既有验收铁律一致）
