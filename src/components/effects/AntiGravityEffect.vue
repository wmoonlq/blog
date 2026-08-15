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

const FIELD_R = 140
const PUSH = 1.1
const SPRING = 0.045
const DAMP = 0.88

const REDS = ['#8B0000', '#A31111', '#B71C1C', '#C62828', '#D32F2F']
const BLACK = '#0A0A0A'

const parts = [] // { r, theta, size, color, kind, linkPrev } linkPrev: 相连的前一个粒子索引
const bgParts = []

function deg(a) {
  return (a * Math.PI) / 180
}

// ---- SVG Path 采样：保证纹路是连贯线条 ----
const svgNs = 'http://www.w3.org/2000/svg'
const svgEl = document.createElementNS(svgNs, 'svg')

function samplePath(d, count) {
  const path = document.createElementNS(svgNs, 'path')
  path.setAttribute('d', d)
  svgEl.appendChild(path)
  const len = path.getTotalLength()
  const pts = []
  for (let i = 0; i < count; i++) {
    const p = path.getPointAtLength((len * i) / count)
    pts.push({ x: p.x, y: p.y })
  }
  svgEl.removeChild(path)
  return pts
}

function tomoePath(dist, head, tail, ang) {
  // 头部圆 (dist,0) 半径 head，尾巴向中心弯曲
  const p1 = `${dist} ${-head}`
  const p2 = `${dist} ${head}`
  const d0 = dist - head
  return `M ${p1} A ${head} ${head} 0 1 1 ${p2} C ${d0 - 2} ${head - 2} ${d0 - 12} 6 ${d0 - tail} 0 C ${d0 - 12} -6 ${d0 - 2} ${-head + 2} ${p1} Z`
}

function rotatePoint(p, ang) {
  const a = deg(ang)
  const c = Math.cos(a)
  const s = Math.sin(a)
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c }
}

function buildEye(R) {
  const STAR = R * 0.8
  const triAngles = [
    [90, 210, 330],
    [30, 150, 270]
  ]
  // 六芒星每条边独立成组

  // 红色眼球底（圆盘粒子）
  const bgCount = 460
  for (let i = 0; i < bgCount; i++) {
    const r = R * Math.sqrt(Math.random())
    const a = Math.random() * Math.PI * 2
    bgParts.push({
      r,
      theta: a,
      size: 1.7 + Math.random() * 1.3,
      color: REDS[Math.floor(Math.random() * REDS.length)],
      kind: 'bg'
    })
  }
}

function spawn() {
  const R = Math.min(W, H) * 0.34
  parts.length = 0
  bgParts.length = 0
  buildEye(R)
  ;[...parts, ...bgParts].forEach((p) => {
    p.x = Math.cos(p.theta) * p.r
    p.y = Math.sin(p.theta) * p.r
    p.vx = 0
    p.vy = 0
  })
}

function targetPos(p, breathe) {
  return {
    x: cx + Math.cos(p.theta + rot) * p.r * breathe,
    y: cy + Math.sin(p.theta + rot) * p.r * breathe
  }
}

function stepPhysics(p, breathe) {
  const t = targetPos(p, breathe)
  const dxm = mouse.x - p.x
  const dym = mouse.y - p.y
  const dm = Math.hypot(dxm, dym)
  if (mouse.active && dm < FIELD_R && dm > 0.001) {
    const f = (1 - dm / FIELD_R) * PUSH
    p.vx += (dxm / dm) * f
    p.vy += (dym / dm) * f - 0.08
  }
  p.vx += (t.x - p.x) * SPRING
  p.vy += (t.y - p.y) * SPRING
  p.vx *= DAMP
  p.vy *= DAMP
  p.x += p.vx
  p.y += p.vy
  return Math.hypot(t.x - p.x, t.y - p.y)
}

function draw() {
  ctx.clearRect(0, 0, W, H)
  rot += 0.003
  const breathe = 1 + Math.sin(rot * 3.2) * 0.015

  if (mouse.active) {
    ctx.globalAlpha = 0.08
    ctx.fillStyle = '#C62828'
    ctx.beginPath()
    ctx.arc(mouse.x, mouse.y, FIELD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 红底粒子
  for (const p of bgParts) {
    const disp = stepPhysics(p, breathe)
    ctx.fillStyle = p.color
    ctx.globalAlpha = 0.5 + 0.45 * Math.max(0, 1 - disp / 90)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }

  // 纹路：先连线（连贯黑纹），再画点
  ctx.lineWidth = 2.6
  ctx.strokeStyle = BLACK
  const dispArr = new Array(parts.length)
  for (let i = 0; i < parts.length; i++) {
    dispArr[i] = stepPhysics(parts[i], breathe)
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.linkPrev >= 0) {
      const q = parts[p.linkPrev]
      const avg = (dispArr[i] + dispArr[p.linkPrev]) / 2
      ctx.globalAlpha = 0.95 * Math.max(0, 1 - avg / 110)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(q.x, q.y)
      ctx.stroke()
    }
    ctx.globalAlpha = 0.95
    ctx.fillStyle = BLACK
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
