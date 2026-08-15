<script setup>
import * as THREE from 'three'
import { useThree } from '../../utils/useThree'
import { themeColors } from '../../utils/threeTheme'

const el = useThree(({ scene, camera }) => {
  camera.position.set(0, 0.6, 4.2)
  camera.lookAt(0, 0, 0)

  const { accent } = themeColors()
  const geo = new THREE.TorusKnotGeometry(1.15, 0.34, 220, 32)
  const mat = new THREE.MeshBasicMaterial({
    color: accent,
    wireframe: true,
    transparent: true,
    opacity: 0.85
  })
  const knot = new THREE.Mesh(geo, mat)
  scene.add(knot)

  return {
    update: (t) => {
      knot.rotation.x = t * 0.35
      knot.rotation.y = t * 0.5
    },
    onThemeChange: ({ accent: na }) => {
      mat.color.set(na)
    }
  }
})
</script>

<template>
  <div ref="el" class="three-zone"></div>
</template>
