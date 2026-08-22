<script setup>
import { useRoute } from 'vue-router'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import PageHero from '../components/PageHero.vue'

const route = useRoute()
</script>

<template>
  <div class="page">
    <PageHero
      title="写随笔"
      sub="随手记下的碎片，保存后自动发布"
    />
    <MarkdownEditor dir="notes" :initial-file="route.query.file" />
  </div>
</template>