<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
const CHARS = 'wmoonlq0123456789ABCDEFVueDesign前后端特效留白克制排版'

let ctx = null
let raf = null
let cols = []
let W = 0
let H = 0
const FONT = 18

function resize() {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  W = canvas.clientWidth
  H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const n = Math.ceil(W / FONT)
  cols = Array.from({ length: n }, () => ({
    y: Math.random() * H,
    v: 2 + Math.random() * 4
  }))
}

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v || fallback
}

function draw() {
  const accent = cssColor('--accent', '#3B6FE0')
  const text = cssColor('--text', '#1B2430')
  ctx.clearRect(0, 0, W, H)
  ctx.font = `${FONT}px "SFMono-Regular", Consolas, monospace`
  cols.forEach((col, i) => {
    const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
    ctx.fillStyle = Math.random() < 0.12 ? accent : text
    ctx.globalAlpha = 0.85
    ctx.fillText(ch, i * FONT, col.y)
    ctx.globalAlpha = 1
    col.y += col.v
    if (col.y > H + FONT) {
      col.y = -FONT
      col.v = 2 + Math.random() * 4
    }
  })
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  draw()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="fx-canvas"></canvas>
</template>
