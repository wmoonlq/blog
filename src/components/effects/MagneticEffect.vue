<script setup>
import { ref } from 'vue'

const zoneRef = ref(null)
const btnRef = ref(null)

function onMove(e) {
  const z = zoneRef.value.getBoundingClientRect()
  const dx = e.clientX - (z.left + z.width / 2)
  const dy = e.clientY - (z.top + z.height / 2)
  btnRef.value.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`
}

function onLeave() {
  btnRef.value.style.transform = 'translate(0, 0)'
}
</script>

<template>
  <div ref="zoneRef" class="magnetic-zone" @mousemove="onMove" @mouseleave="onLeave">
    <button ref="btnRef" class="btn magnetic-btn">悬停我</button>
  </div>
</template>
