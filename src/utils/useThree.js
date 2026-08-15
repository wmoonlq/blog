import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { settings } from '../stores/settings'
import { themeColors } from './threeTheme'

export function useThree(factory, extra) {
  const el = ref(null)
  let renderer = null
  let scene = null
  let camera = null
  let raf = null
  let clock = null
  let resizeObserver = null
  let handlers = {}

  onMounted(() => {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.value.appendChild(renderer.domElement)

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.z = 10

    handlers = factory({ scene, camera }, extra) || {}

    function resize() {
      const w = el.value.clientWidth
      const h = el.value.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      if (handlers.onResize) handlers.onResize(w, h)
    }
    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(el.value)

    clock = new THREE.Clock()
    function loop() {
      raf = requestAnimationFrame(loop)
      const t = clock.getElapsedTime()
      if (handlers.update) handlers.update(t)
      renderer.render(scene, camera)
    }
    loop()
  })

  watch(
    () => settings.theme,
    () => {
      if (handlers.onThemeChange) handlers.onThemeChange(themeColors())
    }
  )

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    if (resizeObserver) resizeObserver.disconnect()
    if (renderer) {
      scene && scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
          else o.material.dispose()
        }
      })
      renderer.dispose()
    }
    if (el.value) el.value.innerHTML = ''
  })

  return el
}
