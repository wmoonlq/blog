<script setup>
import { computed } from 'vue'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { relativeTime } from '../utils/format'

const timeline = computed(() => {
  const posts = getAllPosts().map((p) => ({ ...p, kind: 'post' }))
  const notes = getAllNotes().map((n) => ({ ...n, kind: 'note' }))
  return [...posts, ...notes]
    .filter((x) => x.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">时间线</h1>
      <p class="hero-sub">文章与随笔，按时间排成一列 · {{ timeline.length }} 条</p>
    </header>
    <div class="timeline">
      <div v-for="item in timeline" :key="`${item.kind}-${item.slug}`" class="timeline-item">
        <span class="timeline-kind">{{ item.kind === 'post' ? '文章' : '随笔' }}</span>
        <router-link
          v-if="item.kind === 'post'"
          class="timeline-link"
          :to="{ name: 'post', params: { slug: item.slug } }"
        >{{ item.title }}</router-link>
        <router-link v-else class="timeline-link" :to="{ name: 'notes' }">
          {{ item.title || '（未命名随笔）' }}
        </router-link>
        <p class="timeline-date">{{ item.date }} · {{ relativeTime(item.date) }}</p>
      </div>
    </div>
  </div>
</template>
