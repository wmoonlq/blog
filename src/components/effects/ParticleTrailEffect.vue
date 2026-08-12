<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)

let ctx = null
let raf = null
let W = 0
let H = 0
const parts = []
const mouse = { x: 0, y: 0, active: false }

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

function spawn() {
  if (!mouse.active) return
  for (let i = 0; i < 2; i++) {
    parts.push({
      x: mouse.x + (Math.random() - 0.5) * 6,
      y: mouse.y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6 - 0.2,
      r: 1 + Math.random() * 2.5,
      life: 1,
      accent: Math.random() < 0.15
    })
  }
}

function tick() {
  ctx.clearRect(0, 0, W, H)
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.03
    p.life -= 0.015
    if (p.life <= 0) {
      parts.splice(i, 1)
      continue
    }
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.accent ? '#B68D73' : '#1A1816'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  spawn()
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  resize()
  const canvas = canvasRef.value
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect()
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
    mouse.active = true
  })
  canvas.addEventListener('mouseleave', () => {
    mouse.active = false
  })
  canvas.addEventListener(
    'touchmove',
    (e) => {
      const t = e.touches[0]
      const r = canvas.getBoundingClientRect()
      mouse.x = t.clientX - r.left
      mouse.y = t.clientY - r.top
      mouse.active = true
    },
    { passive: true }
  )
  tick()
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
