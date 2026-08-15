<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { parseLRC, findLyricIndex } from '../utils/lrc'

const props = defineProps({
  tracks: { type: Array, required: true }
})

const audioRef = ref(null)
const lyricBoxRef = ref(null)
const lyricItemRefs = ref([])
const canvasRef = ref(null)

const playing = ref(false)
const index = ref(0)
const current = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const mode = ref('list') // list | loop | random
const showList = ref(false)
const lyrics = ref([])
const lrcOffset = ref(0) // LRC 文件内 [offset:] 标签
const adjust = ref(0) // 用户手动校准偏移（秒）
const lyricIndex = ref(-1)
const showAdjust = ref(false)
const ctx = ref(null)
const analyser = ref(null)
let raf = null

const OFFSET_KEY = 'lyric-adjust'

function savedAdjust(slug) {
  try {
    return parseFloat(localStorage.getItem(`${OFFSET_KEY}:${slug}`)) || 0
  } catch {
    return 0
  }
}

function trackAdjustKey() {
  return `${OFFSET_KEY}:${track.value ? track.value.slug : ''}`
}

const track = computed(() => props.tracks[index.value] || null)
const progress = computed(() => (duration.value ? (current.value / duration.value) * 100 : 0))
const modeLabel = computed(() => ({ list: '列表', loop: '单曲', random: '随机' }[mode.value]))

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

function togglePlay() {
  const a = audioRef.value
  if (!a) return
  if (a.paused) a.play()
  else a.pause()
}

function playIndex(i) {
  index.value = (i + props.tracks.length) % props.tracks.length
  nextTick(() => {
    audioRef.value && audioRef.value.play()
  })
}

function next(manual = false) {
  if (mode.value === 'random') {
    let i
    do {
      i = Math.floor(Math.random() * props.tracks.length)
    } while (i === index.value && props.tracks.length > 1)
    playIndex(i)
    return
  }
  playIndex(index.value + 1)
  void manual
}

function prev() {
  if (current.value > 3) {
    audioRef.value.currentTime = 0
    return
  }
  playIndex(index.value - 1)
}

function seek(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  audioRef.value.currentTime = ratio * duration.value
}

function setVol(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  volume.value = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  audioRef.value.volume = volume.value
}

function onEnded() {
  if (mode.value === 'loop') {
    audioRef.value.currentTime = 0
    audioRef.value.play()
  } else if (index.value >= props.tracks.length - 1) {
    playing.value = false
  } else {
    next()
  }
}

function onKeydown(e) {
  const target = e.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  }
}

// ---- 歌词加载 ----
async function loadLyrics() {
  const t = track.value
  lyricIndex.value = -1
  adjust.value = savedAdjust(t ? t.slug : '')
  if (!t || !t.lyrics) {
    lyrics.value = []
    lrcOffset.value = 0
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
}

// ---- 歌词校准 ----
function nudgeLyrics(delta) {
  adjust.value = Math.min(20, Math.max(-20, Math.round((adjust.value + delta) * 10) / 10))
  localStorage.setItem(trackAdjustKey(), String(adjust.value))
}

function resetAdjust() {
  adjust.value = 0
  localStorage.removeItem(trackAdjustKey())
}

function effectiveTime() {
  return current.value + adjust.value + lrcOffset.value
}

// ---- 频谱背景 ----
let audioCtx = null
let sourceNode = null

function setupAnalyser() {
  if (!audioRef.value) return
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    sourceNode = audioCtx.createMediaElementSource(audioRef.value)
    analyser.value = audioCtx.createAnalyser()
    analyser.value.fftSize = 128
    sourceNode.connect(analyser.value)
    analyser.value.connect(audioCtx.destination)
  }
  drawSpectrum()
}

function drawSpectrum() {
  const canvas = canvasRef.value
  if (!canvas || !analyser.value) return
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  const c = ctx.value || canvas.getContext('2d')
  ctx.value = c
  c.scale(dpr, dpr)

  const data = new Uint8Array(analyser.value.frequencyBinCount)
  const bars = 56
  const style = getComputedStyle(document.documentElement)
  const accent = style.getPropertyValue('--accent').trim() || '#B68D73'
  const text = style.getPropertyValue('--text').trim() || '#1A1816'

  function frame() {
    c.clearRect(0, 0, w, h)
    analyser.value.getByteFrequencyData(data)
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

// ---- 歌词滚动 ----
watch(
  () => current.value,
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
  }
)

watch(
  () => index.value,
  () => {
    loadLyrics()
  },
  { immediate: true }
)

watch(
  () => props.tracks,
  () => {
    if (index.value >= props.tracks.length) index.value = 0
    loadLyrics()
  }
)

function onPlayStart() {
  playing.value = true
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
  if (!analyser.value) setupAnalyser()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', () => raf && drawSpectrum())
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  cancelAnimationFrame(raf)
  if (audioCtx) audioCtx.close()
})
</script>

<template>
  <div class="music-player" :class="{ hasLyrics: lyrics.length }">
    <audio
      ref="audioRef"
      :src="track ? track.source : ''"
      @play="onPlayStart"
      @pause="playing = false"
      @timeupdate="current = audioRef.currentTime"
      @loadedmetadata="duration = audioRef.duration"
      @ended="onEnded"
    ></audio>

    <div class="mp-body">
      <div class="mp-left">
        <div class="mp-cover-lg" :style="track && track.cover ? { backgroundImage: `url(${track.cover})` } : {}">
          <span v-if="!track || !track.cover" class="mp-cover-glyph">♫</span>
        </div>
        <div class="mp-info">
          <p class="mp-title">{{ track ? track.title : '—' }}</p>
          <p class="mp-artist">{{ track && track.artist ? track.artist : '未知歌手' }}</p>
        </div>
        <canvas ref="canvasRef" class="mp-spectrum"></canvas>
      </div>

      <div class="mp-right">
        <div v-if="lyrics.length" ref="lyricBoxRef" class="mp-lyrics">
          <p
            v-for="(line, i) in lyrics"
            :key="i"
            :ref="(el) => (lyricItemRefs[i] = el)"
            class="mp-lyric-line"
            :class="{ on: i === lyricIndex }"
          >{{ line.text }}</p>
        </div>
        <p v-else class="mp-no-lyrics">暂无歌词</p>

        <div v-if="lyrics.length" class="mp-lyric-adjust">
          <button class="mp-btn" title="校准：提前" @click="nudgeLyrics(-0.5)">−0.5s</button>
          <button class="mp-btn" title="校准：提前" @click="nudgeLyrics(-0.1)">−0.1s</button>
          <span class="mp-adjust-value" :class="{ on: adjust !== 0 }">{{ adjust > 0 ? `+${adjust.toFixed(1)}s` : adjust === 0 ? '同步' : `${adjust.toFixed(1)}s` }}</span>
          <button class="mp-btn" title="校准：延后" @click="nudgeLyrics(0.1)">+0.1s</button>
          <button class="mp-btn" title="校准：延后" @click="nudgeLyrics(0.5)">+0.5s</button>
          <button v-if="adjust !== 0" class="mp-btn mp-adjust-reset" title="重置校准" @click="resetAdjust">重置</button>
        </div>
      </div>
    </div>

    <div class="mp-progress" @click="seek">
      <div class="mp-progress-fill" :style="{ width: `${progress}%` }"></div>
    </div>
    <div class="mp-row">
      <span class="mp-time">{{ fmt(current) }} / {{ fmt(duration) }}</span>
      <div class="mp-ctrl">
        <button class="mp-btn" title="上一首" @click="prev">⏮</button>
        <button class="mp-btn mp-play" @click="togglePlay">{{ playing ? '❚❚' : '▶' }}</button>
        <button class="mp-btn" title="下一首" @click="next(true)">⏭</button>
      </div>
      <div class="mp-right">
        <div class="mp-vol" @click="setVol">
          <div class="mp-vol-fill" :style="{ width: `${volume * 100}%` }"></div>
        </div>
        <button class="mp-btn mp-mode" :title="`播放模式：${modeLabel}`" @click="mode = mode === 'list' ? 'loop' : mode === 'loop' ? 'random' : 'list'">
          {{ mode === 'random' ? '⇄' : mode === 'loop' ? '⟳' : '≡' }}
        </button>
        <button class="mp-btn" :title="showList ? '收起列表' : '播放列表'" @click="showList = !showList">
          {{ showList ? '▾' : '☰' }}
        </button>
      </div>
    </div>

    <transition name="controls-fade">
      <div v-if="showList" class="mp-list">
        <button
          v-for="(t, i) in tracks"
          :key="t.slug"
          class="mp-item"
          :class="{ on: i === index }"
          @click="playIndex(i)"
        >
          <span class="mp-item-title">{{ t.title }}</span>
          <span class="mp-item-artist">{{ t.artist }}</span>
        </button>
        <p v-if="!tracks.length" class="mp-empty">暂无音乐，先上传一首吧</p>
      </div>
    </transition>
  </div>
</template>
