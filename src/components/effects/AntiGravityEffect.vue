<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)

let ctx = null
let raf = null
let W = 0
let H = 0
let groundY = 0
const mouse = { x: -999, y: -999, active: false }

const GRAVITY = 0.14
const LIFT = 0.3
const FIELD_R = 110
const DRAG = 0.92
const WALL_BOUNCE = -0.55

const parts = []
const COUNT = 70

function resize() {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  W = canvas.clientWidth
  H = canvas.clientHeight
  groundY = H - 14
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
}

function spawn() {
  parts.length = 0
  for (let i = 0; i < COUNT; i++) {
    parts.push({
      x: 10 + Math.random() * (W - 20),
      y: 10 + Math.random() * (H - 30),
      vx: 0,
      vy: 0,
      r: 1.2 + Math.random() * 2.2,
      accent: Math.random() < 0.2
    })
  }
}

function draw() {
  const s = getComputedStyle(document.documentElement)
  const accent = s.getPropertyValue('--accent').trim() || '#B68D73'
  const text = s.getPropertyValue('--text').trim() || '#1A1816'

  ctx.clearRect(0, 0, W, H)

  if (mouse.active) {
    ctx.globalAlpha = 0.08
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, FIELD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  for (const p of parts) {
    const dx = mouse.x - p.x
    const dy = mouse.y - p.y
    const d = Math.hypot(dx, dy)
    const inField = mouse.active && d < FIELD_R

    if (inField) {
      const f = 1 - d / FIELD_R
      p.vy -= LIFT * f
      const nx = dx / (d || 1)
      const ny = dy / (d || 1)
      p.vx += nx * 0.06 * f
      p.vy += ny * 0.06 * f
    } else {
      p.vy += GRAVITY
    }

    p.vx *= DRAG
    p.vy *= DRAG
    p.x += p.vx
    p.y += p.vy

    if (p.y > groundY) {
      p.y = groundY
      p.vy = 0
      p.vx *= 0.7
    }
    if (p.x < 2) {
      p.x = 2
      p.vx *= WALL_BOUNCE
    }
    if (p.x > W - 2) {
      p.x = W - 2
      p.vx *= WALL_BOUNCE
    }
    if (p.y < 2) {
      p.y = 2
      p.vy *= WALL_BOUNCE
    }

    ctx.fillStyle = p.accent ? accent : text
    ctx.globalAlpha = inField ? 0.95 : 0.75
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--divider').trim() || 'rgba(0,0,0,0.05)'
  ctx.beginPath()
  ctx.moveTo(8, groundY + 0.5)
  ctx.lineTo(W - 8, groundY + 0.5)
  ctx.stroke()

  raf = requestAnimationFrame(draw)
}

function onMove(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  mouse.active = true
}

function onTouch(e) {
  const t = e.touches[0]
  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = t.clientX - rect.left
  mouse.y = t.clientY - rect.top
  mouse.active = true
}

function onLeave() {
  mouse.active = false
  mouse.x = -999
  mouse.y = -999
}

onMounted(() => {
  resize()
  spawn()
  draw()
  window.addEventListener('resize', resize)
  canvasRef.value.addEventListener('mousemove', onMove)
  canvasRef.value.addEventListener('mouseleave', onLeave)
  canvasRef.value.addEventListener('touchmove', onTouch, { passive: true })
  canvasRef.value.addEventListener('touchend', onLeave)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  canvasRef.value?.removeEventListener('mousemove', onMove)
  canvasRef.value?.removeEventListener('mouseleave', onLeave)
  canvasRef.value?.removeEventListener('touchmove', onTouch)
  canvasRef.value?.removeEventListener('touchend', onLeave)
})
</script>

<template>
  <canvas ref="canvasRef" class="fx-canvas"></canvas>
</template>
