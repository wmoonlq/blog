<script setup>
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { themeColors } from '../../utils/threeTheme'

const el = useThree(({ scene, camera }) => {
  camera.position.z = 10

  const SIZE = 6
  const SEG = 40
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
  const base = geo.attributes.position.array.slice()

  const { text } = themeColors()
  const mat = new THREE.LineBasicMaterial({ color: text, transparent: true, opacity: 0.55 })
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), mat)
  scene.add(wire)

  return {
    update: (t) => {
      const arr = geo.attributes.position.array
      for (let i = 0; i < arr.length; i += 3) {
        const bx = base[i]
        const by = base[i + 1]
        arr[i + 2] =
          Math.sin(bx * 1.6 + t * 1.4) * 0.45 +
          Math.cos(by * 1.6 + t * 1.1) * 0.45
      }
      geo.attributes.position.needsUpdate = true
      geo.computeVertexNormals()
      wire.rotation.x = Math.PI / 2.6
      wire.rotation.z = t * 0.12
    },
    onThemeChange: ({ text: nt }) => {
      mat.color.set(nt)
    }
  }
})
</script>

<template>
  <div ref="el" class="three-zone"></div>
</template>
