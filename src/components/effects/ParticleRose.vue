<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { hexToRgb, themeColors } from '../../utils/threeTheme'

// 拖拽旋转状态（可变对象，factory 通过 useThree 第二参数引用）
const drag = { rotY: 0 }

const el = useThree(({ scene, camera }, drag) => {
  camera.position.set(0, 0.4, 6.5)
  camera.lookAt(0, 0, 0)

  const COUNT = 4200
  const current = new Float32Array(COUNT * 3)
  const target = new Float32Array(COUNT * 3)
  const scatter = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)

  // 目标颜色角色：0 = 花瓣(accent)，1 = 花蕊(text)
  const roles = new Uint8Array(COUNT)

  // 玫瑰 3D 点集：双层参数花瓣
  for (let i = 0; i < COUNT; i++) {
    const roll = Math.random()
    const b = Math.random() * Math.PI * 2
    let r
    if (roll < 0.74) {
      r = Math.pow(Math.abs(Math.sin(2 * b)), 0.85) * 2.35
      roles[i] = 0
    } else {
      r = Math.pow(Math.abs(Math.sin(4 * b)), 1.6) * 0.85
      roles[i] = 1
    }
    const a = Math.random() * Math.PI * 2
    target[i * 3] = r * Math.cos(b) * Math.cos(a)
    target[i * 3 + 1] = r * Math.sin(b) + 0.15
    target[i * 3 + 2] = r * Math.cos(b) * Math.sin(a)
  }

  // 散点初始位置：球壳内
  for (let i = 0; i < COUNT; i++) {
    const radius = 1.5 + Math.random() * 5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    scatter[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    scatter[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7
    scatter[i * 3 + 2] = radius * Math.cos(phi)
    current[i * 3] = scatter[i * 3]
    current[i * 3 + 1] = scatter[i * 3 + 1]
    current[i * 3 + 2] = scatter[i * 3 + 2]
  }

  function paint(c) {
    const { accent, text } = c
    const a = hexToRgb(accent)
    const t = hexToRgb(text)
    for (let i = 0; i < COUNT; i++) {
      const rgb = roles[i] === 0 ? a : t
      colors[i * 3] = rgb[0] / 255
      colors[i * 3 + 1] = rgb[1] / 255
      colors[i * 3 + 2] = rgb[2] / 255
    }
  }
  paint(themeColors())

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(current, 3).setUsage(THREE.DynamicDrawUsage))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    depthWrite: false
  })

  const group = new THREE.Group()
  const points = new THREE.Points(geo, mat)
  group.add(points)
  scene.add(group)

  // 动画状态机：gather(4s) → hold(5s) → scatter(4s)
  const CYCLE = 13

  return {
    onResize() {},
    update: (t) => {
      const phase = t % CYCLE
      let k = 0.055
      if (phase < 4) {
        k = 0.035 + (phase / 4) * 0.03 // gather 逐渐加速
      } else if (phase < 9) {
        k = 0.03 // hold，保持轻微呼吸
        const breath = 1 + Math.sin(t * 1.4) * 0.035
        group.scale.setScalar(breath)
      } else {
        k = 0.028 // scatter 散开
        group.scale.setScalar(1)
      }
      const to = phase < 9 ? target : scatter
      for (let i = 0; i < current.length; i++) {
        current[i] += (to[i] - current[i]) * k
      }
      geo.attributes.position.needsUpdate = true

      group.rotation.y = t * 0.28 + drag.rotY
      group.rotation.x = 0.25 + Math.sin(t * 0.3) * 0.08
      group.position.y = Math.sin(t * 0.5) * 0.12
    },
    onThemeChange: (c) => {
      paint(c)
      geo.attributes.color.needsUpdate = true
    }
  }
}, drag)

let dragging = false
let lastX = 0

onMounted(() => {
  const zone = el.value
  if (!zone) return
  zone.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
})

onBeforeUnmount(() => {
  const zone = el.value
  if (!zone) return
  zone.removeEventListener('pointerdown', onDown)
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
})

function onDown(e) {
  dragging = true
  lastX = e.clientX
}

function onMove(e) {
  if (!dragging) return
  drag.rotY += (e.clientX - lastX) * 0.012
  lastX = e.clientX
}

function onUp() {
  dragging = false
}
</script>

<template>
  <div ref="el" class="three-zone"></div>
</template>
