# 开发日记

本目录记录博客的开发历程、功能迭代与踩坑记录。每轮开发结束由 AI 代理更新。

## 索引

- [2026-08-16 全站功能大升级](#2026-08-16-全站功能大升级)
- [2026-08-16 搭建 AI 代理团队与循环编码验收](#2026-08-16-搭建-ai-代理团队与循环编码验收)
- [2026-08-17 时间线 403 根治与 CR 修复](#2026-08-17-时间线-403-根治与-cr-修复)
- [2026-08-19 音乐封面与模糊背景](#2026-08-19-音乐封面与模糊背景)
- [2026-08-19 博客命令行窗口](#2026-08-19-博客命令行窗口)
- [2026-08-19 视频链接下载（yt-dlp + Actions）](#2026-08-19-视频链接下载yt-dlp--actions)
- [2026-08-20 视频收藏夹式多集合 + 分区](#2026-08-20-视频收藏夹式多集合--分区)
- [2026-08-20 音乐 QQ 音乐对标升级](#2026-08-20-音乐-qq-音乐对标升级)
- [2026-08-23 音乐播放器酷狗风格改版](#2026-08-23-音乐播放器酷狗风格改版)
- [2026-08-23 全站模块重构 — 统一骨架 · 模块提质](#2026-08-23-全站模块重构--统一骨架--模块提质)
- [2026-08-23 特效页新增写轮眼（永恒万花筒）](#2026-08-23-特效页新增写轮眼永恒万花筒)
- [2026-08-19 随笔回收站](#2026-08-19-随笔回收站)
- [2026-08-19 命令行桥接本机 shell](#2026-08-19-命令行桥接本机-shell)
- [2026-08-19 桥接升级 WebSocket 持久会话（参考 DSH）](#2026-08-19-桥接升级-websocket-持久会话参考-dsh)
- [2026-09-03 引入 Spec Kit 规格驱动开发](#2026-09-03-引入-spec-kit-规格驱动开发)
- [2026-09-03 全站体验优化：性能 · SEO · UI · 阅读 · 功能](#2026-09-03-全站体验优化性能--seo--ui--阅读--功能)
- [2026-09-03 蓝白主题重制与灵动按钮](#2026-09-03-蓝白主题重制与灵动按钮)

---

## 2026-08-16 全站功能大升级

### 背景

原博客为纯静态展示（首页 + 文章 + 随笔 + 简单工作台/特效页）。本次从零开始大规模升级，最终形成「内容 + 媒体 + 工具 + 特效」的完整个人站点。

### 功能迭代清单

#### 第一轮：全站基础升级

| 功能 | 说明 |
|---|---|
| 页面切换过渡动画 | `<transition>` out-in 模式，0.4s 淡入+位移 |
| 顶部阅读进度条 | ScrollProgress 组件，scaleX 跟随滚动 |
| 回到顶部按钮 | 滚动超 480px 出现 |
| 全局搜索弹层 | `Ctrl+K` 或 `/` 唤起，跨文章+随笔，方向键选择 |
| 导航升级 | 桌面内联导航 + 搜索按钮 + 激活态下划线动画 |
| 首页 | 搜索筛选 + 标签 chips + 按年分组 + 阅读时长估算 |
| 随笔页 | 按月分组 + 相对时间 + 长文折叠展开 |
| 文章页 | 自动目录（滚动高亮）+ 上一篇/下一篇 + 代码复制 |
| 编辑器 | 字数统计 + 草稿自动保存 |
| 工作台 | 番茄钟（SVG 圆环）+ 骰子 + 随机一篇 |
| 特效页 | 数字时钟 / 点击涟漪 / 呼吸圆 / 光标残影 |

#### 第二轮：更多页面与暗色模式

| 功能 | 说明 |
|---|---|
| 暗色模式 | 导航月亮/太阳切换，派生 tokens 变量化 |
| 标签页 / 时间线页 / 关于页 | 三个新页面 |
| 文章字号调节 | A−/A+（14–20px） |
| 编辑器三模式 | 编辑/分屏/预览 |
| 工作台 | 倒计时 / 密码生成器 / 便签板 |
| 特效页 | 烟花 / 落雪 / 3D 倾斜卡 / 逐字律动 |

#### 第三轮：three.js 3D 特效

| 特效 | 说明 |
|---|---|
| 粒子星云 | 900 粒子椭圆球自转 |
| 波形网格 | 40×40 网格正弦起伏 |
| 莫比乌斯环 | 线框 TorusKnot 双轴旋转 |
| 流星雨 | 粒子倾斜坠落循环 |
| 粒子玫瑰 | 4200 粒子聚散成玫瑰（后移除交互改为点击爆炸） |
| 反重力方块 | 380 方块 3D 漂浮场 |

#### 第四轮：视频与音乐模块

| 功能 | 说明 |
|---|---|
| 视频页 | 自定义播放器（进度/音量/倍速/全屏/快捷键）+ Bilibili 嵌入支持 |
| 视频分类 | 分类 chips + 合集分组 + 卡片网格 |
| 视频封面 | 自动截帧（VideoThumb）+ poster 自定义 |
| 音乐模块 | 播放器（模式/列表/随机）+ 上传/删除管理 |
| 歌词 | LRC 解析 + 同步高亮滚动 + 频谱背景动画 + 歌词校准 |

#### 第五轮：媒体管理

| 功能 | 说明 |
|---|---|
| 背景图上传 | 密码门禁 + 上传到 GitHub `public/bg/` |
| 视频/音乐上传 | Worker 后台读取 + XHR 进度条 + 密码 + Token |
| 视频/音乐删除 | 需密码 + Token + 二次确认 |
| 本地待发布 | 上传后立即显示（带「待发布」角标），构建完成后自动转正式 |

### 踩坑记录

#### 1. 粒子玫瑰黑屏

- **现象**：粒子玫瑰特效完全空白
- **原因**：`useThree(factory)` 只传了 factory，拖拽状态对象 `drag` 没通过第二参数传入，factory 内 `drag.rotY` 第一帧抛 TypeError，动画循环直接终止
- **解决**：`useThree` 增加第二参数 `extra`，`useThree(factory, drag)` 传入共享状态

#### 2. test-videos 样片无声

- **现象**：下载的 jellyfish/sintel/bbb 视频没声音
- **原因**：test-videos.co.uk 的 1MB 样片是纯视频（为省体积去掉了音轨），页面详情只标注了 `Codec: libx264`
- **排查**：用 PowerShell 解析 MP4 二进制查找 `mp4a` sample entry 验证音轨
- **解决**：换用 MDN 样片（flower/friday 带音轨）+ W3Schools mov_bbb.mp4（带 UA 头）

#### 3. 视频点击回拉过多

- **现象**：点击视频条目后页面平滑滚回最顶部（整个 hero 都滚进来）
- **解决**：改为滚到播放器区块位置（`.video-featured` 顶部偏移 88px 避开吸顶导航）

#### 4. 网易云歌曲下载返回 HTML

- **现象**：薛之谦《演员》外链 `music.163.com/song/media/outer/url?id=xxx.mp3` 返回 104KB HTML 错误页
- **原因**：VIP 版权保护，外链接口返回验证页
- **解决**：从公开仓库 slshenhong/music_file_xuezhiqian 拉取 flac（raw.githubusercontent 需走代理）

#### 5. 歌词与演唱不同步

- **现象**：手写 LRC 时间轴与实际演唱对不上
- **原因**：凭记忆编的时间戳不准确，最后几行超出歌曲实际时长（4:21）
- **解决**：接入网易云官方歌词 API（`/api/song/lyric?id=`），拿到精确毫秒级 LRC；parseLRC 过滤元数据/空行
- **最终方案**：实现「歌词校准」——±0.1s/±0.5s 微调按钮 + 按歌曲记忆偏移 + 支持 LRC `[offset:]` 标签（酷狗/网易的标准做法）

#### 6. LRC 编码陷阱

- **现象**：网易云返回的歌词里 `\n` 是字面字符，写入文件后时间戳黏在一行
- **原因**：PowerShell `ConvertFrom-Json` 只处理了一层转义；且 PowerShell 5.1 默认用 GBK 读写文件
- **解决**：用 .NET `File.ReadAllText/WriteAllText` 显式 UTF-8，先 `.Replace("\\n", "`n")` 再写

#### 7. 上传后看不到新内容

- **现象**：上传视频/音乐后页面没反应
- **原因**：`import.meta.glob` 是构建期扫描，上传写入 GitHub 后要等 Actions 重新构建才可见（1-2 分钟）
- **解决**：localStorage 本地记录待发布条目，上传成功立即渲染（带「待发布」角标），构建完成后按 slug 去重自动切换为正式数据

#### 8. GitHub 视频大小限制

- **硬上限**：单文件 100MB（push 会拒绝），仓库软上限 1GB，Pages 建议 1GB 内
- **实际建议**：单视频 ≤50MB 体验最佳；长视频用 Bilibili 嵌入
- **前端限制**：音乐/视频上传均放宽到 100MB（GitHub 物理上限）

#### 9. 上传卡顿（大文件）

- **现象**：大文件 base64 转换阻塞主线程，页面卡死，且无进度反馈
- **解决**：Web Worker 后台分块读取（FileReaderSync + slice 分块 + 节流上报）+ XHR `upload.onprogress` 真实上传进度条（fetch 无上传进度 API，XHR 有）

#### 10. 写轮眼形状还原难度

- **历程**：点阵粒子 → SVG Path 采样+连线 → three.js 方块 → 最终用户要求纯方块漂浮场
- **经验**：粒子拼图案效果差；SVG Path 采样能精确还原轮廓；交互需求不断变化时先确认最终形态再动手

### 架构要点

- 视频/音乐/背景图元数据全部用 `src/*/*.md`（frontmatter），与文章/随笔同一套内容体系
- 媒体文件放 `public/`（构建时原样复制，路径 `/blog/xxx/文件名`）
- GitHub 操作统一走 `src/utils/githubFiles.js`（上传/删除/读 sha，密码门禁 `123456` + Token 复用 `notes-token`）
- 设计系统约束贯穿始终：无渐变、无彩色图标、衬线标题、单强调色

---

## 2026-08-16 搭建 AI 代理团队与循环编码验收

### 背景

需求：组建 agent 团队高效开发博客，并实现「AI 自动循环编码验收」——编码后自动构建、审查、验收，不通过自动带修复指令重跑。

### 功能迭代清单

| 模块 | 说明 |
|---|---|
| `blog-dev` | 实现 agent：最小改动实现需求，遵守设计系统与 AGENTS.md 铁律，交付前自行 `npm run build` |
| `blog-reviewer` | 只读审查 agent：查禁区文件、设计 tokens、副本文件、代码质量、devlog 同步，输出 PASS/ISSUES |
| `blog-qa` | 验收 agent：`npm run build` 零错误 + 验收标准逐项核验，输出裁决与修复指令（编辑权限全禁） |
| `/devloop` 命令 | 主 agent 编排循环：开发 → 构建 → 审查 → 验收，最多 3 轮；通过后同步开发日记、语义化 commit、push |

### 踩坑记录

#### 1. 子代理工具权限分层

- 三个子代理分别用 `permission` 控制：dev 可编辑、reviewer/qa 只读（`edit: deny`）+ 可跑 bash（验证构建）
- 子代理输出必须结构化（裁决 + 问题清单 + 修复指令），否则主 agent 无法把验收结果喂回下一轮 dev

#### 2. 验收标准前移到 AGENTS.md

- 验收铁律（构建零错误、不碰构建文件、符合 tokens、无副本、需求覆盖）写进 AGENTS.md，作为 blog-qa 的固定核对项，避免每轮口头传递
- 架构要点：验收标准 = 通用铁律（AGENTS.md）+ 本轮需求原文（用户输入），两者缺一不可

### 架构要点

- 团队定义在 `.opencode/agent/`（name 匹配文件名，frontmatter 写 mode/permission）
- `/devloop <需求>` 的模板即工作流提示词：子代理信息由主 agent 中转，验收不通过时把修复指令原样附给下一轮 dev
- 开发日记需记录功能迭代与踩坑记录（同轮提交）

---

## 2026-08-17 时间线 403 根治与 CR 修复

### 背景

时间线页（GitHub commit 历史）运行时直连 `api.github.com`，用户浏览器环境返回 403（GFW/共享 NAT 限流）。code review 同时确认两个日期显示 bug（relativeTime 对完整 ISO 时间戳恒空、分组/显示时区不一致）。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 构建时生成时间线数据 | 新增根目录 `gen-commits.js`，拉取 commits API（最多 100 条，可设 `GITHUB_TOKEN` 提升限流）生成 `public/commits.json`（sha/message/date/url），构建时随 `public/` 复制进 dist |
| 前端双数据源 | `TimelineView.vue` 优先读 `{BASE_URL}commits.json`（本地静态数据，无网络依赖），失败回退 GitHub API，再失败显示错误 + 重试；localStorage 5 分钟缓存保留 |
| 日期显示修复 | 统一 `formatDate` 转访客本地时区后展示，分组取同字符串前 10 位（消除时区不一致）；`relativeTime` 兼容完整 ISO（含 `T` 时不再拼接 `T00:00:00`） |
| 代码清理 | 删除未用字段（fullMessage/author），空态内联样式提取为 `.timeline-empty` 类（tokens 化） |

### 踩坑记录

#### 1. 浏览器直连 GitHub API 403

- **现象**：时间线页 fetch commits API 报 403；本机走代理 curl 实测 200 且限流充足（remaining 60/60）
- **原因**：403 非限流，是浏览器出口网络（GFW 干扰/运营商拦截）拒绝 api.github.com 直连；且未认证 API 限 60 次/h/IP，共享 NAT 下迟早打满
- **解决**：把「拉数据」从运行时搬到构建期——前端改读构建产物 `public/commits.json`，彻底消除运行时外网依赖；API 仅作 dev 回退

#### 1.5 不能改 workflow：PAT 无 workflow scope

- **现象**：想把生成步骤加进 `.github/workflows/deploy.yml`，push 被拒：`refusing to allow a Personal Access Token to create or update workflow ... without workflow scope`
- **原因**：GitHub 硬性限制——更新 `.github/workflows/` 下任何文件需 token 具备 `workflow` 权限；当前 fine-grained PAT 只有 Contents 读写
- **解决**：生成脚本放仓库根目录 `gen-commits.js`，数据文件 `public/commits.json` 直接提交进仓库，每次发布前重新生成（本机走代理 curl 拉取后喂给脚本转换）；build 时经 `public/` 自动进 dist，工作流零改动

#### 2. relativeTime 对 ISO 时间戳恒空

- **现象**：每条提交显示 `2026-08-17 00:00 · `（相对时间恒空）
- **原因**：`relativeTime` 内部 `new Date('${dateStr}T00:00:00')`，对含时区偏移的完整 ISO（如 `2026-08-17T00:00:48+08:00`）产生 Invalid Date；旧调用方传的都是 `YYYY-MM-DD` 未暴露
- **解决**：`dateStr.includes('T')` 时直接 `new Date(dateStr)`，否则保持原拼接行为（旧调用方不变）

#### 3. 分组与显示时区不一致

- **现象**：分组按提交作者时区（`date.slice(0,10)`）切「天」，显示按访客浏览器本地时区格式化，非 +08 时区访客看到「2026-08-16 分组下显示 2026-08-17」
- **解决**：数据层统一先 `formatDate`（访客本地时区）再存，分组与显示取同一字符串，天然一致

### 架构要点

- 时间线数据流：`gen-commits.js` 生成 → `public/commits.json` 提交进仓库 → build 时随 `public/` 进 dist → 前端静态读取；API 仅作 dev 环境回退
- `import.meta.env.BASE_URL`（`/blog/`）拼接资源路径，保证子路径部署可用
- 待办：PAT 若补 `workflow` 权限，可把生成步骤迁入 Actions（runner 直连 + `GITHUB_TOKEN` 限流 5000/h），commits.json 免手动维护

---

## 2026-08-19 音乐封面与模糊背景

### 背景

音乐模块此前只有音频/歌词元数据，封面图片早已在 `public/music/covers/` 但未被引用（播放器支持 `cover` 字段却一直空置），音乐页也无背景氛围。本次补齐「封面 + 背景」两件事。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 补齐封面字段 | 11 首曲目 frontmatter 新增 `cover: "/blog/music/covers/<slug>.jpg"`，播放器大封面与迷你播放器小封面即刻生效 |
| 音乐页模糊背景 | 新增 `.music-bg`（当前曲目封面 blur 56px + scale 放大防露边）与 `.music-bg-veil`（半透明 `--bg` 遮罩保文字对比度）两层，`currentTrack` 驱动、切歌即时换背景；页面内容 `z-index:1` 浮于其上 |

### 踩坑记录

#### 1. 模糊层露边

- **现象**：`position:absolute` 铺满后，`filter:blur` 会让边缘露出未模糊的硬边
- **解决**：`transform: scale(1.35)` 放大模糊层，配合 `overflow:hidden` 的父容器裁切，边缘永远在视口外

#### 2. 背景遮罩透出页面底色

- **现象**：纯模糊封面作背景时，浅色封面（如 yiban.jpg）会让白底文字对比度不足
- **解决**：叠加 `background: var(--bg)` + `opacity:.55` 的 veil 层，恢复设计系统暖米底同时保留色相氛围

### 架构要点

- 封面路径约定：`/blog/music/covers/<slug>.jpg`，与 `source` 同目录风格，Base URL 前缀保证子路径部署可用
- 封面数据流：frontmatter `cover` → `utils/music.js` 读取 → 播放器/迷你播放器/背景三处消费
- 待办：上传入口（MediaManager）暂未支持上传封面，新上传曲目无封面（播放器回退 ♫ 字形、背景隐藏），后续可加封面上传字段

---

## 2026-08-19 博客命令行窗口

### 背景

用户希望博客里有一个「cmd 的窗口界面」——复古终端风格的交互页，可输入命令。作为纯前端站点无法调用本机 shell，故实现为内置的命令行模拟器，命令操作站内数据。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 新增 `/cmd` 页面 | `CmdView.vue` + 路由 + 导航「命令行」入口，窗口含标题栏（三点装饰）+ 等宽字体输出区 + 可输入行 |
| 命令集 | `help`/`whoami`/`date`/`echo`/`ls`/`posts`/`notes`/`music`/`videos`/`play <n>`/`goto <page>`/`history`/`cls` + `ping`/`ipconfig`/`matrix`/`sudo`/`exit` 彩蛋 |
| 交互细节 | 方向键 ↑↓ 翻历史、点击窗口自动聚焦、回车执行、输出自动滚底、`play <n>` 直接唤起全局播放器 |

### 踩坑记录

#### 1. watch 数组不触发

- **现象**：`watch(lines, scrollDown)` 在 `lines.value.push()` 后不触发自动滚动
- **原因**：`lines` 是 ref 数组，默认浅监听只跟踪引用替换，`.push()` 是原地变更
- **解决**：`watch(lines, scrollDown, { deep: true })`；清屏用整数组替换 `lines.value = []` 亦兼容

### 架构要点

- 命令输出统一 `push(text, cls)` 入 `lines` 数组渲染，`cls` 控制 dim/accent/err 三类样式（全部走 tokens，无彩色图标）
- 数据消费复用现有工具函数 `utils/posts|notes|music|videos.js`，播放复用全局音乐 store `playIndex`，与音乐页联动
- 页面纯前端模拟 cmd 外观（`--font-mono` + `--pre-bg` 面板），随明暗主题自适应

---

## 2026-08-19 视频链接下载（yt-dlp + Actions）

### 背景

用户希望把开源项目 [yt-dlp](https://github.com/RanT711/yt-dlp)（命令行视频下载器）集成进视频模块。纯静态站浏览器跑不了 Python CLI，但现有「前端写仓库 → push 触发 Actions → 自动发布」链路已成熟，故让 Actions 在云端执行 yt-dlp。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 视频页「下载视频」入口 | `VideoDownloader.vue`：粘贴链接（必填）+ 标题/分类/合集（可选），密码 + Token 门禁（与上传一致） |
| 队列文件 | 提交后把 `{url,title,category,collection,date,requestedAt,status:'queued'}` 写入 `downloads/queue.json`（Contents API，已有文件需带 sha 覆盖） |
| 下载 workflow | 新增 `.github/workflows/download.yml`，`on: push: paths:['downloads/queue.json']` 触发；安装 yt-dlp + deno（JS challenge 引擎）→ Python 脚本读队列 → 抓取 720p（`bv*[height<=720]+ba`）≤300M，合并/转封装 mp4 → 写 `public/videos/` + 生成 `src/videos/*.md`（含自动下载的 poster 封面）→ 提交推送 |
| 部署防抖 | `deploy.yml` 加 `paths-ignore: ['downloads/**']`，写队列文件不再触发空构建；下载 workflow 提交只 `git add public/videos src/videos`，不碰 `downloads/`，无自触发死循环 |
| 显式触发部署 | GITHUB_TOKEN 的 push 不会触发下游 workflow，故 download.yml 提交后 `gh workflow run deploy.yml --ref main` 显式调度部署（deploy.yml 增 `workflow_dispatch`） |

### 踩坑记录

#### 1. workflow 提交会自触发

- **现象**：下载完提交如果也改动 `downloads/`，`paths: ['downloads/queue.json']` 会再次触发同一 workflow，形成死循环
- **解决**：提交阶段只 `git add public/videos src/videos`，queue.json 原样保留；下一次下载是覆盖写（走 Contents API），天然再触发一次。workflow 开头无队列/空 url 直接退出

#### 2. 覆盖已有队列文件需 sha

- **现象**：Contents API 对已存在文件 PUT 不带 sha 报 422
- **解决**：`githubFiles.js` 的 `uploadFile` 增加可选 `sha` 参数，组件先 `getFileSha` 再 PUT

#### 3. PowerShell 直接调 `npm` 不生效

- **现象**：PowerShell 里裸 `npm run build` 返回空、dist 无更新
- **解决**：Windows 下用 `cmd /c "npm run build"` 执行（npm 是 .cmd 批处理）

#### 4. GITHUB_TOKEN 的 push 不触发下游 workflow

- **现象**：download.yml 提交视频后，deploy.yml 未运行——GitHub 平台行为：GITHUB_TOKEN 触发的事件（push 等）不会创建新的 workflow run，防递归
- **解决**：workflow_dispatch 是例外。deploy.yml 增 `workflow_dispatch`，download.yml 提权 `actions: write`，push 成功后 `gh workflow run deploy.yml --ref main` 显式调度（gh 随 runner 预装，自动用 GITHUB_TOKEN 认证）

#### 5. B 站 412：假 buvid + 机房 IP 双重封锁

- **现象**：B 站链接 yt-dlp 报 `HTTP Error 412: Precondition Failed`（Downloading webpage 阶段），GitHub runner 与本机均复现
- **排查**：`--impersonate chrome`、显式 Chrome UA、Referer 头、手写 `uuid+infoc` 的假 buvid 全部无效；`api.bilibili.com/x/frontend/finger/spi` 无需 cookie 可通，`x/web-interface/view` 需真实 buvid 且**带 Referer 反而 412**
- **根因**：① yt-dlp 默认给 B 站生成假 `buvid3`（`uuid4()+infoc`，bilibili.py:1920-1921），被 B 站 WAF 拒绝；② 本机整机走代理出口 AWS 东京、GitHub runner 美国机房 IP，对 B 站内容接口（网页/view API）硬 412
- **解决（本机）**：先用 urllib 调 spi 拿真实 `buvid3/buvid4` 写 Netscape cookies.txt，yt-dlp 加 `--cookies` + 直连 `--proxy ""`（PowerShell 传空串会被吞，用 `python -c`/脚本传参）即通；ffmpeg 用 `pip install imageio-ffmpeg`（自带静态二进制，`--ffmpeg-location` 指定）
- **局限**：GitHub runner（美国 IP）即使带真实 cookie 仍 412 → **浏览器「下载视频」功能对 B 站不可用**；workflow 已内置 spi→cookies 逻辑，对 YouTube 等站点正常。B 站只能本机/国内代理下载。若需 runner 支持 B 站，须给 Actions 配国内代理节点（加密 secret）

### 架构要点

- 数据流：前端 `VideoDownloader` → `downloads/queue.json`（密码+Token）→ push → `download.yml`（yt-dlp）→ 提交 `public/videos` + `src/videos` → `gh workflow run deploy.yml` 显式调度部署
- yt-dlp 用 PyPI 上游（RanT711 fork 与上游同源），`denoland/setup-deno` 提供 JS challenge 引擎（YouTube 支持所需，github runner 无 deno）；YouTube 数据中心 IP 常见 bot 拦截，B 站等站点不受影响
- 下载失败仅 workflow 标红，不污染仓库；队列文件仍在，人工重试可重新 push 或 workflow_dispatch 手动触发
- 待办：若 PAT 补 `workflow` 权限，可改为前端直接 `workflow_dispatch` 触发，省去 push 一程

---

## 2026-08-19 随笔回收站

### 背景

随笔此前只能编辑/永久删除（MarkdownEditor 高级选项里的删除是直接 DELETE，不可恢复）。用户要求删除先进回收站，回收站里可还原或彻底删除。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 回收站目录 | 新增 `src/notes-trash/`（含 `.gitkeep`），glob 在站点外；删除 = `moveFile` 把 `src/notes/<slug>.md` 移入，还原 = 移回，彻底删除 = DELETE |
| 工具函数 | `githubFiles.js` 新增 `getFileContent` + `moveFile`（读内容 → PUT 新路径 → DELETE 旧路径）；`notes.js` 新增 `getTrashedNotes()`；`localMedia.js` 新增 `getLocalTrashed/addLocalTrashed/removeLocalTrashed` 本地记录 |
| 随笔页 UI | Hero 加「回收站」（带数量角标）与「管理」按钮；管理模式下每篇随笔卡片出现「删除」；回收站列出已删条目，提供「还原」与「彻底删除」，均走密码 + Token 门禁（复用 `.delete-bar`） |
| 即时生效 | 删除/还原/清除后写本地 trash 记录，列表立即更新；构建后由 `src/notes-trash/` glob 接管持久化 |

### 踩坑记录

#### 1. 平行未提交改动共存

- **现象**：工作区有未提交的视频下载 WIP（`VideoDownloader.vue`、`download.yml`、`deploy.yml`、`VideosView.vue`、devlog 视频节），与回收站改动同文件（`githubFiles.js` 的 `uploadFile sha` 参数、AGENTS.md 视频条、devlog）
- **原因**：视频 feature 的 workflow 文件受 PAT 无 `workflow` 权限约束无法 push，故滞留工作区
- **解决**：本次只 `git add` 回收站相关文件提交；视频 helper/docs 改动随同文件带入（`uploadFile` 加 `sha` 向后兼容），视频功能文件与 workflow 留给后续有权限时再提交

#### 2. 本地 trash 记录保证删除即时消失

- **现象**：删除后文件在 GitHub 已移出 `src/notes`，但本机构建产物仍是旧 glob，随笔仍会显示
- **解决**：`addLocalTrashed` 写 localStorage，`notes` computed 过滤掉本地已删 slug；构建后该文件进入 `src/notes-trash` glob，天然不再出现

### 架构要点

- 移动采用「先 PUT 新路径、再 DELETE 旧路径」，失败时最多留副本、绝不丢数据
- 回收站数据源 = 本地 trash 记录 ∪ `getTrashedNotes()` glob，按 slug 去重，按日期倒序
- 还原后本地记录即删，重新构建后随笔恢复上线；密码门禁 `123456` 与上传/删除一致

---

## 2026-08-19 命令行桥接本机 shell

### 背景

用户希望博客「命令行」页能关联本机真实命令行。纯静态站浏览器无法直接执行本机 shell，故加一个本地 HTTP 桥接服务：博客页发命令 → 本机执行 → 流式回显。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 本地桥接服务 | 新增 `local-bridge/bridge.js`（Node 零依赖）：仅绑 `127.0.0.1:9876`，`GET /api/status` 存活检测，`POST /api/exec` 用 `spawn(cmd, {shell:true})` 执行并分块流式回显，`[退出码] n` 结尾，超时 120s；Token 门禁，`BRIDGE_PORT/BRIDGE_TOKEN/BRIDGE_TIMEOUT` 可配；npm script `bridge` |
| 命令行页接入 | CmdView 新增 `bridge`/`connect`/`disconnect`/`local`/`cwd` 命令 + `!` 前缀快捷执行；窗口标题栏加「本机在线/离线」状态点（10s 轮询）；Token 存 localStorage |
| 流式渲染 | fetch 读 `res.body.getReader()` 流式分块渲染输出，`[退出码]/[超时]/[错误]` 行降级为 dim 样式 |

### 踩坑记录

#### 1. 为何不用 WebSocket 而用 fetch 流

- **现象/原因**：交互式 shell 需要 stdin，POST+流式无法喂 stdin；但命令行页的场景是「执行命令看输出」，不需要交互输入，且 fetch 流零依赖、跨域 CORS 简单
- **取舍**：交互式 REPL（python/node -i）暂不支持；`cd` 不跨命令持久（每次独立子进程），用 `cwd <绝对路径>` 解决

#### 2. https 页访问本机 http 回环

- **现象**：部署在 GitHub Pages（https），fetch `http://127.0.0.1:9876` 是否算混合内容被拦？
- **解决**：Chrome/Edge/Firefox 对回环地址（127.0.0.1/localhost）有混合内容豁免，https 页可直连本机 http 服务；绑定固定 `127.0.0.1` 而非 `localhost` 最稳

#### 3. PowerShell 传 curl 的 JSON 转义坑（测试期）

- **现象**：`& curl.exe -d '{\"token\":...}'` 在 PS 单引号里 `\"` 原样透传，服务端 JSON 解析失败 → 误报「Token 无效」
- **解决**：测试改用 `Invoke-RestMethod -Body (ConvertTo-Json)`；真实前端 fetch 不受影响

### 架构要点

- 数据流：CmdView `local`/`!` → POST `/api/exec` → 本机 `spawn(cmd, shell)` 执行 → stdout/stderr 分块写响应 → 前端流式渲染
- 安全：仅绑 127.0.0.1 + Token 校验；每次执行独立子进程，天然隔离
- 待办：若要交互式 REPL 或持久会话，需升级为 WebSocket（带 stdin 通道）或双向管道

---

## 2026-08-19 桥接升级 WebSocket 持久会话（参考 DSH）

### 背景

上一版桥接是 HTTP POST + fetch 流：单向、无 stdin、每次独立子进程（`cd` 不持久），跑不了交互程序。用户提示参考 DeepSeek Harness 的做法，遂按其设计升级为 WebSocket 双向 + 常驻 shell 会话。

### 参考 DSH 的要点

| DSH 机制 | 我们落地 |
|---|---|
| WebSocket 双向传输 | `ws://127.0.0.1:9876/ws`，极简 RFC 6455 服务端手写（握手+掩码帧+分片+ping/pong/close），零依赖 |
| 常驻持久 shell（tool-bash-persistent） | `cmd.exe /Q`（或 `BRIDGE_SHELL`）常驻，`cd`/env 跨命令保留 |
| nonce 标记包装截取输出+退出码 | `echo __DSH_B_nonce__; <cmd>; echo __DSH_E_nonce%errorlevel%`，缓冲到 end 标记，正则取退出码 |
| 超时/异常自复位 | 命令超时或 `exit` 杀 shell 时自动重开干净会话，返回 partial 输出并标 `reset:true` |
| 交互程序 | 独立 `interactive` 会话：输出实时流 + `stdin` 喂输入（REPL/ssh） |
| 提示符污染处理 | cmd/pwsh 管道输入会带 `E:\path>` 提示符前缀，解析层用 `\r\n\r\n[^\r\n>]*>` 正则剥离 |

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| bridge.js 重写 | 保留 HTTP `status`/`exec` 兼容；新增 `/ws` WebSocket + `open/exec/interactive/stdin/reset/close/ping` 消息 |
| 会话模型 | 每个连接独立 exec 会话（标记包装、有界缓冲、超时自复位）+ 可多个 interactive 会话 |
| CmdView 升级 | `connect` 自动开持久会话；`local`/`!` 走 WS exec（流式 + 结果替换渲染）；新增 `interactive`/`raw`/`live`/`session` 命令；状态点区分「已连接/待连接/离线」；挂载时若存有 Token 自动重连 |

### 踩坑记录

#### 1. cmd/pwsh 管道输入带提示符+回显

- **现象**：`spawn('cmd.exe')` 后写 stdin，输出里每条命令都带 `E:\path>` 前缀且回显命令文字，标记截取的 output 被污染（`\nC:\...>echo hello world\nhello world\n`）
- **尝试**：`cmd /Q` 只去掉命令回显文字，仍留 `PROMPT>` 前缀；PowerShell `-NoLogo` 同样回显
- **解决**：DSH 用 node-pty（真终端）规避；纯 Node 下在解析层剥离提示符——`/Q` 启动 + `seg.replace(/\r\n\r\n[^\r\n>]*>/g,'\r\n')` 再滤空行，得到干净输出
- **代价**：无法获得真 PTY 的彩色/光标控制；交互程序走独立 live 会话（原始流直出，天然保留提示符观感）

#### 2. `exit` 杀常驻 shell

- **现象**：用户执行 `exit`，cmd 实例退出，pending 命令永远等不到 end 标记 → 超时
- **解决**：child `close` 时若在 pending，立即以 close 的 exitCode 结算结果并 `reset:true` 重开干净 shell；后续 exec 自动在新 shell 上跑（DSH 同款「reset 后从工作区重来」语义）

#### 3. 测试客户端没挂第二个连接的 handler

- **现象**：bad-token 测试超时
- **解决**：`ws2.onmessage` 未赋值，auth-fail 消息没人接；非服务端问题，补 handler 即可

### 架构要点

- 一次连接 = 一个持久 exec 会话 + N 个 interactive 会话；连接关闭自动清理
- 输出路径：执行期流式 `output`（前端 dim 渲染显示进度）→ 结束时按起点 splice 替换为干净 `result.output` + `[退出码]`
- 退出码非 0 显示为 err 红；`chcp 65001` 防中文乱码；`BRIDGE_SHELL=powershell` 可换 shell（标记包装会切到 `$?` 分支）
- 待办：真 PTY（node-pty/ConPTY）以获得完整终端能力；token 固定写死可改动态配对

---

## 2026-08-20 视频收藏夹式多集合 + 分区

### 背景

用户反馈视频模块不够好用，要求对标 B 站：自定义分区（分类）+ 手动挑选集合 + 创建集合。确认需求为「收藏夹式多对多集合 + 单分区自定义分区列表 + 仅展示层改进（数据由代理在仓库维护）」。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 单一数据源 | 新增 `src/videos/video-meta.json`：`categories`（分区列表）+ `collections`（id/name/description/sort），空集合/排序/描述都由此驱动 |
| 数据迁移 | 5 个视频 md 由 `collection: "名称"` → `collections: ["id"]`（blender×2 / mdn×2 / juc×1） |
| utils/videos.js | `getCategories()`/`getCollections()`（按 sort 排序）；`resolveCollections` 按 id 解析、对旧 `collection` 名称先按名称匹配清单再生成临时集合（上传/下载流程仍写旧字段） |
| 视频页展示 | 分区 chips 来自清单（含空分区 + 清单外新分类兜底）；集合分组多对多（一视频可属多集合），「全部」显示空集合占位、「指定分区」隐藏空集合、未入集合归「未加入集合」；集合带描述 |
| 样式 | `.video-col-desc`（集合描述）、`.video-col-empty`（空集合虚线占位），全走 tokens |

### 踩坑记录

#### 1. 待发布本地条目导致页面崩溃

- **现象**：本地待发布条目（`getLocalUploads`）没有 `collections` 字段，`v.collections.some(...)` 抛 TypeError，整个视频页渲染失败
- **解决**：`allVideos` computed 对 local 条目归一化 `collections: []`、`category: u.category || '未分类'`，分组处再加 `(v.collections || [])` 防御

#### 2. 旧 `collection` 字段兼容名存实亡

- **现象**：`resolveCollections` 的 legacy 回退生成 `{id: legacy}` 伪集合，但视图只遍历清单集合 id → 新上传的带集合名视频落进「未加入集合」，展示层回归
- **解决**：回退时先按 `name → 清单集合` 匹配，命中则用真实集合对象；未命中才生成临时集合

### 架构要点

- 数据流：`video-meta.json`（分区/集合定义） + 视频 md `collections: ["id"]`（归属） → `utils/videos.js` 解析 → `VideosView.vue` 分组渲染
- 集合多对多：视频按 `collections` 数组进入各集合分组，`inAny` 集合去重避免落入「未加入集合」
- 待办：如后续要网页端「创建集合/手动挑选」，可在管理模式下做清单文件（video-meta.json + md frontmatter）的写入 UI（复用 githubFiles 密码+Token）

---

## 2026-08-20 音乐 QQ 音乐对标升级

### 背景

用户要求音乐模块对标 QQ 音乐。确认 8 项能力全做：唱片播放页布局、系统媒体控制（Media Session）、歌单管理（多歌单/排序/删除）、最近播放历史、睡眠定时器、上传补封面歌词、红心收藏、倍速。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 个性化存储 | 新增 `src/stores/musicPrefs.js`：收藏（`music-favorites`）、歌单（`music-playlists`）、最近播放（`music-history`）全在 localStorage，deep watch 持久化，不写仓库 |
| store 扩展 | `music.js` 增 `rate`（倍速，持久化 music-prefs + 同步 playbackRate）、`sleepEnd/sleepMin` 睡眠定时（到点暂停、刷新恢复）、Media Session（metadata + play/pause/prev/next/seekto）、`playTracks(list,i)` 播放即建队、`playIndex/playTracks` 写历史 |
| 唱片播放页 | `MusicPlayer.vue` 封面改旋转唱片（`.mp-disc` 深色唱片 + 圆形封面 + 主轴，播放转/暂停停），歌词/列表布局保留 |
| 红心 | 播放器 + 迷你条 ♥/♡ 切换，「♥ 收藏」视图 |
| 歌单 | 播放器「+歌单」弹窗（勾选加入/移出 + 内联新建）；音乐页视图条（全部/收藏/最近/各歌单/新建）+ 歌单管理面板（改名/删除/▲▼排序/移除） |
| 最近播放 | 播放即入历史（最新在前、去重、限 100），「最近播放」视图 |
| 倍速 | 0.5~2× 弹窗选择，`music.rate` 全局生效并持久化 |
| 睡眠定时 | 15/30/60/90 分钟 + 关闭，按钮显示实时剩余，到点暂停，`music-sleep-end` 刷新恢复 |
| 上传补附件 | `MediaManager` kind=music 新增封面/歌词 .lrc/逐字 .yrc 可选文件，上传到 `covers/` 与 `music/`，md 写 `cover`/`lyrics`/`yrc`；附件大小校验 |
| 样式 | `.mp-disc/.mp-fav/.mp-pop*/.mp-viewbar/.pl-manage/.mp-tools/.mini-fav` + `mp-spin` 动画，全走 tokens（唱片底固定色 `#1a1816`，同 `.video video background:#000` 先例） |

### 踩坑记录

#### 1. 睡眠倒计时冻结（验收不通过，返工）

- **现象**：`sleepRemain = computed(() => sleepEnd ? Math.ceil((sleepEnd - Date.now())/1000) : 0)` 只依赖响应式 `sleepEnd`，`Date.now()` 非响应式 → 按钮上的剩余时间从设置起冻结，直到到点才消失
- **解决**：加每秒刷新的响应式 `nowTs = ref(Date.now())`（ticker 里 `nowTs.value = Date.now()`），`sleepRemain` 依赖它，倒计时实时递减

#### 2. 播放与视图解耦：setTracks 不能随视图覆写全局队列

- **现象**：旧版 MusicPlayer 在 `props.tracks` 变化时 `setTracks` 覆写全局队列，切歌单视图会让正在播的歌曲 index 失效/错位
- **解决**：删除 `setTracks` 依赖，改为点击歌曲调 `playTracks(props.tracks, i)`「播放即建队」；视图只是展示源，切换不打断播放；列表高亮改按 slug 匹配而非 index

#### 3. 睡眠弹窗高亮误触发

- **现象**：`sleepRemain <= m*60` 判断在剩余时间低于选项时多选同时点亮
- **解决**：记录 `music.sleepMin` 所选分钟数做精确匹配

### 架构要点

- 数据流：`musicPrefs.js`（收藏/歌单/历史 localStorage） + `music.js`（播放态/倍速/睡眠/Media Session） → MusicPlayer/MiniPlayer/MusicView 消费
- 队列解耦：全局 `music.tracks` 由 App.vue `getAllMusic()` 种子，播放页视图仅决定「点了播哪一组」；跨页播放、切视图不中断
- 待办：桌面歌词/歌词全屏、封面旋转速度跟随 BPM、Media Session 锁屏歌词 art 类型按扩展名派生

---

## 2026-08-23 音乐播放器酷狗风格改版

### 背景

用户要求音乐播放界面抄袭酷狗音乐，歌曲的布局逻辑也可以改。对照酷狗 PC 端「正在播放」页与歌曲列表：头部唱片+信息+主控制、进度条两端时间、歌词/播放列表 Tab 切换、表格式曲目列表（序号/歌曲/歌手/时长，当前行跳动条，hover 收藏）。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 头部重构 | 原三栏 grid（唱片/歌词/列表）改为 `.mp-head` 单行：120px 旋转唱片（点击播放/暂停）+ 歌名/歌手 + 上一首/播放/下一首/播放模式 + 右侧 200px 频谱；≤900px 隐藏频谱，≤720px 唱片缩至 92px |
| 进度条 | `.mp-progress-row`：当前时间/总时长分居进度条两端（酷狗样式），进度条 flex 撑满 |
| Tab 面板 | `.mp-panel` + `.mp-tabs`：「歌词 / 播放列表(N)」切换（衬线字、accent 下划线激活态），默认停在播放列表；歌词面板保留歌词滚动高亮、卡拉OK 逐字、±0.1/0.5s 校准条 |
| 歌曲列表改版 | 酷狗式表格：`#` 序号（当前行换成三柱跳动动画 `.mp-eq`）、歌曲名（当前播放 accent 高亮 + 待发布角标）、歌手、时长右对齐；hover 行浮现 ♥ 收藏（点击不触发播放，`@click.stop`） |
| 时长列 | 懒探测：`Audio preload=metadata` 逐首读时长填 `.mp-list-panel`（排除当前曲，避免重复请求；当前曲时长直接来自 `music.duration`），探测失败记 `probedSlugs` 不再重试，组件卸载时中断队列 |
| 底部工具条 | `.mp-bar`：音量滑块（hover title 显示百分比）+ 右侧倍速/睡眠定时弹窗，与头部主控制分离 |

### 踩坑记录

#### 1. npm 输出重定向在 PowerShell 下报错

- **现象**：`npm run build 2>&1 | Select-Object` 报「无法在管道中处理的命令」（npm 是 .cmd shim）
- **解决**：改用 `npm.cmd run build`，用 `$?` 判断成功即可，不接管道

### 架构要点

- 布局层级：`.mp-head`（唱片/信息/控制/频谱）→ `.mp-progress-row`（时间+进度）→ `.mp-panel`（歌词/播放列表 Tab）→ `.mp-bar`（音量/倍速/睡眠）
- 时长探测与播放引擎完全独立：探测用临时 `new Audio()`，绝不触碰全局 `audioEl`；`durations` 为组件内 reactive，切页重建
- 待办：行内时长可持久化缓存（localStorage 按 slug）避免重复探测；列表排序/分组

---

## 2026-08-23 全站模块重构 — 统一骨架 · 模块提质

### 背景

用户要求「自由发挥，各个模块都要重构」。摸底 13 个视图后发现：每个页面手写 hero/分组标题/空状态/删除确认条，样式散落重复（year-label/month-label/timeline-day 三个近同类、home-empty/timeline-empty 等）。定调「统一骨架 + 模块提质」：抽共享组件消除重复，再对重点模块做实质升级。

### 功能迭代清单

| 模块 | 改动 |
|---|---|
| 新增 `PageHero.vue` | 统一页面头部：title/sub/stats（`{n,label}` 数组，渲染「N 标签」统计行）/actions 插槽，复用既有 hero/hero-stats/hero-actions/hero-btn 类 |
| 新增 `GroupLabel.vue` | 统一分组标题（年份/月份/日期/视频合集），label + count + countUnit（如「3 集」），`.group-label` 替代 `.year-label/.month-label/.timeline-day` 三套重复样式 |
| 新增 `EmptyState.vue` | 统一空状态（text/sub/默认插槽放操作按钮），替代各处内联 `hero-sub` + `padding: 96px 0` |
| 新增 `DeleteBar.vue` | 统一密码确认条：`title/sub/msg/busy/confirm-label` + `v-model:pwd` + confirm/cancel 事件；Notes/Videos/Music 三处接入，内置「一键填充」 |
| 首页 | PageHero 统计（文章/随笔/标签数）；文章卡片标签可点击 → 筛选（`@click.prevent.stop`，hover 变色）；空状态区分「无文章/无结果」 |
| 随笔 | DeleteBar/GroupLabel（月份带计数）/EmptyState 接入；note-card hover 上浮 |
| 标签页 | 标签云 active 实心态 + 计数变色；选中标签文章列表 hover 箭头浮现（`.tag-post-arrow`） |
| 时间线 | commit 类型徽章 `.tl-kind`：`detectKind` 解析 feat:/fix:/docs:/chore:/ci:/refactor:/perf:/style: 前缀（大小写不敏感，无前缀回退 `other`），feat 描边 / fix 实心 / docs 淡底，仅用 accent 家族无彩色；加载/错误态换 EmptyState；顺手删除旧版重复的 timeline-kind/timeline-link 死 CSS |
| 关于页 | PageHero 接入；about-card/stat-cell hover 上浮 + 边框 accent |
| 工作台/命令行/两个编辑器 | hero 全部换 PageHero |
| 音乐/视频 | PageHero + DeleteBar（补 `busy` 防并发删除）；视频合集标题换 GroupLabel（count-unit=集）；空分类态 EmptyState |
| 文章页 | 「文章不存在」换 EmptyState |

### 踩坑记录

#### 1. 时间线旧 localStorage 缓存缺 `kind` 字段 → 白屏（reviewer 抓到）

- **现象**：`loadCache()` 命中改动前写入的缓存（无 `kind`），模板 `c.kind[1]` 抛 `TypeError`，时间线整页渲染失败
- **解决**：`commits.value = cached.map(toView)` —— toView 幂等，顺带补齐 kind

#### 2. PageHero 按钮双重 margin

- **现象**：首页「写文章」原本直接挂 hero 下（hero-btn margin-top 24px），套进 hero-actions 后双重 margin 下移约 24px
- **解决**：`.hero-actions .hero-btn { margin-top: 0 }`，hero-actions 自身 24px 间距兜底

#### 3. 博客-reviewer 审查捕获 4 项建议

- DeleteBar 未传 busy（Notes 传了）→ 音乐/视频补 `deleteBusy` + finally 复位，防并发删除
- detectKind 仅匹配小写 → 加 `i` 标志 + 键转小写
- `.tag-post-title` 死类 → 删除
- GroupLabel 计数无空格 → countUnit 前补空格（「3 集」）

### 架构要点

- 页面骨架统一：`PageHero → 筛选/工具区 → GroupLabel 分组 → EmptyState 兜底`，新增页面直接拼组件
- 组件职责单一：PageHero（头部）/GroupLabel（分组标题）/EmptyState（空态）/DeleteBar（密码确认），全部只依赖既有 tokens
- 死 CSS 清理：year-label/month-label/timeline-day/timeline-kind/timeline-link/timeline-empty/home-empty/trash-count/video-col-head/title/count 全部移除，grep 零残留
- 待办：SearchModal 结果分组与热键可再升级；CmdView 输出高亮

---

## 2026-08-23 特效页新增写轮眼（永恒万花筒）

### 背景

用户在特效陈列室加一个佐助的永恒万花筒写轮眼。特效页已用「环形轨道 + 中心舞台」陈列 18 个效果，新增一个纯 CSS/SVG 的写轮眼效果，注册进轨道即可。

### 功能迭代清单

| 改动 | 说明 |
|---|---|
| 新增 `SharinganEffect.vue` | SVG 绘制佐助永恒万花筒标准造型：红底六瓣花（petal 顶点半径 ~44）+ 三片黑色同向回旋刃（`rotate` 120° 复用同一轮廓，扫掠形成万花筒动势）+ 中心红环（红底黑描边）；纹样整体缓慢旋转 6s/圈，可「静止/转动」切换 |
| 纹样结构 | 虹膜固定不转，`<g class="sharingan-pattern">`（六瓣红花底 + 三刃 + 中心红环）整体 `sharingan-spin` 旋转；外围 `.sharingan-glow` 红色光晕呼吸脉动（`requestAnimationFrame` 驱动 opacity，正弦波动） |
| 注册 | `WorkbenchEffectsView.vue` import + `effectsList` 追加 `kind:'css'` |
| 样式 | 加在 `design.css` 特效段（与既有 firework/three 效果类同区）；红/深红经 `.sharingan-wrap` 局部变量注入，`:root[data-theme="dark"]` 下提亮保证深色底可辨；纹样黑用固定 `#16120F`（躺在红色虹膜上，两主题都清晰） |

### 踩坑记录

#### 1. 纹样黑色用 `var(--text)` 会随主题变浅

- **现象**：暗色下 `--text` 为 `#EDE6DB`（米白），黑瞳/刀刃会变白，失去「黑纹红底」写轮眼质感
- **解决**：纹样改固定 `--sharingan-black: #16120F`；因为纹样绘制在红色虹膜上，红底提供了两主题都成立的对比，不依赖页面 `--text`

#### 2. 刀刃几何要能认出是写轮眼

- 首版误用「六片 pinwheel」，与佐助永恒万花筒实际造型不符；按贴图重做为「红底六瓣花 + 三片黑回旋刃 + 中心红环」：黑色矩形刃从中心扫向半径 ~48（超出花尖 ~44 约 4px，形成回旋突出感），`rotate(0/120/240)` 三份同向，红花瓣每 60° 一份、让被刃覆道的花瓣被盖住而隔瓣露出，构成红黑相间的六尖花形
- 花瓣用双二次贝塞尔（`M50 50 Q34 30 50 6 Q66 30 50 50 Z`）形成尖端朝外的叶片；加 1.6px 黑描边形成「环链」视觉

### 架构要点

- 与其它效果一致：不在组件内写 `<style>`，样式进 `design.css` 特效段；组件仅含模板与轻量 `raf` 光晕驱动
- 颜色走局部变量 + 暗色覆盖，红色为效果专用色，不沾设计 tokens（tokens 仅 `--text` 等灰暖系，写轮眼必须红）
- 待办：可加切换普通万花筒（三刃）/勾玉写轮眼纹样；刀刃数量按角色预设

---

## 2026-09-03 引入 Spec Kit 规格驱动开发

### 背景

仓库此前只有 `/devloop` 循环编码流程（开发 → 构建 → 审查 → 验收），无规格层。本次引入 GitHub 官方 Spec Kit（`github/spec-kit`）的 specify-cli，给较大功能需求补上「规格 → 计划 → 任务」的前置流程。

### 功能迭代清单

- 用 Python（`pip`）安装 `specify-cli` 1.0.4（PyPI 版；本机无 uv/pipx）
- `specify init --here --force --non-interactive --integration opencode` 初始化：
  - `.opencode/commands/speckit.*.md` 共 10 个斜杠命令（constitution/specify/plan/tasks/taskstoissues/implement/converge/clarify/analyze/checklist）
  - `.specify/`：templates（spec/plan/tasks/checklist/constitution 模板）、scripts/powershell（ps 脚本类型，Windows 默认）、workflows（speckit）、memory（宪法）
- 按博客 AGENTS.md 提炼并填入博客版宪法 `.specify/memory/constitution.md`：设计系统锁定、共享骨架组件优先、内容模块约定、构建发布红线、安全与凭据 5 条 + 开发流程段
- AGENTS.md 新增「Spec Kit」一节，说明命令流程、`$ARGUMENTS` 传参、与 devloop 的分工

### 踩坑记录

#### 1. PowerShell 的 curl/npm 别名坑

- **现象**：`curl` 被解析成 `Invoke-WebRequest` 报参数错误；`npm run build` 报「无法在管道中处理文档」
- **解决**：API 请求用 `curl.exe`；npm 用 `npm.cmd`

#### 2. Windows 无 uv/pipx

- 官方推荐 `uv tool install specify-cli`，本机没装 uv；改用 `python -m pip install specify-cli`，效果一致（PyPI 包名 `specify-cli`）
- 注意：源码 main 分支是 dev 版（1.0.5.dev0），PyPI 是稳定版 1.0.4，以 PyPI 为准

#### 3. init 进非空目录

- 博客仓库非空，`specify init --here` 需要 `--force` 跳过确认；`--non-interactive` 防止 picker 卡住
- 初始化是 merge 语义，只新增 `.opencode/commands/` 与 `.specify/`，未改动 AGENTS.md、vite.config.js 等既有文件

### 架构要点

- opencode 集成：markdown 命令、`$ARGUMENTS` 传参，安装到 `.opencode/commands/`（与既有 `.opencode/agent/` 团队目录共存）
- 宪法是命令的约束来源：`/speckit.plan` 会按宪法校验合规，因此宪法内容对齐 AGENTS.md 既有约定
- 分工：小改动继续 `/devloop`；大功能先用 `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` 产出 `specs/<分支>/` 三件套，再交 blog-dev 实现
- 待办：`/speckit.constitution` 命令实际执行时与手填宪法的一致性核验；是否需要 `.specify/` 进 .gitignore（目前整目录提交，便于跨机器复用）

---

## 2026-09-03 全站体验优化：性能 · SEO · UI · 阅读 · 功能

### 背景

用户提出按一线大厂产品体验六维迭代（性能 / UI / 交互 / 阅读 / 功能 / SEO），要求最小改动、保留技术栈与构建流程。本次为第一轮全量优化。

### 功能迭代清单

| 维度 | 改动 |
|---|---|
| 性能 | App.vue 六个全局组件全部 `defineAsyncComponent`（BgImage/ScrollProgress/BackToTop/SearchModal/MiniPlayer/GlobalParticleTrail），各自独立 chunk；路由切换加 `<Suspense>` 骨架屏 |
| SEO | index.html 补 description/keywords/author/OG/Twitter/canonical/theme-color（随主题切换）；新增 `public/favicon.svg`、`robots.txt`、`sitemap.xml`；router.js afterEach 动态 `document.title`（文章页取真实标题） |
| 阅读 | markdown.js 接入 highlight.js 11（core + 10 语言，仅懒加载路由 chunk 34.96KB gzip）；图片 `loading="lazy" decoding="async"`；外链自动新窗口；PostView 加分享（Web Share API + 复制回退）、正文图点击大图预览（lightbox）、≤1080px 目录折叠按钮；锚点 `scroll-margin-top: 88px` 避让 sticky 导航 |
| 功能 | SearchModal 关键词 `<mark>` 高亮 + 标题命中优先排序 + 文章摘要；TagsView hero 显示文章总数、无标签空态；GiscusComments 组件挂载文章页（specific mapping + term=slug 适配 hash 路由） |
| UI/交互 | design.css 追加：骨架屏、hljs 亮/暗 token 配色、lightbox、点击反馈 scale(0.97)、prose img hover、表格窄屏横向滚动、600px 以下标题/留白缩放 |

### 踩坑记录

#### 1. Giscus 的 hash 路由映射

- **现象**：博客用 hash 路由，giscus 默认 `pathname` mapping 会把所有文章映射到同一条 discussion
- **解决**：`data-mapping="specific"` + `data-term=slug`；slug 变化时向 iframe `postMessage({ giscus: { setConfig: { term } } })`
- **待办**：仓库 `has_discussions=false`，category-id 拿不到，组件暂不渲染；用户启用 Discussions 后 API 查询补 `CATEGORY_ID` 即生效

#### 2. highlight.js 不能进首屏

- hljs core + 语言注册 ~70KB，若在 `main.js` 静态 import 会拖慢首屏；markdown.js 只在懒加载路由（PostView/NotesView/VideosView/编辑器）使用，跟随路由 chunk 自动拆分，首屏零成本
- 语言注册做别名（js→javascript、sh→shell、vue→xml），避免文章里写 `js` 无高亮

#### 3. 骨架屏要"无渐变"

- 设计系统禁渐变，常见的 shimmer 扫光骨架屏不符合；改用纯色块 `opacity` 呼吸动画（`skeleton-pulse`），语义等价、样式合规

#### 4. Suspense fallback 只在首次下载 chunk 时出现

- 本地 preview 下路由 chunk 秒开，骨架屏几乎不可见；真实弱网/GitHub Pages 下首次进入各页面会有体验收益

#### 5. PowerShell 追加 UTF-8 无 BOM

- `Add-Content -Encoding UTF8` 在 PS 5.1 追加到已存在文件时不写 BOM（验证文件头 `2F 2A 20`），CSS 追加安全

### 架构要点

- 首屏 index chunk 145KB（gzip 55.9KB），未引入新依赖进首屏；three.js 特效页仍独立 546KB 懒加载
- 代码高亮 token 配色走暖色系（keyword 深棕 / string 暖绿 / number 橙 / title 蓝灰），亮暗两套 `:root[data-theme]` 覆盖，与设计 tokens 风格统一
- 待办：Giscus 启用后填 CATEGORY_ID；sitemap 每新增文章/笔记需手写同步

---

## 2026-09-03 蓝白主题重制与灵动按钮

### 背景

用户反馈原暖棕配色（米白 `#FBF9F6` + 棕 `#B68D73`）不好看，要求整体蓝白；随后要求按钮去掉传统描边风格，改为灵动效果；并确认布局保持「上导航 + 下背景与内容」。

### 功能迭代清单

- **tokens 重制**（design.css `:root` / `:root[data-theme="dark"]`）：
  - 亮：`--bg:#FCFDFF; --text:#1B2430; --text-secondary:#5A6B82; --accent:#3B6FE0; --divider:#E4E9F2`
  - 暗：`--bg:#0F172A; --text:#E6EDF7; --text-secondary:#94A3B8; --accent:#7AA2FF; --divider:#1E293B`
  - 派生 tokens（bg-soft/overlay/search、hover-bg、code/pre-bg、accent-soft/strong/selection）全部按新色换算；阴影改蓝黑基调
- **硬编码清理**：`.prose a` 下划线、`.fx-kind` 标签、`fx-dot-pulse`/`flash-note` 动画、`.draft-badge`、`.mp-disc` 唱片底（`#1B2430`）；canvas 特效组件（Fireworks/CharRain/Snowfall/Ripple/粒子拖尾/贪吃蛇/播放器）的 fallback 色批量替换，运行时仍优先读 CSS 变量；`threeTheme.js` fallback 同步
- **hljs 色板**：亮色定制蓝系（keyword 主蓝 `#3B6FE0`、string 绿 `#1A7F37`、number 琥珀、title 深蓝、attr 紫），暗色 GitHub Dark 风（`#79C0FF` 蓝系 + 淡紫 `#D2A8FF`）
- **灵动按钮体系**（新 token `--accent-glow`）：
  - `.btn`：`::before` 蓝色从左滑入填充（scaleX + `cubic-bezier(0.22,1,0.36,1)`），hover 白字 + 上浮 2px + 蓝色光晕阴影，active 弹簧回弹挤压（`cubic-bezier(0.34,1.56,0.64,1)`）
  - `.btn-primary` hover 改为浮起+光晕（弃用 opacity 变淡）；`.btn-danger` 保持红 + 红色光晕
  - `.chip` / `.tag-cloud-link`：hover 上浮 + accent-soft 底 + 光晕
  - 工具按钮（copy-link/edit-link/readsize/toc-toggle/code-copy）：hover 浅蓝填充 + 微上浮
  - `.nav-search`：hover 蓝底白字 + scale(1.06) 弹跳；`.toc-link` hover 左侧滑入 4px
- **布局层次**：`--bg-soft` 提到 0.9/0.92（导航更实、不被背景干扰），`--bg-tint-layer` 0.78→0.72（背景图更清晰）；背景 fixed 全屏 z-index -2/-1，导航 sticky 顶部，顺序不变

### 踩坑记录

#### 1. `.btn-primary`/`.btn-danger` 与 ::before 填充冲突

- 填充式按钮本身已有 accent 底色，::before 同色滑入无视觉变化但会盖住 danger 红
- **解决**：`.btn-danger::before` 单独指定 `#B71C1C`，与按钮同色

#### 2. 动画曲线选择

- 回弹感需要 overshoot 曲线：`cubic-bezier(0.34, 1.56, 0.64, 1)`（transform 专用）；填充滑入用缓出 `cubic-bezier(0.22, 1, 0.36, 1)`；颜色过渡保留原 `--transition`。避免所有属性共用 overshoot 造成抖动

#### 3. canvas 特效 fallback 色是字符串比对

- FireworksEffect 的 `COLORS` 数组既是色板又是 `rk.color === '#xxx'` 比对键，批量替换时需一并替换比对值（行 52），否则粒子颜色逻辑失效

### 架构要点

- 主题切换零成本：全部组件走 `var()`，只改 tokens 一处即全站生效
- 新增 `--accent-glow` token（亮 `rgba(59,111,224,0.28)` / 暗 `rgba(122,162,255,0.3)`）供按钮光晕统一使用
- 布局分层：背景（fixed -2/-1）→ 导航（sticky 64px，bg-soft 0.9+blur）→ 内容（container 900px）

---
