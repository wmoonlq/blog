<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const sentences = ['字符次第浮现，像呼吸一样。', '每一行文字，都有它的节奏。']

const sentence = ref('')
const shown = ref(0)
let index = 0
let timer = null

function play() {
  sentence.value = sentences[index % sentences.length]
  shown.value = 0
  let count = 0
  const iv = setInterval(() => {
    count++
    shown.value = count
    if (count >= sentence.value.length) {
      clearInterval(iv)
      timer = setTimeout(() => {
        index++
        shown.value = 0
        timer = setTimeout(play, 500)
      }, 1600)
    }
  }, 45)
}

onMounted(() => {
  timer = setTimeout(play, 400)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <p class="char-reveal">
    <span v-for="(c, i) in sentence.split('')" :key="i" :class="{ on: i < shown }">{{ c }}</span>
  </p>
</template>
