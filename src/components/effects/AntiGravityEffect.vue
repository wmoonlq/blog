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
const GROUND_Y = -1.3
const FLOOR = 3.6

// 共享鼠标状态（NDC 坐标），由事件层写入、渲染循环读取
const pointerState = { x: 0, y: 0, active: false }

const el = useThree(({ scene, camera }, state) => {
  camera.position.set(5.5, 5, 7.5)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 1.0)
  dir.position.set(4, 6, 5)
  scene.add(dir)

  // ---- 地面圆环 ----
  const ringGeo = new THREE.RingGeometry(FLOOR - 0.02, FLOOR, 64)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xEAE3DB,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = GROUND_Y
  scene.add(ring)

  // ---- 方块实例 ----
  const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.1 })

  const homes = new Float32Array(COUNT * 3)
  const positions = new Float32Array(COUNT * 3)
  const velocities = new Float32Array(COUNT * 3)
  const spins = new Float32Array(COUNT * 3)
  const spinTargets = new Float32Array(COUNT * 3)
  const accentFlags = new Uint8Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    homes[i * 3] = (Math.random() - 0.5) * FLOOR * 2
    homes[i * 3 + 1] = GROUND_Y + 0.15
    homes[i * 3 + 2] = (Math.random() - 0.5) * FLOOR * 2
    positions[i * 3] = homes[i * 3]
    positions[i * 3 + 1] = GROUND_Y + 3 + Math.random() * 2
    positions[i * 3 + 2] = homes[i * 3 + 2]
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
        const hx = homes[i3] * breathe
        const hz = homes[i3 + 2] * breathe

        const dxm = mx - positions[i3]
        const dzm = mz - positions[i3 + 2]
        const dm = Math.hypot(dxm, dzm)
        let lifted = false

        if (dm < FIELD_R && dm > 0.001) {
          const f = 1 - dm / FIELD_R
          // 反重力：举起 + 径向散开
          velocities[i3 + 1] += LIFT * f
          velocities[i3] += (dxm / dm) * RADIAL * f
          velocities[i3 + 2] += (dzm / dm) * RADIAL * f
          lifted = true
        }

        // 弹簧回 home
        velocities[i3] += (hx - positions[i3]) * SPRING
        velocities[i3 + 1] += (homes[i3 + 1] - positions[i3 + 1]) * SPRING
        velocities[i3 + 2] += (hz - positions[i3 + 2]) * SPRING
        velocities[i3] *= DAMP
        velocities[i3 + 1] *= DAMP
        velocities[i3 + 2] *= DAMP
        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        // 举起时乱转，落回后归位
        if (lifted && Math.random() < 0.08) {
          spinTargets[i3] = (Math.random() - 0.5) * 2.6
          spinTargets[i3 + 1] = (Math.random() - 0.5) * 2.6
          spinTargets[i3 + 2] = (Math.random() - 0.5) * 2.6
        } else if (!lifted) {
          spinTargets[i3] *= 0.97
          spinTargets[i3 + 1] *= 0.97
          spinTargets[i3 + 2] *= 0.97
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
