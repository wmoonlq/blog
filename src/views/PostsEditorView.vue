<script setup>
import { useRoute } from 'vue-router'
import MarkdownEditor from '../components/MarkdownEditor.vue'

const route = useRoute()
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">写文章</h1>
      <p class="hero-sub">博客文章，保存后自动发布</p>
    </header>
    <MarkdownEditor dir="posts" :initial-file="route.query.file" />
  </div>
</template>
