<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const WORK = 25 * 60
const BREAK = 5 * 60
const MODES = { work: '专注', break: '休息' }

const secondsLeft = ref(WORK)
const running = ref(false)
const mode = ref('work')
const cycles = ref(0)
let timer = null

const total = computed(() => (mode.value === 'work' ? WORK : BREAK))
const progress = computed(() => 1 - secondsLeft.value / total.value)

const timeText = computed(() => {
  const m = String(Math.floor(secondsLeft.value / 60)).padStart(2, '0')
  const s = String(secondsLeft.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

const circumference = 2 * Math.PI * 84

function tick() {
  if (secondsLeft.value <= 0) {
    if (mode.value === 'work') {
      cycles.value++
      mode.value = 'break'
      secondsLeft.value = BREAK
    } else {
      mode.value = 'work'
      secondsLeft.value = WORK
    }
    running.value = true
    return
  }
  secondsLeft.value--
}

function toggle() {
  running.value = !running.value
}

function reset() {
  running.value = false
  secondsLeft.value = total.value
}

onBeforeUnmount(() => clearInterval(timer))

watch(running, (v) => {
  clearInterval(timer)
  if (v) timer = setInterval(tick, 1000)
})
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">番茄钟</h2>
      <div class="game-score">
        <span class="score-item">今日专注 <strong>{{ cycles }}</strong> 次</span>
      </div>
    </div>
    <div class="pomodoro-body">
      <div class="pomodoro-ring">
        <svg viewBox="0 0 200 200" class="pomodoro-svg">
          <circle cx="100" cy="100" r="84" class="ring-track" />
          <circle
            cx="100"
            cy="100"
            r="84"
            class="ring-fill"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference * progress"
          />
        </svg>
        <div class="pomodoro-center">
          <span class="pomodoro-mode">{{ MODES[mode] }}</span>
          <time class="pomodoro-time">{{ timeText }}</time>
        </div>
      </div>
      <div class="pomodoro-ctrl">
        <button class="btn" @click="toggle">{{ running ? '暂停' : '开始' }}</button>
        <button class="btn" @click="reset">重置</button>
      </div>
      <p class="game-hint">25 分钟专注，5 分钟休息。完成一轮后自动切换。</p>
    </div>
  </section>
</template>
