<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const progress = ref(0)

function onScroll() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  progress.value = total > 0 ? doc.scrollTop / total : 0
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="scroll-progress" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>
</template>
