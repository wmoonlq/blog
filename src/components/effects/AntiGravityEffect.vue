<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasRef = ref(null)

let ctx = null
let raf = null
let W = 0
let H = 0
let cx = 0
let cy = 0
let rot = 0
const mouse = { x: -999, y: -999, active: false }

const FIELD_R = 130
const PUSH = 0.9
const SPRING = 0.035
const DAMP = 0.9

const REDS = ['#7F0000', '#A31111', '#B71C1C', '#C62828']
const BLACK = '#0D0D0D'

const parts = []

function deg(a) {
  return (a * Math.PI) / 180
}

function buildEye(R) {
  // ---- 1. 红色眼球底（圆盘粒子，密度均匀） ----
  const bgCount = 520
  for (let i = 0; i < bgCount; i++) {
    const r = R * Math.sqrt(Math.random())
    const a = Math.random() * Math.PI * 2
    parts.push({
      r,
      theta: a,
      size: 1.8 + Math.random() * 1.4,
      color: REDS[Math.floor(Math.random() * REDS.length)]
    })
  }

  // ---- 2. 黑色六芒星（两个叠加等边三角形的边） ----
  const STAR = R * 0.78
  const seg = 20
  const pushEdge = (p1, p2) => {
    for (let i = 0; i < seg; i++) {
      const t = i / seg
      const x = p1.x + (p2.x - p1.x) * t
      const y = p1.y + (p2.y - p1.y) * t
      parts.push({
        r: Math.hypot(x, y),
        theta: Math.atan2(y, x),
        size: 2.2,
        color: BLACK
      })
    }
  }
  const tri = (angles) => {
    const vs = angles.map((a) => ({ x: Math.cos(deg(a)) * STAR, y: Math.sin(deg(a)) * STAR }))
    for (let i = 0; i < 3; i++) pushEdge(vs[i], vs[(i + 1) % 3])
  }
  tri([90, 210, 330])
  tri([30, 150, 270])

  // ---- 3. 鼬三瓣勾玉（头部实心圆 + 向外细尾弧） ----
  const tomoeDist = R * 0.52
  const tomoeHead = R * 0.155
  for (let k = 0; k < 3; k++) {
    const base = deg(60 + k * 120)
    // 头部：实心圆盘
    for (let i = 0; i < 26; i++) {
      const rr = tomoeHead * Math.sqrt(Math.random())
      const aa = Math.random() * Math.PI * 2
      const x = Math.cos(base) * tomoeDist + Math.cos(base + aa) * rr
      const y = Math.sin(base) * tomoeDist + Math.sin(base + aa) * rr
      parts.push({
        r: Math.hypot(x, y),
        theta: Math.atan2(y, x),
        size: 2.4,
        color: BLACK
      })
    }
    // 尾巴：沿圆周弧线向外渐细（构成勾玉逗号尾）
    const tailSeg = 18
    const tailSpan = 34
    for (let i = 0; i < tailSeg; i++) {
      const t = i / tailSeg
      const arc = deg(-tailSpan / 2 + t * tailSpan)
      const radius = tomoeDist + tomoeHead + (R * 0.2) * t
      const x = Math.cos(base + arc) * radius
      const y = Math.sin(base + arc) * radius
      parts.push({
        r: Math.hypot(x, y),
        theta: Math.atan2(y, x),
        size: 2.4 - t * 0.9,
        color: BLACK
      })
    }
  }

  // ---- 4. 中心黑色瞳孔 ----
  const pupilR = R * 0.16
  for (let i = 0; i < 40; i++) {
    const r = pupilR * Math.sqrt(Math.random())
    const a = Math.random() * Math.PI * 2
    parts.push({
      r,
      theta: a,
      size: 2.6,
      color: BLACK
    })
  }
}

function spawn() {
  const R = Math.min(W, H) * 0.34
  parts.length = 0
  buildEye(R)
  parts.forEach((p) => {
    p.x = Math.cos(p.theta) * p.r
    p.y = Math.sin(p.theta) * p.r
    p.vx = 0
    p.vy = 0
  })
}

function draw() {
  ctx.clearRect(0, 0, W, H)

  rot += 0.0035 // 缓慢旋转

  if (mouse.active) {
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#C62828'
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, FIELD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  const breathe = 1 + Math.sin(rot * 3.2) * 0.015

  for (const p of parts) {
    const targetX = cx + Math.cos(p.theta + rot) * p.r * breathe
    const targetY = cy + Math.sin(p.theta + rot) * p.r * breathe

    const dxm = mouse.x - p.x
    const dym = mouse.y - p.y
    const dm = Math.hypot(dxm, dym)
    if (mouse.active && dm < FIELD_R && dm > 0.001) {
      const f = (1 - dm / FIELD_R) * PUSH
      p.vx += (dxm / dm) * f
      p.vy += (dym / dm) * f - 0.08
    }

    p.vx += (targetX - p.x) * SPRING
    p.vy += (targetY - p.y) * SPRING
    p.vx *= DAMP
    p.vy *= DAMP
    p.x += p.vx
    p.y += p.vy

    ctx.fillStyle = p.color
    ctx.globalAlpha = 0.92
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  raf = requestAnimationFrame(draw)
}

function resize() {
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  W = canvas.clientWidth
  H = canvas.clientHeight
  cx = W / 2
  cy = H / 2
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
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
