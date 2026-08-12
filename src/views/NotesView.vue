<script setup>
import { computed } from 'vue'
import { getAllNotes } from '../utils/notes'
import { renderMarkdown } from '../utils/markdown'

const notes = computed(() => getAllNotes())

function render(content) {
  return renderMarkdown(content)
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">随笔</h1>
      <p class="hero-sub">随手记下的碎片</p>
      <router-link class="btn hero-btn" :to="{ name: 'notes-editor' }">写随笔</router-link>
    </header>
    <ul class="note-list">
      <li v-for="note in notes" :key="note.slug" class="note-card">
        <time class="note-date">{{ note.date }}</time>
        <h2 v-if="note.title" class="note-title">{{ note.title }}</h2>
        <div class="prose note-content" v-html="render(note.content)"></div>
      </li>
    </ul>
  </div>
</template>
