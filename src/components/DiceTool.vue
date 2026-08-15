<script setup>
import { ref, onBeforeUnmount } from 'vue'

const faces = [
  [4],
  [0, 8],
  [0, 4, 8],
  [0, 2, 6, 8],
  [0, 2, 4, 6, 8],
  [0, 2, 3, 5, 6, 8]
]

const value = ref(1)
const rolling = ref(false)
const history = ref([])
let interval = null

function roll() {
  if (rolling.value) return
  rolling.value = true
  let count = 0
  interval = setInterval(() => {
    value.value = 1 + Math.floor(Math.random() * 6)
    count++
    if (count > 12) {
      clearInterval(interval)
      interval = null
      rolling.value = false
      history.value.unshift(value.value)
      if (history.value.length > 8) history.value.pop()
    }
  }, 70)
}

onBeforeUnmount(() => clearInterval(interval))
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">骰子</h2>
      <span class="score-item">历史 <strong>{{ history.length }}</strong> 次</span>
    </div>
    <div class="dice-body">
      <div class="dice" :class="{ rolling }">
        <span
          v-for="i in 9"
          :key="i"
          class="dice-dot"
          :class="{ on: faces[value - 1].includes(i - 1) }"
        ></span>
      </div>
      <div class="dice-ctrl">
        <button class="btn" :disabled="rolling" @click="roll">{{ rolling ? '掷骰中…' : '掷骰子' }}</button>
      </div>
      <div v-if="history.length" class="dice-history">
        <span v-for="(h, i) in history" :key="i" class="dice-history-item">{{ h }}</span>
      </div>
    </div>
  </section>
</template>
