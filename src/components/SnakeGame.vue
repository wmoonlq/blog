<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const CELL = 20
const COLS = 20
const ROWS = 20
const BASE_INTERVAL = 160

const canvasRef = ref(null)
const score = ref(0)
const best = ref(Number(localStorage.getItem('snake-best') || 0))
const state = ref('ready')

let ctx = null
let snake = []
let dir = { x: 1, y: 0 }
let nextDir = { x: 1, y: 0 }
let food = null
let timer = null

const overlayTitle = computed(() => {
  if (state.value === 'ready') return '准备好开始了吗'
  if (state.value === 'paused') return '已暂停'
  return '游戏结束'
})

const overlayButton = computed(() => (state.value === 'over' ? '再来一局' : '开始'))

function init() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ]
  dir = { x: 1, y: 0 }
  nextDir = { x: 1, y: 0 }
  score.value = 0
  spawnFood()
  draw()
}

function spawnFood() {
  const empty = []
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      if (!snake.some((s) => s.x === x && s.y === y)) empty.push({ x, y })
    }
  }
  food = empty[Math.floor(Math.random() * empty.length)]
}

function start() {
  if (state.value === 'over') init()
  state.value = 'playing'
  startLoop()
}

function togglePause() {
  if (state.value === 'playing') {
    state.value = 'paused'
    stopLoop()
  } else if (state.value === 'paused') {
    state.value = 'playing'
    startLoop()
  }
}

function startLoop() {
  stopLoop()
  timer = setInterval(step, Math.max(70, BASE_INTERVAL - score.value * 6))
}

function stopLoop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function step() {
  dir = nextDir
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver()
  if (snake.some((s) => s.x === head.x && s.y === head.y)) return gameOver()
  snake.unshift(head)
  if (head.x === food.x && head.y === food.y) {
    score.value += 1
    if (score.value > best.value) {
      best.value = score.value
      localStorage.setItem('snake-best', String(best.value))
    }
    spawnFood()
    startLoop()
  } else {
    snake.pop()
  }
  draw()
}

function gameOver() {
  state.value = 'over'
  stopLoop()
  draw()
}

function setDir(x, y) {
  if (x === -dir.x && y === -dir.y) return
  nextDir = { x, y }
}

function pressDir(x, y) {
  if (state.value === 'ready' || state.value === 'over') start()
  setDir(x, y)
}

function onKeydown(e) {
  if (e.key === ' ') {
    e.preventDefault()
    if (state.value === 'ready' || state.value === 'over') start()
    else togglePause()
    return
  }
  const dirs = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    w: [0, -1],
    s: [0, 1],
    a: [-1, 0],
    d: [1, 0],
    W: [0, -1],
    S: [0, 1],
    A: [-1, 0],
    D: [1, 0]
  }
  const d = dirs[e.key]
  if (d) {
    e.preventDefault()
    if (state.value === 'ready' || state.value === 'over') start()
    setDir(d[0], d[1])
  }
}

function rr(x, y, size, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + size, y, x + size, y + size, r)
  ctx.arcTo(x + size, y + size, x, y + size, r)
  ctx.arcTo(x, y + size, x, y, r)
  ctx.arcTo(x, y, x + size, y, r)
  ctx.closePath()
  ctx.fill()
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL)
  if (food) {
    ctx.fillStyle = '#B68D73'
    rr(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, 8)
  }
  ctx.fillStyle = '#1A1816'
  const gap = 2
  for (let i = snake.length - 1; i >= 0; i--) {
    rr(snake[i].x * CELL + gap, snake[i].y * CELL + gap, CELL - gap * 2, 5)
  }
}

onMounted(() => {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  canvas.width = COLS * CELL * dpr
  canvas.height = ROWS * CELL * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  init()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  stopLoop()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="game-card">
    <div class="game-head">
      <h2 class="game-title">贪吃蛇</h2>
      <div class="game-score">
        <span class="score-item">分数 <strong>{{ score }}</strong></span>
        <span class="score-item">最高 <strong>{{ best }}</strong></span>
      </div>
    </div>

    <div class="game-board">
      <canvas ref="canvasRef" class="snake-canvas"></canvas>
      <div v-if="state !== 'playing'" class="game-overlay">
        <p class="overlay-title">{{ overlayTitle }}</p>
        <p v-if="state === 'over'" class="overlay-sub">得分 {{ score }}</p>
        <button class="btn" @click="start">{{ overlayButton }}</button>
      </div>
    </div>

    <div class="game-ctrl">
      <div class="dpad">
        <button class="dpad-btn" @click="pressDir(0, -1)">↑</button>
        <div class="dpad-row">
          <button class="dpad-btn" @click="pressDir(-1, 0)">←</button>
          <button class="dpad-btn" @click="pressDir(0, 1)">↓</button>
          <button class="dpad-btn" @click="pressDir(1, 0)">→</button>
        </div>
      </div>
    </div>
    <p class="game-hint">方向键 / WASD 移动 · 空格 开始 / 暂停</p>
  </div>
</template>
