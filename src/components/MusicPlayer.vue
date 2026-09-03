<script setup>
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { parseLRC, findLyricIndex, parseYRC, findCharIndex } from '../utils/lrc'
import {
  music, currentTrack, progress, modeLabel, sleepRemain,
  RATE_STEPS, cycleMode, togglePlay, playTracks, next, prev,
  seekTo, seekToLyric, setVolume, getAudio, setLyricAdjust,
  setRate, startSleep, cancelSleep
} from '../stores/music'
import {
  prefs, isFavorite, toggleFavorite, createPlaylist,
  addToPlaylist, removeFromPlaylist, isInPlaylist
} from '../stores/musicPrefs'
import { ensureAudioEngine, resumeAudioCtx, getAnalyser } from '../stores/audioEngine'

const props = defineProps({
  tracks: { type: Array, required: true }
})

const lyricBoxRef = ref(null)
const lyricItemRefs = ref([])
const yrcBoxRef = ref(null)
const yrcItemRefs = ref([])
const canvasRef = ref(null)

const lyrics = ref([])
const yrcLines = ref([])
const karaoke = ref(false)
const lrcOffset = ref(0)
const lyricIndex = ref(-1)
const kLine = ref(-1)
const kChar = ref(-1)
const ctx = ref(null)
let raf = null

const openPop = ref('') // '' | 'rate' | 'sleep' | 'playlist'
const newPlName = ref('')
const panel = ref('list') // 'lyric' | 'list' — 酷狗式 歌词/播放列表 切换

// 歌曲时长探测（懒加载，用于列表时长列）
const durations = reactive({})
const probedSlugs = new Set()
let probeQueue = []
let probing = false
let probeEl = null

const OFFSET_KEY = 'lyric-adjust'

function savedAdjust(slug) {
  try {
    return parseFloat(localStorage.getItem(`${OFFSET_KEY}:${slug}`)) || 0
  } catch {
    return 0
  }
}

function trackAdjustKey() {
  return `${OFFSET_KEY}:${currentTrack.value ? currentTrack.value.slug : ''}`
}

const track = currentTrack
const playing = computed(() => music.playing)
const current = computed(() => music.current)
const duration = computed(() => music.duration)
const volume = computed(() => music.volume)
const mode = computed(() => music.mode)
const slug = computed(() => (track.value ? track.value.slug : ''))
const isFav = computed(() => slug.value && isFavorite(slug.value))

function isCurrent(s) {
  return slug.value && s === slug.value
}

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function fmtRemain(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}小时${m}分` : `${m}分钟`
}

function fmtDur(s) {
  if (!isFinite(s) || s <= 0) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function rowDur(t) {
  return fmtDur(durations[t.slug])
}

// ---- 时长懒探测（列表可见时逐首读 metadata） ----
function startProbe() {
  const fresh = props.tracks.filter(
    (t) => t.source && t.slug !== slug.value && !durations[t.slug] && !probedSlugs.has(t.slug)
  )
  probeQueue.push(...fresh.map((t) => t.slug))
  runProbe()
}

function runProbe() {
  if (probing || !probeQueue.length) return
  probing = true
  const s = probeQueue.shift()
  const t = props.tracks.find((x) => x.slug === s)
  if (!t) {
    probing = false
    runProbe()
    return
  }
  const el = new Audio()
  probeEl = el
  const settle = () => {
    if (probeEl === el) probeEl = null
    el.removeAttribute('src')
    probing = false
    runProbe()
  }
  el.preload = 'metadata'
  el.onloadedmetadata = () => {
    if (isFinite(el.duration) && el.duration > 0) durations[s] = el.duration
    probedSlugs.add(s)
    settle()
  }
  el.onerror = () => {
    probedSlugs.add(s)
    settle()
  }
  el.src = t.source
}

// ---- 歌词加载 ----
async function loadLyrics() {
  const t = track.value
  lyricIndex.value = -1
  setLyricAdjust(savedAdjust(t ? t.slug : ''))
  if (!t || !t.lyrics) {
    lyrics.value = []
    lrcOffset.value = 0
    yrcLines.value = []
    return
  }
  try {
    const res = await fetch(t.lyrics)
    if (!res.ok) throw new Error('no lyrics')
    const text = await res.text()
    const parsed = parseLRC(text)
    lyrics.value = parsed.lines
    lrcOffset.value = parsed.offset
  } catch {
    lyrics.value = []
    lrcOffset.value = 0
  }
  if (t.yrc) {
    try {
      const res = await fetch(t.yrc)
      if (res.ok) {
        yrcLines.value = parseYRC(await res.text())
      }
    } catch {
      yrcLines.value = []
    }
  } else {
    yrcLines.value = []
  }
}

// ---- 歌词校准 ----
function nudgeLyrics(delta) {
  const v = Math.min(20, Math.max(-20, Math.round((music.lyricAdjust + delta) * 10) / 10))
  setLyricAdjust(v)
  localStorage.setItem(trackAdjustKey(), String(v))
}

function resetAdjust() {
  setLyricAdjust(0)
  localStorage.removeItem(trackAdjustKey())
}

function effectiveTime() {
  return music.current + music.lyricAdjust + lrcOffset.value
}

function onSeekLyric(time) {
  seekToLyric(time)
  const a = getAudio()
  if (a && a.paused) togglePlay()
}

function seek(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  seekTo(ratio * music.duration)
}

function setVol(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  setVolume(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)))
}

// ---- 逐字卡拉OK ----
function charState(lineIdx, charIdx) {
  if (lineIdx < kLine.value) return 'done'
  if (lineIdx > kLine.value) return 'todo'
  if (charIdx < kChar.value) return 'done'
  if (charIdx === kChar.value) return 'now'
  return 'todo'
}

function updateKaraoke() {
  const t = effectiveTime()
  let li = -1
  for (let i = 0; i < yrcLines.value.length; i++) {
    if (yrcLines.value[i].time <= t) li = i
    else break
  }
  const line = li >= 0 ? yrcLines.value[li] : null
  const ci = line ? findCharIndex(line, t) : -1
  if (li !== kLine.value || ci !== kChar.value) {
    const lineChanged = li !== kLine.value
    kLine.value = li
    kChar.value = ci
    if (lineChanged && li >= 0) {
      nextTick(() => {
        const el = yrcItemRefs.value[li]
        if (el && yrcBoxRef.value) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }
}

// ---- 频谱背景 ----
function setupAnalyser() {
  const a = getAudio()
  if (!a) return
  ensureAudioEngine()
  drawSpectrum()
}

function drawSpectrum() {
  const canvas = canvasRef.value
  const analyser = getAnalyser()
  if (!canvas || !analyser) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const c = ctx.value || canvas.getContext('2d')
  ctx.value = c
  c.scale(dpr, dpr)

  const data = new Uint8Array(analyser.frequencyBinCount)
  const bars = 40
  const style = getComputedStyle(document.documentElement)
  const accent = style.getPropertyValue('--accent').trim() || '#3B6FE0'
  const text = style.getPropertyValue('--text').trim() || '#1B2430'

  function frame() {
    c.clearRect(0, 0, w, h)
    analyser.getByteFrequencyData(data)
    const bw = w / bars
    for (let i = 0; i < bars; i++) {
      const idx = Math.floor((i / bars) * data.length * 0.8)
      const v = data[idx] / 255
      const bh = Math.max(2, v * h * 0.9)
      c.globalAlpha = 0.16 + v * 0.5
      c.fillStyle = i % 7 === 0 ? accent : text
      c.fillRect(i * bw + 1, h - bh, bw - 2, bh)
    }
    c.globalAlpha = 1
    raf = requestAnimationFrame(frame)
  }
  cancelAnimationFrame(raf)
  frame()
}

// ---- 歌词高亮 ----
watch(
  () => music.current,
  () => {
    const idx = findLyricIndex(lyrics.value, effectiveTime())
    if (idx !== lyricIndex.value) {
      lyricIndex.value = idx
      nextTick(() => {
        const el = lyricItemRefs.value[idx]
        if (el && lyricBoxRef.value) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      })
    }
    if (yrcLines.value.length) updateKaraoke()
  }
)

watch(
  () => music.index,
  () => {
    loadLyrics()
  },
  { immediate: true }
)

watch(
  () => music.playing,
  (v) => {
    if (v) {
      resumeAudioCtx()
      if (!getAnalyser()) setupAnalyser()
      else drawSpectrum()
    }
  }
)

watch(panel, (v) => {
  if (v === 'list') startProbe()
})

watch(
  () => props.tracks,
  () => {
    if (panel.value === 'list') startProbe()
  }
)

// 当前曲目时长直接来自播放器
watch(
  () => music.duration,
  (d) => {
    const t = currentTrack.value
    if (t && isFinite(d) && d > 0) durations[t.slug] = d
  }
)

onMounted(() => {
  window.addEventListener('resize', () => raf && drawSpectrum())
  if (music.playing) {
    resumeAudioCtx()
    drawSpectrum()
  }
  if (panel.value === 'list') startProbe()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => raf && drawSpectrum())
  cancelAnimationFrame(raf)
  probeQueue = []
  probing = false
  if (probeEl) {
    probeEl.removeAttribute('src')
    probeEl = null
  }
  // 注意：绝不 close 全局 audioCtx（会切断全局音频输出）
})

// ---- 播放与歌单操作 ----
function playAt(i) {
  playTracks(props.tracks, i)
}

function toggleFav() {
  if (slug.value) toggleFavorite(slug.value)
}

function closePops() {
  openPop.value = ''
}

function doCreatePl() {
  const name = newPlName.value.trim()
  if (!name) return
  const id = createPlaylist(name)
  newPlName.value = ''
  if (slug.value) addToPlaylist(id, slug.value)
  openPop.value = 'playlist'
}

function toggleInPl(pid) {
  if (!slug.value) return
  if (isInPlaylist(pid, slug.value)) removeFromPlaylist(pid, slug.value)
  else addToPlaylist(pid, slug.value)
}
</script>

<template>
  <div class="music-player">
    <div v-if="openPop" class="mp-backdrop" @click="closePops"></div>

    <!-- 头部：唱片 + 歌曲信息 + 主控制 -->
    <div class="mp-head">
      <div class="mp-disc" :class="{ spin: playing }" title="播放 / 暂停" @click="togglePlay">
        <div
          class="mp-disc-cover"
          :style="track && track.cover ? { backgroundImage: `url(${track.cover})` } : {}"
        >
          <span v-if="!track || !track.cover" class="mp-disc-glyph">♫</span>
        </div>
        <span class="mp-disc-spindle"></span>
      </div>

      <div class="mp-head-main">
        <div class="mp-info-row">
          <p class="mp-title">{{ track ? track.title : '—' }}</p>
          <button class="mp-fav" :class="{ on: isFav }" :title="isFav ? '取消收藏' : '收藏'" @click="toggleFav">
            {{ isFav ? '♥' : '♡' }}
          </button>
          <div class="mp-pop-root">
            <button class="mp-btn mp-addlist" title="加入歌单" @click="openPop = openPop === 'playlist' ? '' : 'playlist'">
              + 歌单
            </button>
            <div v-if="openPop === 'playlist'" class="mp-pop">
              <p class="mp-pop-title">加入歌单</p>
              <div v-for="pl in prefs.playlists" :key="pl.id" class="mp-pop-row">
                <button class="mp-pop-check" @click="toggleInPl(pl.id)">
                  <span :class="{ on: slug && isInPlaylist(pl.id, slug) }">{{ slug && isInPlaylist(pl.id, slug) ? '☑' : '☐' }}</span>
                  {{ pl.name }}
                </button>
              </div>
              <div v-if="!prefs.playlists.length" class="mp-pop-empty">还没有歌单</div>
              <div class="mp-pop-new">
                <input v-model="newPlName" class="input" placeholder="新建歌单" @keydown.enter="doCreatePl" />
                <button class="btn btn-sm" @click="doCreatePl">新建</button>
              </div>
            </div>
          </div>
        </div>
        <p class="mp-artist">{{ track && track.artist ? track.artist : '未知歌手' }}</p>
        <div class="mp-head-ctrl">
          <button class="mp-btn" title="上一首" @click="prev">⏮</button>
          <button class="mp-btn mp-play" @click="togglePlay">{{ playing ? '❚❚' : '▶' }}</button>
          <button class="mp-btn" title="下一首" @click="next(true)">⏭</button>
          <button class="mp-btn mp-mode" :title="`播放模式：${modeLabel}`" @click="cycleMode">
            {{ mode === 'random' ? '⇄' : mode === 'loop' ? '⟳' : mode === 'list' ? '⇅' : '→' }}
          </button>
        </div>
      </div>

      <canvas ref="canvasRef" class="mp-spectrum"></canvas>
    </div>

    <!-- 进度条：时间两端对齐 -->
    <div class="mp-progress-row">
      <span class="mp-time">{{ fmt(current) }}</span>
      <div class="mp-progress" @click="seek($event)">
        <div class="mp-progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <span class="mp-time">{{ fmt(duration) }}</span>
    </div>

    <!-- 内容面板：歌词 / 播放列表 -->
    <div class="mp-panel">
      <div class="mp-tabs">
        <button class="mp-tab" :class="{ on: panel === 'lyric' }" @click="panel = 'lyric'">歌词</button>
        <button class="mp-tab" :class="{ on: panel === 'list' }" @click="panel = 'list'">
          播放列表 <span class="mp-tab-count">{{ tracks.length }}</span>
        </button>
      </div>

      <div v-show="panel === 'lyric'" class="mp-lyric-panel">
        <div v-if="!karaoke && lyrics.length" ref="lyricBoxRef" class="mp-lyrics">
          <p
            v-for="(line, i) in lyrics"
            :key="i"
            :ref="(el) => (lyricItemRefs[i] = el)"
            class="mp-lyric-line"
            :class="{ on: i === lyricIndex }"
            :title="`点击跳转 ${fmt(line.time)}`"
            @click="onSeekLyric(line.time)"
          >{{ line.text }}</p>
        </div>
        <div v-else-if="karaoke && yrcLines.length" ref="yrcBoxRef" class="mp-lyrics karaoke">
          <p
            v-for="(line, i) in yrcLines"
            :key="i"
            :ref="(el) => (yrcItemRefs[i] = el)"
            class="mp-k-line"
            :class="{ on: i === kLine }"
            :title="`点击跳转 ${fmt(line.time)}`"
            @click="onSeekLyric(line.time)"
          >
            <span
              v-for="(c, j) in line.chars"
              :key="j"
              class="mp-k-char"
              :class="charState(i, j)"
            >{{ c.char }}</span>
          </p>
        </div>
        <p v-else class="mp-no-lyrics">暂无歌词</p>

        <div v-if="lyrics.length || yrcLines.length" class="mp-lyric-adjust">
          <button v-if="yrcLines.length" class="mp-btn" :class="{ 'mp-k-on': karaoke }" @click="karaoke = !karaoke">
            {{ karaoke ? '行级' : '卡拉OK' }}
          </button>
          <button class="mp-btn" title="校准：提前" @click="nudgeLyrics(-0.5)">−0.5s</button>
          <button class="mp-btn" title="校准：提前" @click="nudgeLyrics(-0.1)">−0.1s</button>
          <span class="mp-adjust-value" :class="{ on: music.lyricAdjust !== 0 }">{{ music.lyricAdjust > 0 ? `+${music.lyricAdjust.toFixed(1)}s` : music.lyricAdjust === 0 ? '同步' : `${music.lyricAdjust.toFixed(1)}s` }}</span>
          <button class="mp-btn" title="校准：延后" @click="nudgeLyrics(0.1)">+0.1s</button>
          <button class="mp-btn" title="校准：延后" @click="nudgeLyrics(0.5)">+0.5s</button>
          <button v-if="music.lyricAdjust !== 0" class="mp-btn mp-adjust-reset" title="重置校准" @click="resetAdjust">重置</button>
        </div>
      </div>

      <div v-show="panel === 'list'" class="mp-list-panel">
        <div class="mp-list-head">
          <span class="mp-col-no">#</span>
          <span class="mp-col-title">歌曲</span>
          <span class="mp-col-artist">歌手</span>
          <span class="mp-col-dur">时长</span>
        </div>
        <div class="mp-list-scroll">
          <div
            v-for="(t, i) in tracks"
            :key="t.slug"
            class="mp-list-row"
            :class="{ on: isCurrent(t.slug) }"
            @click="playAt(i)"
          >
            <span class="mp-col-no">
              <span v-if="isCurrent(t.slug)" class="mp-eq"><i></i><i></i><i></i></span>
              <span v-else class="mp-row-no">{{ String(i + 1).padStart(2, '0') }}</span>
            </span>
            <span class="mp-col-title">
              <span class="mp-row-title">{{ t.title }}</span>
              <span v-if="t.pending" class="mp-row-pending">待发布</span>
              <button
                class="mp-row-fav"
                :class="{ on: isFavorite(t.slug) }"
                :title="isFavorite(t.slug) ? '取消收藏' : '收藏'"
                @click.stop="toggleFavorite(t.slug)"
              >{{ isFavorite(t.slug) ? '♥' : '♡' }}</button>
            </span>
            <span class="mp-col-artist">{{ t.artist || '未知歌手' }}</span>
            <span class="mp-col-dur">{{ rowDur(t) }}</span>
          </div>
          <p v-if="!tracks.length" class="mp-empty">暂无音乐，先上传一首吧</p>
        </div>
      </div>
    </div>

    <!-- 底部工具条 -->
    <div class="mp-bar">
      <div class="mp-vol" :title="`音量 ${Math.round(volume * 100)}%`" @click="setVol($event)">
        <div class="mp-vol-fill" :style="{ width: `${volume * 100}%` }"></div>
      </div>
      <div class="mp-bar-right">
        <div class="mp-pop-root">
          <button class="mp-btn mp-rate" title="倍速" @click="openPop = openPop === 'rate' ? '' : 'rate'">
            {{ music.rate }}×
          </button>
          <div v-if="openPop === 'rate'" class="mp-pop">
            <button
              v-for="r in RATE_STEPS"
              :key="r"
              class="mp-pop-opt"
              :class="{ on: music.rate === r }"
              @click="setRate(r)"
            >{{ r }}×</button>
          </div>
        </div>

        <div class="mp-pop-root">
          <button class="mp-btn mp-sleep" :class="{ on: music.sleepEnd }" title="睡眠定时" @click="openPop = openPop === 'sleep' ? '' : 'sleep'">
            {{ music.sleepEnd ? `⏱${fmtRemain(sleepRemain)}` : '⏱' }}
          </button>
          <div v-if="openPop === 'sleep'" class="mp-pop">
            <button class="mp-pop-opt" :class="{ on: !music.sleepEnd }" @click="cancelSleep; closePops()">关闭</button>
            <button
              v-for="m in [15, 30, 60, 90]"
              :key="m"
              class="mp-pop-opt"
              :class="{ on: music.sleepMin === m }"
              @click="startSleep(m); closePops()"
            >{{ m }}分钟</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>