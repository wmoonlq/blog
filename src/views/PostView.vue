<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPostBySlug } from '../utils/posts'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const post = computed(() => getPostBySlug(route.params.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))
</script>

<template>
  <div class="page">
    <article v-if="post">
      <router-link class="back" :to="{ name: 'home' }">← 全部文章</router-link>
      <header class="article-head">
        <h1 class="article-title">{{ post.title }}</h1>
        <div class="article-meta">
          <time>{{ post.date }}</time>
          <span v-for="tag in post.tags" :key="tag" class="article-tag">{{ tag }}</span>
        </div>
      </header>
      <div class="prose" v-html="html"></div>
    </article>
    <p v-else class="hero-sub" style="padding: 96px 0">文章不存在。</p>
  </div>
</template>
