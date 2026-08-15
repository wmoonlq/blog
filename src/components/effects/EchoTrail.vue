<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const zoneRef = ref(null)
const chars = 'wmoonlq · 记录与思考'

let index = 0
let last = 0
let spawned = 0

function onMove(e) {
  const now = performance.now()
  if (now - last < 90 || spawned > 26) return
  last = now
  const zone = zoneRef.value
  const rect = zone.getBoundingClientRect()
  const el = document.createElement('span')
  el.className = 'echo-char'
  el.textContent = chars[index % chars.length]
  el.style.left = `${e.clientX - rect.left}px`
  el.style.top = `${e.clientY - rect.top}px`
  el.style.transform = `rotate(${(index % 3) - 1}deg)`
  zone.appendChild(el)
  index++
  spawned++
  requestAnimationFrame(() => el.classList.add('rise'))
  setTimeout(() => {
    el.remove()
    spawned--
  }, 1500)
}

onMounted(() => zoneRef.value?.addEventListener('mousemove', onMove))
onBeforeUnmount(() => zoneRef.value?.removeEventListener('mousemove', onMove))
</script>

<template>
  <div ref="zoneRef" class="echo-zone"></div>
</template>
