<script setup>
import { ref } from 'vue'

const cardRef = ref(null)

function onMove(e) {
  const rect = cardRef.value.getBoundingClientRect()
  const dx = (e.clientX - rect.left) / rect.width - 0.5
  const dy = (e.clientY - rect.top) / rect.height - 0.5
  cardRef.value.style.transform = `perspective(600px) rotateY(${dx * 18}deg) rotateX(${-dy * 18}deg)`
}

function onLeave() {
  cardRef.value.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)'
}
</script>

<template>
  <div class="tilt-zone" @mousemove="onMove" @mouseleave="onLeave">
    <div ref="cardRef" class="tilt-card">
      <p class="tilt-card-title">立体卡片</p>
      <p class="tilt-card-sub">移动光标，感受空间</p>
    </div>
  </div>
</template>
