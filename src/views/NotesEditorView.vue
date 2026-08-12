<script setup>
import { useRoute } from 'vue-router'
import MarkdownEditor from '../components/MarkdownEditor.vue'

const route = useRoute()
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">写随笔</h1>
      <p class="hero-sub">随手记下的碎片，保存后自动发布</p>
    </header>
    <MarkdownEditor dir="notes" :initial-file="route.query.file" />
  </div>
</template>
