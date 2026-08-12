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
  W = window.innerWidth
  H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

function spawn() {
  if (!mouse.active || parts.length > 90) return
  for (let i = 0; i < 2; i++) {
    parts.push({
      x: mouse.x + (Math.random() - 0.5) * 8,
      y: mouse.y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5 - 0.15,
      r: 0.8 + Math.random() * 1.8,
      life: 1,
      accent: Math.random() < 0.12
    })
  }
}

function tick() {
  ctx.clearRect(0, 0, W, H)
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.02
    p.life -= 0.018
    if (p.life <= 0) {
      parts.splice(i, 1)
      continue
    }
    ctx.globalAlpha = Math.max(0, p.life) * 0.55
    ctx.fillStyle = p.accent ? '#B68D73' : '#1A1816'
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  spawn()
  raf = requestAnimationFrame(tick)
}

function onMove(e) {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouse.active = true
}

function onTouch(e) {
  const t = e.touches[0]
  mouse.x = t.clientX
  mouse.y = t.clientY
  mouse.active = true
}

function onLeave() {
  mouse.active = false
}

onMounted(() => {
  resize()
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseout', onLeave)
  window.addEventListener('touchmove', onTouch, { passive: true })
  window.addEventListener('resize', resize)
  tick()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseout', onLeave)
  window.removeEventListener('touchmove', onTouch)
  window.removeEventListener('resize', resize)
})
</script>

<template>
  <canvas ref="canvasRef" class="fx-global"></canvas>
</template>
