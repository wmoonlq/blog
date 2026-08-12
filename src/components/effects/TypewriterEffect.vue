<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const phrases = [
  '少即是多。',
  '排版是设计的第一语言。',
  '留白也是内容。',
  '克制不是不做，而是知道什么不该做。'
]

const text = ref('')
let index = 0
let count = 0
let deleting = false
let timer = null

function tick() {
  const current = phrases[index]
  if (!deleting) {
    count++
    text.value = current.slice(0, count)
    if (count === current.length) {
      deleting = true
      timer = setTimeout(tick, 1600)
    } else {
      timer = setTimeout(tick, 90)
    }
  } else {
    count--
    text.value = current.slice(0, count)
    if (count === 0) {
      deleting = false
      index = (index + 1) % phrases.length
      timer = setTimeout(tick, 500)
    } else {
      timer = setTimeout(tick, 40)
    }
  }
}

onMounted(() => {
  timer = setTimeout(tick, 400)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <p class="typewriter-text">
    <span>{{ text }}</span><span class="cursor">|</span>
  </p>
</template>
