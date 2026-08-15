<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { excerpt } from '../utils/format'

const router = useRouter()
const pool = computed(() => [...getAllPosts(), ...getAllNotes()])
const result = ref(null)
const spinning = ref(false)

function randomPick() {
  if (!pool.value.length) return
  spinning.value = true
  let ticks = 0
  const iv = setInterval(() => {
    result.value = pool.value[Math.floor(Math.random() * pool.value.length)]
    ticks++
    if (ticks > 14) {
      clearInterval(iv)
      spinning.value = false
    }
  }, 60)
}

function go() {
  if (!result.value) return
  if (result.value.tags) {
    router.push({ name: 'post', params: { slug: result.value.slug } })
  } else {
    router.push({ name: 'notes' })
  }
}
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">随机一篇</h2>
      <span class="score-item">共 <strong>{{ pool.length }}</strong> 篇内容</span>
    </div>
    <div class="random-body">
      <div v-if="result" class="random-result" :class="{ spinning }">
        <span class="random-kind">{{ result.tags ? '文章' : '随笔' }}</span>
        <h3 class="random-title">{{ result.title || '随笔' }}</h3>
        <p v-if="result.tags" class="random-excerpt">{{ excerpt(result.content, 64) }}</p>
      </div>
      <p v-else class="random-hint">不知道读什么？让命运替你决定。</p>
      <div class="random-ctrl">
        <button class="btn" :disabled="spinning" @click="randomPick">
          {{ spinning ? '抽选中…' : '随 机 一 篇' }}
        </button>
        <button v-if="result" class="btn" @click="go">去读 →</button>
      </div>
    </div>
  </section>
</template>
