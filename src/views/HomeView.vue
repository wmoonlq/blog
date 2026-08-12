<script setup>
import { computed } from 'vue'
import { getAllPosts } from '../utils/posts'

const posts = computed(() => getAllPosts())
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">记录与思考</h1>
      <p class="hero-sub">关于前端、设计与技术的随笔</p>
      <router-link class="btn hero-btn" :to="{ name: 'posts-editor' }">写文章</router-link>
    </header>
    <ul class="post-list">
      <li v-for="post in posts" :key="post.slug">
        <router-link class="post-card" :to="{ name: 'post', params: { slug: post.slug } }">
          <time class="post-date">{{ post.date }}</time>
          <h2 class="post-title">{{ post.title }}</h2>
          <div v-if="post.tags.length" class="post-tags">
            <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>
