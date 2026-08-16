import { reactive, watch, computed } from 'vue'

export const MODE_CYCLE = ['order', 'list', 'loop', 'random']

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
  lyricAdjust: 0
})

export const currentTrack = computed(() => music.tracks[music.index] || null)
export const progress = computed(() =>
  music.duration ? (music.current / music.duration) * 100 : 0
)
export const modeLabel = computed(
  () => ({ order: '顺序', list: '列表循环', loop: '单曲循环', random: '随机' }[music.mode])
)

export function bindAudio(el) {
  audioEl = el
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

export function togglePlay() {
  if (!audioEl) return
  if (audioEl.paused) {
    if (!audioEl.src) audioEl.src = currentTrack.value?.source || ''
    audioEl.play()
  } else {
    audioEl.pause()
  }
}

export function playIndex(i) {
  if (!music.tracks.length) return
  music.index = (i + music.tracks.length) % music.tracks.length
  if (audioEl) {
    audioEl.src = currentTrack.value?.source || ''
    audioEl.play()
  }
}

export function next(manual = false) {
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

// 歌曲结束处理
export function onEnded() {
  if (music.mode === 'loop') {
    if (audioEl) {
      audioEl.currentTime = 0
      audioEl.play()
    }
    return
  }
  if (music.mode === 'list') {
    next()
    return
  }
  if (music.mode === 'random') {
    next()
    return
  }
  if (music.index >= music.tracks.length - 1) {
    music.playing = false
  } else {
    next()
  }
}

// 持久化音量/模式
const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem('music-prefs')) || {}
  } catch {
    return {}
  }
})()

if (typeof saved.volume === 'number') music.volume = saved.volume
if (saved.mode) music.mode = saved.mode

watch(
  () => [music.volume, music.mode],
  () => {
    localStorage.setItem('music-prefs', JSON.stringify({ volume: music.volume, mode: music.mode }))
  }
)
