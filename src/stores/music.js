import { reactive, watch, computed, ref } from 'vue'
import { pushHistory } from './musicPrefs'

export const MODE_CYCLE = ['order', 'list', 'loop', 'random']
export const RATE_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2]

// 全局 audio 元素（由 App.vue 挂载，页面切换不销毁）
let audioEl = null

export const music = reactive({
  tracks: [],
  index: 0,
  playing: false,
  current: 0,
  duration: 0,
  volume: 0.8,
  mode: 'order',
  rate: 1,
  lyricAdjust: 0,
  sleepEnd: 0, // 睡眠定时结束时间戳（0 = 未开启）
  sleepMin: 0 // 睡眠定时选择的分钟数
})

// 每秒刷新的响应式时间戳（驱动睡眠倒计时）
export const nowTs = ref(Date.now())

export const currentTrack = computed(() => music.tracks[music.index] || null)
export const progress = computed(() =>
  music.duration ? (music.current / music.duration) * 100 : 0
)
export const modeLabel = computed(
  () => ({ order: '顺序', list: '列表循环', loop: '单曲循环', random: '随机' }[music.mode])
)
export const sleepRemain = computed(() =>
  music.sleepEnd ? Math.max(0, Math.ceil((music.sleepEnd - nowTs.value) / 1000)) : 0
)

export function bindAudio(el) {
  audioEl = el
  if (audioEl) audioEl.playbackRate = music.rate
}

export function getAudio() {
  return audioEl
}

export function setTracks(tracks) {
  music.tracks = tracks || []
  if (music.index >= music.tracks.length) music.index = 0
}

export function setLyricAdjust(v) {
  music.lyricAdjust = v
}

export function cycleMode() {
  const i = MODE_CYCLE.indexOf(music.mode)
  music.mode = MODE_CYCLE[(i + 1) % MODE_CYCLE.length]
}

export function setRate(r) {
  music.rate = r
  if (audioEl) audioEl.playbackRate = r
}

export function togglePlay() {
  if (!audioEl) return
  if (audioEl.paused) {
    if (!audioEl.src) audioEl.src = currentTrack.value?.source || ''
    audioEl.play()
  } else {
    audioEl.pause()
  }
}

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return
  const t = currentTrack.value
  const ms = navigator.mediaSession
  if (!t) return
  try {
    ms.metadata = new MediaMetadata({
      title: t.title || '',
      artist: t.artist || '',
      album: t.artist || '',
      artwork: t.cover
        ? [{ src: new URL(t.cover, location.href).href, sizes: '512x512', type: 'image/jpeg' }]
        : []
    })
  } catch {
    /* ignore */
  }
  ms.setActionHandler('play', () => togglePlay())
  ms.setActionHandler('pause', () => togglePlay())
  ms.setActionHandler('previoustrack', () => prev())
  ms.setActionHandler('nexttrack', () => next())
  ms.setActionHandler('seekto', (d) => seekTo(d.seekTime ?? 0))
}

export function playTracks(list, i) {
  if (!list.length) return
  music.tracks = list
  music.index = i
  if (audioEl) {
    audioEl.src = currentTrack.value?.source || ''
    audioEl.play()
  }
  pushHistory(currentTrack.value?.slug)
  updateMediaSession()
}

export function playIndex(i) {
  if (!music.tracks.length) return
  music.index = (i + music.tracks.length) % music.tracks.length
  if (audioEl) {
    audioEl.src = currentTrack.value?.source || ''
    audioEl.play()
  }
  pushHistory(currentTrack.value?.slug)
  updateMediaSession()
}

export function next(manual = false) {
  if (!music.tracks.length) return
  if (music.mode === 'random') {
    let i
    do {
      i = Math.floor(Math.random() * music.tracks.length)
    } while (i === music.index && music.tracks.length > 1)
    playIndex(i)
    return
  }
  playIndex(music.index + 1)
  void manual
}

export function prev() {
  if (!music.tracks.length) return
  if (music.current > 3 && audioEl) {
    audioEl.currentTime = 0
    return
  }
  playIndex(music.index - 1)
}

export function seekTo(time) {
  if (audioEl && isFinite(time)) audioEl.currentTime = Math.max(0, time)
}

export function seekToLyric(time) {
  // 反向应用校准偏移
  seekTo(time - music.lyricAdjust)
}

export function setVolume(v) {
  music.volume = Math.min(1, Math.max(0, v))
  if (audioEl) audioEl.volume = music.volume
}

// ---- 睡眠定时 ----
export function startSleep(minutes) {
  if (!minutes || minutes <= 0) {
    music.sleepEnd = 0
    music.sleepMin = 0
    return
  }
  music.sleepEnd = Date.now() + minutes * 60 * 1000
  music.sleepMin = minutes
  saveSleep()
}

export function cancelSleep() {
  music.sleepEnd = 0
  music.sleepMin = 0
  try {
    localStorage.removeItem('music-sleep-end')
  } catch {
    /* ignore */
  }
}

function saveSleep() {
  try {
    localStorage.setItem('music-sleep-end', String(music.sleepEnd))
  } catch {
    /* ignore */
  }
}

// 睡眠倒计时 ticker（模块级单例）
setInterval(() => {
  nowTs.value = Date.now()
  if (music.sleepEnd && Date.now() >= music.sleepEnd) {
    music.sleepEnd = 0
    music.sleepMin = 0
    try {
      localStorage.removeItem('music-sleep-end')
    } catch {
      /* ignore */
    }
    if (audioEl) audioEl.pause()
  }
}, 1000)

// 歌曲结束处理
export function onEnded() {
  if (music.mode === 'loop') {
    if (audioEl) {
      audioEl.currentTime = 0
      audioEl.play()
    }
    return
  }
  if (music.mode === 'list' || music.mode === 'random') {
    next()
    return
  }
  if (music.index >= music.tracks.length - 1) {
    music.playing = false
  } else {
    next()
  }
}

// 持久化音量/模式/倍速
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('music-prefs')) || {}
  } catch {
    return {}
  }
})()

if (typeof saved.volume === 'number') music.volume = saved.volume
if (saved.mode) music.mode = saved.mode
if (typeof saved.rate === 'number') music.rate = saved.rate

// 恢复未到期的睡眠定时
try {
  const end = parseInt(localStorage.getItem('music-sleep-end') || '0', 10)
  if (end > Date.now()) music.sleepEnd = end
} catch {
  /* ignore */
}

watch(
  () => [music.volume, music.mode, music.rate],
  () => {
    localStorage.setItem(
      'music-prefs',
      JSON.stringify({ volume: music.volume, mode: music.mode, rate: music.rate })
    )
  }
)

watch(
  () => music.rate,
  (r) => {
    if (audioEl) audioEl.playbackRate = r
  }
)
