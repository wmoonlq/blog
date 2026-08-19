<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
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

function runCommand(cmd) {
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
    default:
      push(`'${name}' 不是可识别的命令。输入 help 查看可用命令。`, 'err')
      push('')
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