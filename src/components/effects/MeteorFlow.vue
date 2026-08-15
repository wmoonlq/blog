<script setup>
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { hexToRgb, themeColors } from '../../utils/threeTheme'

const el = useThree(({ scene, camera }) => {
  camera.position.z = 9

  const COUNT = 260
  const positions = new Float32Array(COUNT * 3)
  const speeds = []

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = 2 + Math.random() * 5
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
    speeds.push(0.03 + Math.random() * 0.05)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const { accent, text } = themeColors()
  const a = hexToRgb(accent)
  const t = hexToRgb(text)

  const colors = new Float32Array(COUNT * 3)
  for (let i = 0; i < COUNT; i++) {
    const c = Math.random() < 0.15 ? a : t
    colors[i * 3] = c[0] / 255
    colors[i * 3 + 1] = c[1] / 255
    colors[i * 3 + 2] = c[2] / 255
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  })

  const stars = new THREE.Points(geo, mat)
  scene.add(stars)

  return {
    update: (t) => {
      const arr = geo.attributes.position.array
      for (let i = 0; i < COUNT; i++) {
        arr[i * 3 + 1] -= speeds[i]
        if (arr[i * 3 + 1] < -3) {
          arr[i * 3] = (Math.random() - 0.5) * 10
          arr[i * 3 + 1] = 2 + Math.random() * 5
          arr[i * 3 + 2] = (Math.random() - 0.5) * 5
        }
      }
      geo.attributes.position.needsUpdate = true
      stars.rotation.y = Math.sin(t * 0.1) * 0.15
    },
    onThemeChange: ({ accent: na, text: nt }) => {
      const na2 = hexToRgb(na)
      const nt2 = hexToRgb(nt)
      const col = geo.attributes.color
      for (let i = 0; i < COUNT; i++) {
        const c = Math.random() < 0.15 ? na2 : nt2
        col.array[i * 3] = c[0] / 255
        col.array[i * 3 + 1] = c[1] / 255
        col.array[i * 3 + 2] = c[2] / 255
      }
      col.needsUpdate = true
    }
  }
})
</script>

<template>
  <div ref="el" class="three-zone"></div>
</template>
