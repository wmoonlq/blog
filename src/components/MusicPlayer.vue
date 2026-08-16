<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { parseLRC, findLyricIndex, parseYRC, findCharIndex } from '../utils/lrc'
import {
  music, currentTrack, progress, modeLabel,
  setTracks, cycleMode, togglePlay, playIndex, next, prev,
  seekTo, seekToLyric, setVolume, getAudio, setLyricAdjust
} from '../stores/music'
import { ensureAudioEngine, resumeAudioCtx, getAnalyser } from '../stores/audioEngine'

const props = defineProps({
  tracks: { type: Array, required: true }
})

// 同步曲库到全局
setTracks(props.tracks)

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
const index = computed(() => music.index)

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
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
  const bars = 56
  const style = getComputedStyle(document.documentElement)
  const accent = style.getPropertyValue('--accent').trim() || '#B68D73'
  const text = style.getPropertyValue('--text').trim() || '#1A1816'

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
  () => props.tracks,
  () => {
    setTracks(props.tracks)
    loadLyrics()
  }
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

onMounted(() => {
  window.addEventListener('resize', () => raf && drawSpectrum())
  // 如果全局正在播放，恢复频谱
  if (music.playing) {
    resumeAudioCtx()
    drawSpectrum()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => raf && drawSpectrum())
  cancelAnimationFrame(raf)
  // 注意：绝不 close 全局 audioCtx（会切断全局音频输出）
})
</script>

<template>
  <div class="music-player" :class="{ hasLyrics: lyrics.length }">
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

      <div class="mp-tracks">
        <p class="mp-tracks-title">播放列表 <span class="mp-tracks-count">{{ tracks.length }}</span></p>
        <div class="mp-tracks-list">
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
      </div>
    </div>

    <div class="mp-progress" @click="seek($event)">
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
        <div class="mp-vol" @click="setVol($event)">
          <div class="mp-vol-fill" :style="{ width: `${volume * 100}%` }"></div>
        </div>
        <button class="mp-btn mp-mode" :title="`播放模式：${modeLabel}`" @click="cycleMode">
          {{ mode === 'random' ? '⇄' : mode === 'loop' ? '⟳' : mode === 'list' ? '⇅' : '→' }}
        </button>
      </div>
    </div>
  </div>
</template>
