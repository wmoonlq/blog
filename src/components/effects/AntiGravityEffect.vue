<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { hexToRgb, themeColors } from '../../utils/threeTheme'

const COUNT = 380
const FIELD_R = 2.6
const LIFT = 0.14
const RADIAL = 0.1
const SPRING = 0.06
const DAMP = 0.9

// 共享鼠标状态（NDC 坐标），由事件层写入、渲染循环读取
const pointerState = { x: 0, y: 0, active: false }

const el = useThree(({ scene, camera }, state) => {
  camera.position.set(0, 1.2, 8)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 1.0)
  dir.position.set(4, 6, 5)
  scene.add(dir)

  // ---- 方块实例 ----
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 })

  const homes = new Float32Array(COUNT * 3)
  const positions = new Float32Array(COUNT * 3)
  const velocities = new Float32Array(COUNT * 3)
  const spins = new Float32Array(COUNT * 3)
  const spinTargets = new Float32Array(COUNT * 3)
  const phases = new Float32Array(COUNT) // 漂浮相位
  const driftX = new Float32Array(COUNT) // 漂移幅度/速度
  const driftZ = new Float32Array(COUNT)
  const accentFlags = new Uint8Array(COUNT)

  // 悬浮轨道：分布在立方体空间内，带漂浮参数
  const SPAN = 3.4
  for (let i = 0; i < COUNT; i++) {
    homes[i * 3] = (Math.random() - 0.5) * SPAN * 2
    homes[i * 3 + 1] = (Math.random() - 0.5) * SPAN
    homes[i * 3 + 2] = (Math.random() - 0.5) * SPAN * 2
    positions[i * 3] = homes[i * 3]
    positions[i * 3 + 1] = homes[i * 3 + 1]
    positions[i * 3 + 2] = homes[i * 3 + 2]
    phases[i] = Math.random() * Math.PI * 2
    driftX[i] = 0.15 + Math.random() * 0.3
    driftZ[i] = 0.15 + Math.random() * 0.3
    accentFlags[i] = Math.random() < 0.38 ? 1 : 0
  }

  const mesh = new THREE.InstancedMesh(geo, mat, COUNT)
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()

  let curAccent = ''
  let curText = ''

  function paint(c) {
    curAccent = c.accent
    curText = c.text
    if (mesh.instanceColor) {
      for (let i = 0; i < COUNT; i++) {
        color.set(accentFlags[i] ? c.accent : c.text)
        mesh.setColorAt(i, color)
      }
      mesh.instanceColor.needsUpdate = true
    }
  }
  paint(themeColors())

  const group = new THREE.Group()
  group.add(mesh)
  scene.add(group)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const mouse3D = new THREE.Vector3()
  let mx = 1e6
  let mz = 1e6

  return {
    update: (t) => {
      // 鼠标投影到 y=0 平面（世界坐标 x/z）
      if (state.active) {
        pointer.set(state.x, state.y)
        raycaster.setFromCamera(pointer, camera)
        if (raycaster.ray.intersectPlane(plane, mouse3D)) {
          mx = mouse3D.x
          mz = mouse3D.z
        }
      } else {
        mx = 1e6
        mz = 1e6
      }

      const breathe = 1 + Math.sin(t * 0.4) * 0.02
      group.rotation.y = Math.sin(t * 0.06) * 0.06

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        // 漂浮目标：home + 正弦浮动/漂移
        const ph = phases[i]
        const f1 = Math.sin(t * 0.5 + ph)
        const f2 = Math.sin(t * 0.34 + ph * 1.7)
        const f3 = Math.cos(t * 0.42 + ph * 0.9)
        const tx = homes[i3] * breathe + f1 * driftX[i]
        const tz = homes[i3 + 2] * breathe + f2 * driftZ[i]
        const ty = homes[i3 + 1] + f3 * 0.22

        const dxm = mx - positions[i3]
        const dzm = mz - positions[i3 + 2]
        const dm = Math.hypot(dxm, dzm)
        let lifted = false

        if (dm < FIELD_R && dm > 0.001) {
          const f = 1 - dm / FIELD_R
          // 反重力：推开 + 上浮 + 扰乱
          velocities[i3] += (dxm / dm) * RADIAL * f
          velocities[i3 + 2] += (dzm / dm) * RADIAL * f
          velocities[i3 + 1] += LIFT * f
          lifted = true
        }

        // 弹簧回漂浮轨道
        velocities[i3] += (tx - positions[i3]) * SPRING
        velocities[i3 + 1] += (ty - positions[i3 + 1]) * SPRING
        velocities[i3 + 2] += (tz - positions[i3 + 2]) * SPRING
        velocities[i3] *= DAMP
        velocities[i3 + 1] *= DAMP
        velocities[i3 + 2] *= DAMP
        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        // 举起时乱转，回轨后缓慢自转（漂浮感）
        if (lifted && Math.random() < 0.08) {
          spinTargets[i3] = (Math.random() - 0.5) * 3
          spinTargets[i3 + 1] = (Math.random() - 0.5) * 3
          spinTargets[i3 + 2] = (Math.random() - 0.5) * 3
        } else if (!lifted) {
          // 常态：微幅慢转
          spinTargets[i3] = Math.sin(t * 0.3 + ph) * 0.25
          spinTargets[i3 + 1] = Math.cos(t * 0.26 + ph * 1.3) * 0.25
          spinTargets[i3 + 2] = Math.sin(t * 0.22 + ph * 0.7) * 0.25
        }
        spins[i3] += (spinTargets[i3] - spins[i3]) * 0.14
        spins[i3 + 1] += (spinTargets[i3 + 1] - spins[i3 + 1]) * 0.14
        spins[i3 + 2] += (spinTargets[i3 + 2] - spins[i3 + 2]) * 0.14

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2])
        dummy.rotation.set(spins[i3], spins[i3 + 1], spins[i3 + 2])
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
    onThemeChange: (c) => {
      paint(c)
    }
  }
}, pointerState)

// ---- 鼠标/触摸事件（写入共享状态） ----
onMounted(() => {
  const zone = el.value
  if (!zone) return
  zone.addEventListener('pointermove', zonePointer)
  zone.addEventListener('pointerleave', zoneLeave)
  zone.addEventListener('touchmove', zonePointer, { passive: true })
  zone.addEventListener('touchend', zoneLeave)
})

onBeforeUnmount(() => {
  const zone = el.value
  if (!zone) return
  zone.removeEventListener('pointermove', zonePointer)
  zone.removeEventListener('pointerleave', zoneLeave)
  zone.removeEventListener('touchmove', zonePointer)
  zone.removeEventListener('touchend', zoneLeave)
})

function zonePointer(e) {
  const rect = el.value.getBoundingClientRect()
  pointerState.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  pointerState.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  pointerState.active = true
}

function zoneLeave() {
  pointerState.active = false
}
</script>

<template>
  <div ref="el" class="three-zone"></div>
</template>
