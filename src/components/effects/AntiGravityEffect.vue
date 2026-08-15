<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'

const R = 3.6
const FIELD_R = 4.2
const PUSH = 0.16
const SPRING = 0.05
const DAMP = 0.9

const RED = new THREE.Color(0xB71C1C)
const BLACK = new THREE.Color(0x0A0A0A)

// 共享鼠标状态（NDC 坐标），由事件层写入、渲染循环读取
const pointerState = { x: 0, y: 0, active: false }

const el = useThree(({ scene, camera }, state) => {
  camera.position.set(0, 0, 11)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(0xffffff, 0.55))
  const dir = new THREE.DirectionalLight(0xffffff, 0.9)
  dir.position.set(3, 4, 6)
  scene.add(dir)

  function deg(a) {
    return (a * Math.PI) / 180
  }

  // ---- SVG Path 采样：纹路连续 ----
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
      pts.push(p.x, p.y)
    }
    svgEl.removeChild(path)
    return pts
  }
  function rotatePoint(x, y, ang) {
    const a = deg(ang)
    const c = Math.cos(a)
    const s = Math.sin(a)
    return [x * c - y * s, x * s + y * c]
  }
  function tomoePath(dist, head, tail) {
    const p1 = `${dist} ${-head}`
    const p2 = `${dist} ${head}`
    const d0 = dist - head
    return `M ${p1} A ${head} ${head} 0 1 1 ${p2} C ${d0 - 2} ${head - 2} ${d0 - 12} 6 ${d0 - tail} 0 C ${d0 - 12} -6 ${d0 - 2} ${-head + 2} ${p1} Z`
  }

  // ---- 生成目标点集 [x,y,kind] ----
  const homes = [] // [x, y, isInk]
  const STAR = R * 0.8
  const triAngles = [
    [90, 210, 330],
    [30, 150, 270]
  ]
  for (const angles of triAngles) {
    const vs = angles.map((a) => ({ x: Math.cos(deg(a)) * STAR, y: Math.sin(deg(a)) * STAR }))
    for (let i = 0; i < 3; i++) {
      const p1 = vs[i]
      const p2 = vs[(i + 1) % 3]
      const pts = samplePath(`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`, 26)
      for (let j = 0; j < pts.length; j += 2) homes.push(pts[j], pts[j + 1], 1)
    }
  }
  for (let k = 0; k < 3; k++) {
    const pts = samplePath(tomoePath(R * 0.52, R * 0.15, R * 0.24), 80)
    for (let j = 0; j < pts.length; j += 2) {
      const [rx, ry] = rotatePoint(pts[j], pts[j + 1], 60 + k * 120)
      homes.push(rx, ry, 1)
    }
  }
  const pupil = samplePath(`M ${-R * 0.16} 0 A ${R * 0.16} ${R * 0.16} 0 1 0 ${R * 0.16} 0 A ${R * 0.16} ${R * 0.16} 0 1 0 ${-R * 0.16} 0`, 44)
  for (let j = 0; j < pupil.length; j += 2) homes.push(pupil[j], pupil[j + 1], 1)

  // 红底圆盘方块
  const bgCount = 520
  for (let i = 0; i < bgCount; i++) {
    const r = R * Math.sqrt(Math.random())
    const a = Math.random() * Math.PI * 2
    homes.push(Math.cos(a) * r, Math.sin(a) * r, 0)
  }

  const count = homes.length / 3
  const positions = new Float32Array(count * 3)
  const homeArr = new Float32Array(homes)
  const velocities = new Float32Array(count * 3)
  const spins = new Float32Array(count * 3)
  const spinTargets = new Float32Array(count * 3)
  const disp = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const x = homes[i * 3]
    const y = homes[i * 3 + 1]
    const r = 1.5 + Math.random() * 4
    const a = Math.random() * Math.PI * 2
    positions[i * 3] = x + Math.cos(a) * r * 0.8
    positions[i * 3 + 1] = y + Math.sin(a) * r * 0.8
    positions[i * 3 + 2] = 0
  }

  // ---- InstancedMesh 方块 ----
  const geo = new THREE.BoxGeometry(0.16, 0.16, 0.1)
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.08 })
  const mesh = new THREE.InstancedMesh(geo, mat, count)
  const dummy = new THREE.Object3D()
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const isInk = homes[i * 3 + 2] === 1
    mesh.setColorAt(i, isInk ? BLACK : RED)
  }
  mesh.instanceColor.needsUpdate = true

  const group = new THREE.Group()
  group.add(mesh)
  scene.add(group)

  let rot = 0
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const mouse3D = new THREE.Vector3()
  let mouseX = 1e6
  let mouseY = 1e6

  return {
    update: (t) => {
      rot += 0.0035
      const breathe = 1 + Math.sin(t * 0.5) * 0.015
      group.rotation.z = rot

      // 鼠标在 z=0 平面的世界坐标
      if (state.active) {
        pointer.set(state.x, state.y)
        raycaster.setFromCamera(pointer, camera)
        if (raycaster.ray.intersectPlane(plane, mouse3D)) {
          mouseX = mouse3D.x
          mouseY = mouse3D.y
        }
      } else {
        mouseX = 1e6
        mouseY = 1e6
      }

      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const hx = homeArr[i3]
        const hy = homeArr[i3 + 1]
        const tx = hx * breathe
        const ty = hy * breathe

        // 反重力场
        const dxm = mouseX - positions[i3]
        const dym = mouseY - positions[i3 + 1]
        const dm = Math.hypot(dxm, dym)
        let disturbed = false
        if (dm < FIELD_R && dm > 0.001) {
          const f = (1 - dm / FIELD_R) * PUSH
          velocities[i3] += (dxm / dm) * f
          velocities[i3 + 1] += (dym / dm) * f
          velocities[i3 + 2] += 0.02
          disturbed = true
        }

        // 弹簧回弹
        velocities[i3] += (tx - positions[i3]) * SPRING
        velocities[i3 + 1] += (ty - positions[i3 + 1]) * SPRING
        velocities[i3 + 2] += (0 - positions[i3 + 2]) * SPRING
        velocities[i3] *= DAMP
        velocities[i3 + 1] *= DAMP
        velocities[i3 + 2] *= DAMP
        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        disp[i] = Math.hypot(tx - positions[i3], ty - positions[i3 + 1])

        // 扰动时自转，回弹后归位
        if (disturbed && Math.random() < 0.06) {
          spinTargets[i3] = (Math.random() - 0.5) * 2.2
          spinTargets[i3 + 1] = (Math.random() - 0.5) * 2.2
          spinTargets[i3 + 2] = (Math.random() - 0.5) * 2.2
        } else if (!disturbed) {
          spinTargets[i3] *= 0.97
          spinTargets[i3 + 1] *= 0.97
          spinTargets[i3 + 2] *= 0.97
        }
        spins[i3] += (spinTargets[i3] - spins[i3]) * 0.12
        spins[i3 + 1] += (spinTargets[i3 + 1] - spins[i3 + 1]) * 0.12
        spins[i3 + 2] += (spinTargets[i3 + 2] - spins[i3 + 2]) * 0.12

        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2])
        dummy.rotation.set(spins[i3], spins[i3 + 1], spins[i3 + 2])
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true

      // 受扰方块变亮（视觉反馈）
      if (mesh.instanceColor) {
        for (let i = 0; i < count; i++) {
          const isInk = homeArr[i * 3 + 2] === 1
          if (disp[i] > 0.35) {
            color.copy(isInk ? BLACK : RED).multiplyScalar(1.35)
          } else {
            color.copy(isInk ? BLACK : RED)
          }
          mesh.setColorAt(i, color)
        }
        mesh.instanceColor.needsUpdate = true
      }
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
