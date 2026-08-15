<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  source: { type: String, required: true },
  poster: { type: String, default: '' },
  embed: { type: Boolean, default: false }
})

const wrapRef = ref(null)
const videoRef = ref(null)
const playing = ref(false)
const muted = ref(false)
const current = ref(0)
const duration = ref(0)
const volume = ref(1)
const rate = ref(1)
const buffered = ref(0)
const showRate = ref(false)
const isFullscreen = ref(false)
const showControls = ref(true)

const currentTime = computed(() => formatTime(current.value))
const totalTime = computed(() => formatTime(duration.value))
const progress = computed(() => (duration.value ? (current.value / duration.value) * 100 : 0))
const bufferedPct = computed(() => (duration.value ? (buffered.value / duration.value) * 100 : 0))

function formatTime(s) {
  if (!isFinite(s) || s < 0) s = 0
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function togglePlay() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) v.play()
  else v.pause()
}

function onPlay() {
  playing.value = true
}

function onPause() {
  playing.value = false
}

function onTimeUpdate() {
  current.value = videoRef.value.currentTime
}

function onLoaded() {
  duration.value = videoRef.value.duration
}

function onProgress() {
  const v = videoRef.value
  if (v.buffered.length) buffered.value = v.buffered.end(v.buffered.length - 1)
}

function seek(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  videoRef.value.currentTime = ratio * duration.value
}

function toggleMute() {
  muted.value = !muted.value
  videoRef.value.muted = muted.value
}

function setVol(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  volume.value = ratio
  videoRef.value.volume = ratio
  if (ratio > 0 && videoRef.value.muted) {
    muted.value = false
    videoRef.value.muted = false
  }
}

function setRate(r) {
  rate.value = r
  videoRef.value.playbackRate = r
  showRate.value = false
}

function toggleFullscreen() {
  const el = wrapRef.value
  if (!document.fullscreenElement) {
    el.requestFullscreen && el.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function onFsChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function onKeydown(e) {
  if (!wrapRef.value) return
  const target = e.target
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
  if (e.code === 'Space') {
    e.preventDefault()
    togglePlay()
  } else if (e.key === 'ArrowRight') {
    videoRef.value.currentTime = Math.min(duration.value, current.value + 5)
  } else if (e.key === 'ArrowLeft') {
    videoRef.value.currentTime = Math.max(0, current.value - 5)
  } else if (e.key.toLowerCase() === 'm') {
    toggleMute()
  } else if (e.key.toLowerCase() === 'f') {
    toggleFullscreen()
  }
}

function onMouseMove() {
  showControls.value = true
  clearTimeout(showControls.timer)
  showControls.timer = setTimeout(() => {
    if (playing.value) showControls.value = false
  }, 2400)
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('fullscreenchange', onFsChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('fullscreenchange', onFsChange)
  clearTimeout(showControls.timer)
})
</script>

<template>
  <div
    ref="wrapRef"
    class="video-wrap"
    :class="{ playing }"
    @mousemove="onMouseMove"
  >
    <div class="video-screen" @click="togglePlay">
      <video
        v-if="!embed"
        ref="videoRef"
        :src="source"
        :poster="poster || undefined"
        playsinline
        preload="metadata"
        @play="onPlay"
        @pause="onPause"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @progress="onProgress"
        @ended="onPause"
      ></video>
      <iframe
        v-else
        :src="source"
        class="video-iframe"
        frameborder="0"
        scrolling="no"
        allowfullscreen
      ></iframe>
    </div>

    <transition name="controls-fade">
      <div v-if="!embed && (showControls || !playing)" class="video-controls" @click.stop>
        <div class="video-seek" @click="seek">
          <div class="video-buffer" :style="{ width: `${bufferedPct}%` }"></div>
          <div class="video-progress" :style="{ width: `${progress}%` }"></div>
          <div class="video-thumb" :style="{ left: `${progress}%` }"></div>
        </div>
        <div class="video-btns">
          <button class="video-btn" aria-label="播放/暂停" @click="togglePlay">
            {{ playing ? '❚❚' : '▶' }}
          </button>
          <span class="video-time">{{ currentTime }} / {{ totalTime }}</span>
          <span class="video-spacer"></span>
          <button class="video-btn video-vol" :title="muted || volume === 0 ? '取消静音' : '静音'" @click="toggleMute">
            {{ muted || volume === 0 ? '✕' : volume < 0.5 ? '◔' : '◉' }}
          </button>
          <div class="video-volbar" @click="setVol">
            <div class="video-volfill" :style="{ width: `${(muted ? 0 : volume) * 100}%` }"></div>
          </div>
          <div class="video-rate">
            <button class="video-btn" @click="showRate = !showRate">{{ rate }}×</button>
            <transition name="controls-fade">
              <div v-if="showRate" class="video-rate-menu">
                <button v-for="r in [0.5, 0.75, 1, 1.25, 1.5, 2]" :key="r" class="video-rate-item" :class="{ on: rate === r }" @click="setRate(r)">{{ r }}×</button>
              </div>
            </transition>
          </div>
          <button class="video-btn" aria-label="全屏" @click="toggleFullscreen">
            {{ isFullscreen ? '⤡' : '⤢' }}
          </button>
        </div>
      </div>
    </transition>

    <transition name="controls-fade">
      <button v-if="!embed && !playing" class="video-bigplay" aria-label="播放" @click="togglePlay">▶</button>
    </transition>
  </div>
</template>
