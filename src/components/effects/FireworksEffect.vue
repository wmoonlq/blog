<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const zoneRef = ref(null)
let rockets = []
let raf = null

const COLORS = ['#B68D73', '#8D7B6A', '#5E554C', '#1A1816', '#C9A88E']

function launch(x, y) {
  const particles = []
  const count = 26 + Math.floor(Math.random() * 14)
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    const speed = 1.2 + Math.random() * 2.4
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      r: 1.2 + Math.random() * 1.6
    })
  }
  rockets.push({ particles, color })
}

function cssColor(varName, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return v || fallback
}

function draw() {
  const ctx = zoneRef.value?.getContext?.('2d')
  if (!ctx) return
  const rect = zoneRef.value.getBoundingClientRect()
  const accent = cssColor('--accent', '#B68D73')
  const text = cssColor('--text', '#1A1816')
  ctx.clearRect(0, 0, rect.width, rect.height)
  for (let i = rockets.length - 1; i >= 0; i--) {
    const rk = rockets[i]
    let alive = false
    rk.particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.03
      p.life -= 0.012
      if (p.life <= 0) return
      alive = true
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = rk.color === '#B68D73' ? accent : rk.color === '#1A1816' ? text : rk.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    })
    if (!alive) rockets.splice(i, 1)
  }
  ctx.globalAlpha = 1
  raf = requestAnimationFrame(draw)
}

function onResize() {
  const zone = zoneRef.value
  const rect = zone.getBoundingClientRect()
  const canvas = zone.querySelector('canvas')
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`
  canvas.getContext('2d').scale(dpr, dpr)
}

function onClick(e) {
  const rect = zoneRef.value.getBoundingClientRect()
  launch(e.clientX - rect.left, e.clientY - rect.top)
}

onMounted(() => {
  onResize()
  draw()
  window.addEventListener('resize', onResize)
  zoneRef.value.addEventListener('click', onClick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', onResize)
  zoneRef.value?.removeEventListener('click', onClick)
})
</script>

<template>
  <div ref="zoneRef" class="firework-zone">
    <canvas></canvas>
  </div>
</template>
