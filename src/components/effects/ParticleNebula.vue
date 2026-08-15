<script setup>
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { hexToRgb, themeColors } from '../../utils/threeTheme'

const el = useThree(({ scene, camera }) => {
  camera.position.z = 9

  const COUNT = 900
  const positions = new Float32Array(COUNT * 3)
  const colors = new Float32Array(COUNT * 3)
  const speeds = []

  const { accent, text } = themeColors()
  const a = hexToRgb(accent)
  const t = hexToRgb(text)

  for (let i = 0; i < COUNT; i++) {
    const radius = 1.5 + Math.random() * 4.5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6
    positions[i * 3 + 2] = radius * Math.cos(phi)
    const accentish = Math.random() < 0.18
    const c = accentish ? a : t
    colors[i * 3] = c[0] / 255
    colors[i * 3 + 1] = c[1] / 255
    colors[i * 3 + 2] = c[2] / 255
    speeds.push(0.02 + Math.random() * 0.06)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const mat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geo, mat)
  scene.add(points)

  return {
    update: (t) => {
      const spin = 0.05 + Math.sin(t * 0.5) * 0.03
      points.rotation.y = t * spin
      points.rotation.x = Math.sin(t * 0.2) * 0.12
    },
    onThemeChange: ({ accent: na, text: nt }) => {
      const na2 = hexToRgb(na)
      const nt2 = hexToRgb(nt)
      const col = geo.attributes.color
      for (let i = 0; i < COUNT; i++) {
        const accentish = Math.random() < 0.18
        const c = accentish ? na2 : nt2
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
