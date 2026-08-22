<script setup>
import { useRoute } from 'vue-router'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
</script>

<template>
  <div class="page">
    <PageHero
      title="写文章"
      sub="博客文章，保存后自动发布"
    />
    <MarkdownEditor dir="posts" :initial-file="route.query.file" />
  </div>
</template>