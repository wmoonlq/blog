# 开发日记

本目录记录博客的开发历程、功能迭代与踩坑记录。每轮开发结束由 AI 代理更新。

## 索引

- [2026-08-16 全站功能大升级](#2026-08-16-全站功能大升级)
- [2026-08-16 搭建 AI 代理团队与循环编码验收](#2026-08-16-搭建-ai-代理团队与循环编码验收)
- [2026-08-17 时间线 403 根治与 CR 修复](#2026-08-17-时间线-403-根治与-cr-修复)

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
