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

const PALETTE = ['#7F0000', '#B71C1C', '#C62828', '#D32F2F', '#E53935']
const CORE_COLOR = '#FF5252'

const parts = []

function deg(angle) {
  return (angle * Math.PI) / 180
}

// 生成六芒星（两个等边三角形）+ 瞳孔环 + 内环 的采样点
function eyePoints(R) {
  const pts = []
  const pushEdge = (p1, p2, seg) => {
    for (let i = 0; i < seg; i++) {
      const t = i / seg
      pts.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      })
    }
  }
  const tri = (angles) => {
    const vs = angles.map((a) => ({ x: Math.cos(deg(a)) * R, y: Math.sin(deg(a)) * R }))
    for (let i = 0; i < 3; i++) {
      pushEdge(vs[i], vs[(i + 1) % 3], 22)
    }
  }
  tri([0, 120, 240])
  tri([60, 180, 300])

  const ring = (radius, n) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pts.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius })
    }
  }
  ring(R * 0.44, 46) // 内环
  ring(R * 0.2, 30) // 瞳孔环
  return pts
}

function spawn() {
  const R = Math.min(W, H) * 0.36
  const pts = eyePoints(R)
  const pad = 2
  parts.length = 0
  pts.forEach((p) => {
    const core = Math.hypot(p.x, p.y) < R * 0.28
    parts.push({
      r: Math.hypot(p.x, p.y),
      theta: Math.atan2(p.y, p.x),
      x: p.x,
      y: p.y,
      vx: 0,
      vy: 0,
      size: 1.4 + Math.random() * 1.6,
      color: core ? CORE_COLOR : PALETTE[Math.floor(Math.random() * PALETTE.length)],
      scatterX: (Math.random() - 0.5) * W,
      scatterY: (Math.random() - 0.5) * H
    })
  })
  // 预留几处留白，避免过于密集
  void pad
}

function draw() {
  ctx.clearRect(0, 0, W, H)

  rot += 0.0035 // 缓慢旋转

  // 鼠标反重力场指示
  if (mouse.active) {
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#C62828'
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, FIELD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 轻微呼吸
  const breathe = 1 + Math.sin(rot * 3.2) * 0.015

  for (const p of parts) {
    // 目标位置：图案本地坐标 + 旋转 + 呼吸
    const targetX = cx + Math.cos(p.theta + rot) * p.r * breathe
    const targetY = cy + Math.sin(p.theta + rot) * p.r * breathe

    // 反重力场：推开（鼠标在目标位置附近时）
    const dxm = mouse.x - p.x
    const dym = mouse.y - p.y
    const dm = Math.hypot(dxm, dym)
    if (mouse.active && dm < FIELD_R && dm > 0.001) {
      const f = (1 - dm / FIELD_R) * PUSH
      p.vx += (dxm / dm) * f
      p.vy += (dym / dm) * f - 0.08 // 略带上浮
    }

    // 弹簧回弹到目标
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
