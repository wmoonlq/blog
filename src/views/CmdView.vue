<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { getAllMusic } from '../utils/music'
import { getAllVideos } from '../utils/videos'
import { playIndex, currentTrack } from '../stores/music'

const router = useRouter()

const lines = ref([])
const input = ref('')
const inputEl = ref(null)
const bodyEl = ref(null)
const history = ref([])
const histIdx = ref(-1)

const PROMPT = 'C:\\blog>'

const BRIDGE_HOST = '127.0.0.1'
const BRIDGE_PORT = 9876
const BRIDGE_URL = `http://${BRIDGE_HOST}:${BRIDGE_PORT}`
const BRIDGE_WS = `ws://${BRIDGE_HOST}:${BRIDGE_PORT}/ws`
const BRIDGE_TOKEN_KEY = 'bridge-token'
const bridgeToken = ref(localStorage.getItem(BRIDGE_TOKEN_KEY) || '')
const bridgeOnline = ref(false) // HTTP 存活（状态点）
const bridgeConnected = ref(false) // WS 已连接
const sessionId = ref('') // 持久 exec 会话 id
const sessionShell = ref('')
const liveSessions = new Map() // live 会话 id -> cmd
const bridgeCwd = ref('')
let wsRef = null
let bridgeTimer = null
let execStartLine = -1 // 当前 exec 输出起点（用于结果替换）

const BANNER = [
  '博客命令行 v1.0 — wmoonlq@blog',
  '输入 help 查看可用命令 · cls 清屏 · 方向键 ↑↓ 翻历史 · 点击窗口获得焦点',
  ''
]

function push(text, cls = '') {
  lines.value.push({ text, cls })
}

function pushMulti(texts, cls = '') {
  for (const t of texts) push(t, cls)
}

function scrollDown() {
  nextTick(() => {
    const el = bodyEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(lines, scrollDown, { deep: true })

function focusInput() {
  inputEl.value && inputEl.value.focus()
}

/* ============ 本机桥接（WebSocket + 持久会话） ============ */

async function pingBridge() {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 1500)
    const res = await fetch(`${BRIDGE_URL}/api/status`, { signal: ctrl.signal })
    clearTimeout(t)
    bridgeOnline.value = res.ok
    return res.ok
  } catch {
    bridgeOnline.value = false
    return false
  }
}

function saveBridgeToken() {
  localStorage.setItem(BRIDGE_TOKEN_KEY, bridgeToken.value)
}

function wsSend(msg) {
  if (wsRef && wsRef.readyState === WebSocket.OPEN) wsRef.send(JSON.stringify(msg))
}

function handleWsMessage(msg) {
  switch (msg.type) {
    case 'auth-ok':
      bridgeConnected.value = true
      push(`已连接本机（${msg.shell}，端口 ${msg.port}），正在打开持久会话…`, 'ok')
      wsSend({ type: 'open' })
      break
    case 'auth-fail':
      push(`连接失败：${msg.message}`, 'err')
      closeWs()
      break
    case 'session':
      if (msg.interactive) {
        liveSessions.set(msg.id, msg.cmd || '(shell)')
        push(`交互会话已启动（${msg.id}）：${msg.cmd || '(shell)'}`)
        push('  用 raw <文本> 输入，live close 结束', 'dim')
      } else if (msg.reset) {
        push('会话已复位（上一个命令异常退出），环境已重置。', 'dim')
      } else {
        sessionId.value = msg.id
        sessionShell.value = msg.shell || ''
        push(`持久会话就绪（${msg.shell}）。local <命令> 执行，cd 跨命令保留。`, 'ok')
      }
      push('')
      break
    case 'output': {
      if (msg.id === sessionId.value && execStartLine >= 0) {
        const text = stripPrompt(msg.text)
        if (text) push(text, 'dim')
        scrollDown()
      } else if (liveSessions.has(msg.id)) {
        const text = msg.text.replace(/\r\n/g, '\n').replace(/\r/g, '').replace(/\n$/, '')
        if (text) push(text)
        scrollDown()
      }
      break
    }
    case 'result': {
      if (execStartLine >= 0 && lines.value.length > execStartLine) {
        lines.value.splice(execStartLine, lines.value.length - execStartLine)
      }
      execStartLine = -1
      if (msg.error) push(`错误：${msg.error}`, 'err')
      if (msg.output) pushMulti(msg.output.split('\n'))
      if (msg.reset) push('（命令未正常返回，会话已自动复位）', 'dim')
      push(msg.exitCode === null ? '[退出码] 已终止' : `[退出码] ${msg.exitCode}`, msg.exitCode ? 'err' : 'dim')
      push('')
      break
    }
    case 'closed':
      if (liveSessions.delete(msg.id)) push(`交互会话已结束（${msg.id}）`, 'dim')
      else if (msg.id === sessionId.value) {
        sessionId.value = ''
        push('持久会话已关闭。', 'dim')
      }
      push('')
      break
    case 'error':
      if (msg.id === sessionId.value) execStartLine = -1
      push(`本机错误：${msg.message}`, 'err')
      push('')
      break
    case 'pong':
      break
    default:
      break
  }
}

function stripPrompt(text) {
  return text
    .replace(/\r\n\r\n[^\r\n>]*>/g, '\n')
    .replace(/\r\n[^\r\n>]*>/g, '\n')
    .replace(/\r/g, '')
}

function closeWs() {
  bridgeConnected.value = false
  sessionId.value = ''
  liveSessions.clear()
  execStartLine = -1
  if (wsRef) {
    try {
      wsRef.close()
    } catch {
      /* ignore */
    }
    wsRef = null
  }
}

async function connectBridge(token) {
  const t = (token || '').trim()
  if (!t) {
    push('用法: connect <token>，Token 在本机启动 local-bridge/bridge.js 时显示', 'err')
    push('')
    return
  }
  if (bridgeConnected.value) {
    push('已在连接中。可先 disconnect。', 'err')
    push('')
    return
  }
  bridgeToken.value = t
  saveBridgeToken()
  push(`正在连接本机 ${BRIDGE_WS} …`)
  const ok = await pingBridge()
  if (!ok) {
    push('连接失败：桥接未启动或网络不通。', 'err')
    push('  1. 本机先运行：npm run bridge（或 node local-bridge/bridge.js）', 'dim')
    push('  2. 浏览器会放行 127.0.0.1 回环地址，GitHub Pages 部署后仍可用', 'dim')
    push('')
    return
  }
  try {
    const ws = new WebSocket(BRIDGE_WS)
    wsRef = ws
    ws.onopen = () => wsSend({ type: 'auth', token: bridgeToken.value })
    ws.onmessage = (e) => {
      try {
        handleWsMessage(JSON.parse(e.data))
      } catch {
        /* ignore */
      }
    }
    ws.onclose = () => {
      if (bridgeConnected.value) push('本机连接已断开。', 'dim')
      closeWs()
      push('')
    }
    ws.onerror = () => {
      /* 错误由 onclose 统一处理 */
    }
  } catch (e) {
    push(`WebSocket 连接失败：${e.message}`, 'err')
    push('')
  }
}

function disconnectBridge() {
  if (!bridgeConnected.value) {
    bridgeToken.value = ''
    bridgeOnline.value = false
    localStorage.removeItem(BRIDGE_TOKEN_KEY)
    push('已清除本机 Token。')
  } else {
    push('已断开本机桥接。')
    closeWs()
  }
  push('')
}

async function runLocal(cmd) {
  if (!bridgeToken.value) {
    push('未连接本机。先输入 connect <token>（Token 在本机启动桥接时显示）', 'err')
    push('')
    return
  }
  if (!bridgeConnected.value) {
    push('桥接未连接。先输入 connect <token>', 'err')
    push('')
    return
  }
  if (!sessionId.value) {
    push('持久会话未就绪，等待自动打开…', 'dim')
    wsSend({ type: 'open' })
    push('')
    return
  }
  push(`[本机] $ ${cmd}`, 'accent')
  execStartLine = lines.value.length
  wsSend({ type: 'exec', id: sessionId.value, cmd })
}

function setCwd(p) {
  if (!bridgeConnected.value) {
    push('未连接本机。', 'err')
    push('')
    return
  }
  if (sessionId.value) {
    execStartLine = lines.value.length
    wsSend({ type: 'exec', id: sessionId.value, cmd: IS_WIN_CMD() ? `cd /d ${p}` : `cd ${p}` })
  } else {
    wsSend({ type: 'open' })
    bridgeCwd.value = p
    push('会话未就绪，已记录目录，待会话打开后生效', 'dim')
    push('')
  }
}

function IS_WIN_CMD() {
  return !sessionShell.value || /cmd/i.test(sessionShell.value)
}

function startInteractive(cmd) {
  if (!bridgeConnected.value) {
    push('未连接本机。', 'err')
    push('')
    return
  }
  wsSend({ type: 'interactive', cmd })
}

function sendStdin(data) {
  if (!bridgeConnected.value) {
    push('未连接本机。', 'err')
    push('')
    return
  }
  if (liveSessions.size) {
    const id = liveSessions.keys().next().value
    wsSend({ type: 'stdin', id, data: data.endsWith('\n') ? data : `${data}\n` })
  } else if (sessionId.value) {
    wsSend({ type: 'stdin', id: sessionId.value, data: `${data}\r\n` })
  } else {
    push('没有可输入的活动会话。', 'err')
    push('')
  }
}

function closeLive() {
  if (!liveSessions.size) {
    push('没有活动的交互会话。', 'err')
    push('')
    return
  }
  const id = liveSessions.keys().next().value
  wsSend({ type: 'close', id })
}

const sections = [
  ['home', '文章'],
  ['notes', '随笔'],
  ['videos', '视频'],
  ['music', '音乐'],
  ['tags', '标签'],
  ['timeline', '时间线'],
  ['workbench', '工作台'],
  ['effects', '特效'],
  ['about', '关于']
]

const HELP = [
  '可用命令：',
  '  help / ?        显示本帮助',
  '  whoami / about  关于站点与作者',
  '  date / time     当前日期与时间',
  '  echo <text>     回显文本',
  '  ls / dir        列出站点栏目',
  '  posts           列出文章',
  '  notes           列出随笔',
  '  music           列出音乐（编号配合 play）',
  '  videos          列出视频',
  '  play <n>        播放第 n 首音乐',
  '  goto <page>     跳转到栏目页',
  '  history         查看输入历史',
  '  clear / cls     清屏',
  '  exit            试图离开',
  '',
  '本机桥接（需先在本机启动 npm run bridge）：',
  '  bridge          检查桥接状态（HTTP + WebSocket + 会话）',
  '  connect <token> 连接本机并自动打开持久 shell',
  '  disconnect      断开本机桥接',
  '  local <命令>    在本机持久会话执行（也可用 ! 前缀，如 !dir）',
  '  cwd [路径]      查看/切换会话工作目录（cd 跨命令保留）',
  '  interactive <c> 启动交互程序（python/node/ssh 等）',
  '  raw <文本>      向活动会话输入一行',
  '  live            查看交互会话；live close 结束',
  '  session         查看持久会话；session reset/close 管理',
  ''
]

const EASTER = {
  ping: [
    '正在 Ping wmoonlq.github.io [博客服务器] 具有 32 字节的数据:',
    '  来自博客的回复: 字节=32 时间=1ms TTL=128',
    '  来自博客的回复: 字节=32 时间=1ms TTL=128',
    '  来自博客的回复: 字节=32 时间=1ms TTL=128',
    '  来自博客的回复: 字节=32 时间=1ms TTL=128',
    '',
    '  wmoonlq.github.io 的 Ping 统计信息:',
    '    数据包: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)',
    ''
  ],
  ipconfig: [
    'Windows IP 配置',
    '',
    '无线局域网适配器 WLAN:',
    '   连接特定的 DNS 后缀 . . . . . . . : blog.local',
    '   本地链接 IPv6 地址. . . . . . . . : fe80::blog::1',
    '   IPv4 地址 . . . . . . . . . . . . : 192.168.blog.1',
    '   默认网关. . . . . . . . . . . . . : 192.168.1.1',
    ''
  ],
  matrix: [
    'Wake up, Neo…',
    '你跟着白兔走了，现在你看到了这里。',
    ''
  ],
  sudo: [
    '该命令不存在，或你已拥有全部权限（此站无秘密可管理）。',
    ''
  ],
  exit: [
    '试图退出…',
    '无法退出。',
    '你已无处可逃。',
    ''
  ]
}

async function runCommand(cmd) {
  const raw = cmd.trim()
  const [head, ...rest] = raw.split(/\s+/)
  const name = head.toLowerCase()
  const arg = rest.join(' ')
  const args = rest

  push(`${PROMPT} ${raw}`)
  if (!raw) return

  switch (name) {
    case 'help':
    case '?':
      pushMulti(HELP)
      break
    case 'whoami':
    case 'about':
      pushMulti([
        'wmoonlq',
        '一个把日子过成博客的人。',
        '这里存放文章、随笔、音乐、视频与一些奇怪的小工具。',
        'GitHub: github.com/wmoonlq',
        ''
      ])
      break
    case 'date':
    case 'time':
      push(new Date().toString())
      push('')
      break
    case 'echo':
      push(arg || '(空)')
      push('')
      break
    case 'ls':
    case 'dir':
      pushMulti(
        sections.map(([n, label]) => `  ${n.padEnd(12)} ${label}`)
      )
      push('')
      break
    case 'posts': {
      const posts = getAllPosts()
      if (!posts.length) push('暂无文章')
      else pushMulti(posts.map((p) => `  ${p.date}  ${p.title}`))
      push('')
      break
    }
    case 'notes': {
      const notes = getAllNotes()
      if (!notes.length) push('暂无随笔')
      else pushMulti(notes.map((n) => `  ${n.date}  ${n.title || '(无题)'}`))
      push('')
      break
    }
    case 'music': {
      const tracks = getAllMusic()
      if (!tracks.length) push('暂无音乐')
      else
        pushMulti(
          tracks.map((t, i) => `  ${String(i + 1).padStart(2)}  ${t.title}  —  ${t.artist}`)
        )
      push('')
      break
    }
    case 'videos': {
      const videos = getAllVideos()
      if (!videos.length) push('暂无视频')
      else pushMulti(videos.map((v) => `  ${v.date}  ${v.title}`))
      push('')
      break
    }
    case 'play':
    case 'open': {
      const tracks = getAllMusic()
      const n = parseInt(args[0] || '', 10)
      if (!tracks.length) {
        push('暂无音乐')
      } else if (isNaN(n) || n < 1 || n > tracks.length) {
        push('用法: play <编号>，编号见 music 列表')
      } else {
        playIndex(n - 1)
        push(`正在播放：${tracks[n - 1].title} — ${tracks[n - 1].artist}`)
      }
      push('')
      break
    }
    case 'now': {
      const t = currentTrack.value
      push(t ? `当前播放：${t.title} — ${t.artist}` : '当前没有播放')
      push('')
      break
    }
    case 'goto': {
      const target = args[0] ? args[0].toLowerCase() : ''
      const found = sections.find(([n]) => n === target)
      if (found) {
        push(`正在跳转 → ${found[1]}…`)
        router.push({ name: target })
      } else {
        push(`未知栏目「${target}」，可用: ${sections.map(([n]) => n).join(' / ')}`)
        push('')
      }
      break
    }
    case 'history':
      if (!history.value.length) push('（暂无历史）')
      else pushMulti(history.value.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`))
      push('')
      break
    case 'clear':
    case 'cls':
      lines.value = []
      break
    case 'exit':
      pushMulti(EASTER.exit)
      break
    case 'ping':
    case 'ipconfig':
    case 'matrix':
    case 'sudo':
      pushMulti(EASTER[name])
      break
    case 'bridge':
    case 'status': {
      const ok = await pingBridge()
      if (!ok) {
        push(`本机桥接离线：${BRIDGE_URL} 未响应。本机需先运行 npm run bridge`, 'err')
      } else {
        push(`本机桥接在线：${BRIDGE_URL}`)
        push(`  WebSocket：${bridgeConnected.value ? '已连接' : '未连接（connect <token>）'}`)
        push(`  持久会话：${sessionId.value ? sessionId.value + (sessionShell.value ? `（${sessionShell.value}）` : '') : '无'}`)
        push(`  交互会话：${liveSessions.size ? [...liveSessions.entries()].map(([id, c]) => `${id}:${c}`).join('、') : '无'}`)
      }
      push('')
      break
    }
    case 'connect':
      await connectBridge(arg)
      break
    case 'disconnect':
      disconnectBridge()
      break
    case 'local':
      if (!arg) {
        push('用法: local <命令>，例如 local dir / local ipconfig', 'err')
        push('')
      } else {
        await runLocal(arg)
      }
      break
    case 'cwd':
      if (arg) {
        setCwd(arg.trim())
      } else if (bridgeConnected.value) {
        execStartLine = lines.value.length
        wsSend({ type: 'exec', id: sessionId.value, cmd: 'cd' })
      } else {
        push('未连接本机。', 'err')
        push('')
      }
      break
    case 'interactive':
      if (!arg) {
        push('用法: interactive <命令>，如 interactive python / interactive node', 'err')
        push('')
      } else {
        startInteractive(arg)
      }
      break
    case 'raw':
      if (!arg) {
        push('用法: raw <文本>，向活动会话输入一行（配合 interactive）', 'err')
        push('')
      } else {
        sendStdin(arg)
      }
      break
    case 'live':
      if (!liveSessions.size) {
        push('没有活动的交互会话。interactive <命令> 开启。', 'err')
      } else {
        push(`活动交互会话：${[...liveSessions.entries()].map(([id, c]) => `${id}(${c})`).join('、')}`)
        push('  raw <文本> 输入 · live close 结束')
      }
      push('')
      break
    case 'session':
      if (args[0] === 'reset') {
        if (sessionId.value) {
          wsSend({ type: 'reset', id: sessionId.value })
          push('已请求会话复位。', 'dim')
        } else {
          push('没有持久会话。', 'err')
        }
        push('')
      } else if (args[0] === 'close') {
        if (sessionId.value) {
          wsSend({ type: 'close', id: sessionId.value })
          sessionId.value = ''
          push('已关闭持久会话。', 'dim')
        } else {
          push('没有持久会话。', 'err')
        }
        push('')
      } else {
        if (sessionId.value) {
          push(`持久会话：${sessionId.value}（${sessionShell.value || '?'}）`)
          push('  session reset 复位 · session close 关闭', 'dim')
        } else {
          push('没有持久会话。connect <token> 后自动打开。', 'err')
        }
        push('')
      }
      break
    default:
      if (raw.startsWith('!')) {
        await runLocal(raw.slice(1).trim())
      } else {
        push(`'${name}' 不是可识别的命令。输入 help 查看可用命令。`, 'err')
        push('')
      }
  }
}

function onSubmit() {
  const cmd = input.value
  if (!cmd.trim()) return
  history.value.push(cmd)
  histIdx.value = -1
  runCommand(cmd)
  input.value = ''
  scrollDown()
}

function onKeydown(e) {
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!history.value.length) return
    histIdx.value = histIdx.value < 0 ? history.value.length - 1 : Math.max(0, histIdx.value - 1)
    input.value = history.value[histIdx.value]
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (histIdx.value < 0) return
    histIdx.value += 1
    if (histIdx.value >= history.value.length) {
      histIdx.value = -1
      input.value = ''
    } else {
      input.value = history.value[histIdx.value]
    }
  }
}

onMounted(() => {
  pushMulti(BANNER, 'dim')
  scrollDown()
  if (bridgeToken.value) {
    pingBridge()
    connectBridge(bridgeToken.value)
  }
  bridgeTimer = setInterval(pingBridge, 10000)
})

onBeforeUnmount(() => {
  if (bridgeTimer) clearInterval(bridgeTimer)
  bridgeTimer = null
  closeWs()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">命令行</h1>
      <p class="hero-sub">一个假装是 cmd 的窗口 · 点击窗口后即可输入</p>
    </header>

    <div class="cmd-window" @click="focusInput">
      <div class="cmd-bar">
        <span class="cmd-dot on"></span>
        <span class="cmd-dot"></span>
        <span class="cmd-dot"></span>
        <span class="cmd-title">cmd — 博客命令行</span>
        <span class="cmd-bridge" :class="{ on: bridgeConnected || bridgeOnline }" :title="(bridgeConnected ? 'WebSocket 已连接' : bridgeOnline ? '桥接在线，未连接' : '本机桥接离线')">
          <span class="cmd-bridge-dot"></span>{{ bridgeConnected ? '本机在线' : bridgeOnline ? '桥接待连接' : '本机离线' }}
        </span>
      </div>
      <div ref="bodyEl" class="cmd-body">
        <p
          v-for="(l, i) in lines"
          :key="i"
          class="cmd-line"
          :class="l.cls"
        >{{ l.text }}</p>
        <div class="cmd-row">
          <span class="cmd-prompt">{{ PROMPT }}</span>
          <input
            ref="inputEl"
            v-model="input"
            class="cmd-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown="onKeydown"
            @keydown.enter="onSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>