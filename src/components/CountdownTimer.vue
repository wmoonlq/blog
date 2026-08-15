<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

const PRESETS = [
  { label: '1 分', sec: 60 },
  { label: '5 分', sec: 300 },
  { label: '10 分', sec: 600 }
]

const secondsLeft = ref(300)
const total = ref(300)
const running = ref(false)
const finished = ref(false)
let timer = null

const display = computed(() => {
  const m = String(Math.floor(secondsLeft.value / 60)).padStart(2, '0')
  const s = String(secondsLeft.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

function setPreset(sec) {
  stop()
  total.value = sec
  secondsLeft.value = sec
  finished.value = false
}

function toggle() {
  if (finished.value) {
    secondsLeft.value = total.value
    finished.value = false
  }
  running.value = !running.value
  if (running.value) {
    timer = setInterval(() => {
      secondsLeft.value--
      if (secondsLeft.value <= 0) {
        stop()
        finished.value = true
      }
    }, 1000)
  } else {
    stop()
  }
}

function stop() {
  running.value = false
  clearInterval(timer)
  timer = null
}

function reset() {
  stop()
  secondsLeft.value = total.value
  finished.value = false
}

onBeforeUnmount(stop)
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">倒计时</h2>
      <span class="score-item">滴答作响</span>
    </div>
    <div class="countdown-body">
      <div class="countdown-presets">
        <button
          v-for="p in PRESETS"
          :key="p.sec"
          class="countdown-preset"
          :class="{ on: !running && total === p.sec && !finished }"
          @click="setPreset(p.sec)"
        >{{ p.label }}</button>
      </div>
      <p class="countdown-time" :class="{ finished }">{{ display }}</p>
      <div class="countdown-ctrl">
        <button class="btn" @click="toggle">{{ running ? '暂停' : finished ? '再来一次' : '开始' }}</button>
        <button class="btn" @click="reset">重置</button>
      </div>
      <p class="countdown-hint">选择预设时长，点击开始。</p>
    </div>
  </section>
</template>
