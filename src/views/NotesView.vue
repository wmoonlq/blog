<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAllNotes } from '../utils/notes'
import { renderMarkdown } from '../utils/markdown'
import { relativeTime, monthLabel } from '../utils/format'

const route = useRoute()
const notes = computed(() => getAllNotes())

const expanded = ref(new Set())
const noteEls = ref([])

const byMonth = computed(() => {
  const groups = new Map()
  notes.value.forEach((n) => {
    const key = (n.date || '').slice(0, 7)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(n)
  })
  return [...groups.entries()]
})

function render(content) {
  return renderMarkdown(content)
}

function toggleExpand(slug) {
  const next = new Set(expanded.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  expanded.value = next
}

const isExpanded = (slug) => expanded.value.has(slug)

function scrollToNote(slug) {
  const el = noteEls.value.find((x) => x && x.dataset.slug === slug)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('flash')
    setTimeout(() => el.classList.remove('flash'), 2000)
  }
}

const jumpTo = computed(() => route.query.q || route.query.n || '')

watch(
  jumpTo,
  async (val) => {
    if (!val) return
    await nextTick()
    scrollToNote(val)
  },
  { immediate: true }
)
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">随笔</h1>
      <p class="hero-sub">随手记下的碎片 · {{ notes.length }} 篇</p>
      <router-link class="btn hero-btn" :to="{ name: 'notes-editor' }">写随笔</router-link>
    </header>

    <div v-if="notes.length">
      <section v-for="[month, list] in byMonth" :key="month" class="month-group">
        <h2 class="month-label">{{ monthLabel(month) }}</h2>
        <ul class="note-list">
          <li v-for="note in list" :key="note.slug">
            <article
              :ref="(el) => noteEls.push(el)"
              :data-slug="note.slug"
              class="note-card"
            >
              <div class="note-head">
                <time class="note-date">{{ note.date }}<span class="note-relative"> · {{ relativeTime(note.date) }}</span></time>
                <router-link
                  class="edit-link"
                  :to="{ name: 'notes-editor', query: { file: `${note.slug}.md` } }"
                >编辑</router-link>
              </div>
              <h2 v-if="note.title" class="note-title">{{ note.title }}</h2>
              <div class="prose note-content" :class="{ clamp: !isExpanded(note.slug) }" v-html="render(note.content)"></div>
              <button v-if="note.content.length > 260" class="note-more" @click="toggleExpand(note.slug)">
                {{ isExpanded(note.slug) ? '收起 ▴' : '展开 ▾' }}
              </button>
            </article>
          </li>
        </ul>
      </section>
    </div>
    <p v-else class="hero-sub" style="padding: 96px 0">还没有随笔。</p>
  </div>
</template>
