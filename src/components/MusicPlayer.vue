<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  tracks: { type: Array, required: true }
})

const audioRef = ref(null)
const playing = ref(false)
const index = ref(0)
const current = ref(0)
const duration = ref(0)
const volume = ref(0.8)
const mode = ref('list') // list | loop | random
const showList = ref(false)

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

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

watch(
  () => props.tracks,
  () => {
    if (index.value >= props.tracks.length) index.value = 0
  }
)
</script>

<template>
  <div class="music-player">
    <audio
      ref="audioRef"
      :src="track ? track.source : ''"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="current = audioRef.currentTime"
      @loadedmetadata="duration = audioRef.duration"
      @ended="onEnded"
    ></audio>

    <div class="mp-current">
      <div class="mp-cover" :style="track && track.cover ? { backgroundImage: `url(${track.cover})` } : {}">
        <span v-if="!track || !track.cover" class="mp-cover-glyph">♫</span>
      </div>
      <div class="mp-info">
        <p class="mp-title">{{ track ? track.title : '—' }}</p>
        <p class="mp-artist">{{ track && track.artist ? track.artist : '未知歌手' }}</p>
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
