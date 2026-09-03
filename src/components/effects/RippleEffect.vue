<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)
const ripples = []
let raf = null
let ctx = null
let W = 0
let H = 0

function resize() {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  W = canvas.clientWidth
  H = canvas.clientHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

function onClick(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  ripples.push({
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    r: 2,
    life: 1
  })
}

function draw() {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#3B6FE0'
  const rgb = accent.startsWith('#') && accent.length === 7
    ? `${parseInt(accent.slice(1, 3), 16)}, ${parseInt(accent.slice(3, 5), 16)}, ${parseInt(accent.slice(5, 7), 16)}`
    : '59, 111, 224'
  ctx.clearRect(0, 0, W, H)
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i]
    r.r += 1.8
    r.life -= 0.02
    if (r.life <= 0) {
      ripples.splice(i, 1)
      continue
    }
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${rgb}, ${r.life})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  draw()
  canvasRef.value.addEventListener('click', onClick)
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  canvasRef.value?.removeEventListener('click', onClick)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="fx-canvas"></canvas>
</template>
