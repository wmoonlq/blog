<script setup>
import MarkdownEditor from '../components/MarkdownEditor.vue'
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">写文章</h1>
      <p class="hero-sub">博客文章，保存后自动发布</p>
    </header>
    <MarkdownEditor dir="posts" />
  </div>
</template>
