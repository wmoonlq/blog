<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const zoneRef = ref(null)
let ctx = null
let raf = null
let flakes = []
let W = 0
let H = 0

function resize() {
  const zone = zoneRef.value
  const rect = zone.getBoundingClientRect()
  W = rect.width
  H = rect.height
  const canvas = zone.querySelector('canvas')
  const dpr = window.devicePixelRatio || 1
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = `${W}px`
  canvas.style.height = `${H}px`
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

function spawnFlakes() {
  const target = Math.floor(W / 18)
  while (flakes.length < target) {
    flakes.push({
      x: Math.random() * W,
      y: Math.random() * -H,
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.6 + Math.random() * 1.2,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.01 + Math.random() * 0.02
    })
  }
}

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v || fallback
}

function draw() {
  const snowColor = cssColor('--text', '#1A1816')
  ctx.clearRect(0, 0, W, H)
  flakes.forEach((f) => {
    f.sway += f.swaySpeed
    f.x += f.vx + Math.sin(f.sway) * 0.4
    f.y += f.vy
    if (f.y > H + 8) {
      f.y = -8
      f.x = Math.random() * W
    }
    if (f.x < -8) f.x = W + 8
    if (f.x > W + 8) f.x = -8
    ctx.globalAlpha = 0.5 + Math.random() * 0.4
    ctx.fillStyle = snowColor
    ctx.beginPath()
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  resize()
  spawnFlakes()
  draw()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <div ref="zoneRef" class="firework-zone">
    <canvas></canvas>
  </div>
</template>
