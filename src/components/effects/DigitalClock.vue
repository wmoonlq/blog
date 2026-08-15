<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const now = ref(new Date())
let timer = null

function pad(n) {
  return String(n).padStart(2, '0')
}

onMounted(() => {
  now.value = new Date()
  timer = setInterval(() => (now.value = new Date()), 1000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="clock">
    <p class="clock-time">{{ pad(now.getHours()) }}<span class="clock-colon">:</span>{{ pad(now.getMinutes()) }}<span class="clock-colon">:</span>{{ pad(now.getSeconds()) }}</p>
    <p class="clock-date">{{ now.getFullYear() }} / {{ pad(now.getMonth() + 1) }} / {{ pad(now.getDate()) }} · 星期{{ '日一二三四五六'[now.getDay()] }}</p>
  </div>
</template>
