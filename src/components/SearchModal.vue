<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { stripMarkdown, relativeTime } from '../utils/format'

const router = useRouter()
const open = ref(false)
const query = ref('')
const selected = ref(0)
const inputRef = ref(null)

const posts = getAllPosts()
const notes = getAllNotes()

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlight(text, q) {
  const escaped = escapeHtml(text)
  if (!q) return escaped
  const pattern = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  try {
    return escaped.replace(new RegExp(`(${pattern})`, 'gi'), '<mark>$1</mark>')
  } catch {
    return escaped
  }
}

const index = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const hit = (text) => text.toLowerCase().includes(q)
  const score = (p) => {
    let s = 0
    if (p.title.toLowerCase().includes(q)) s += 100
    if (p.title.toLowerCase().startsWith(q)) s += 50
    if ((p.tags || []).join(' ').toLowerCase().includes(q)) s += 40
    if (hit(stripMarkdown(p.content))) s += 10
    return s
  }
  const postResults = posts
    .filter((p) => hit(p.title) || hit((p.tags || []).join(' ')) || hit(stripMarkdown(p.content)))
    .map((p) => ({ kind: 'post', score: score(p), ...p }))
  const noteResults = notes
    .filter((n) => hit(n.title || '') || hit(stripMarkdown(n.content)))
    .map((n) => ({ kind: 'note', score: score(n), ...n }))
  return [...postResults, ...noteResults]
    .sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1))
    .slice(0, 12)
})

const active = computed(() => index.value[selected.value] || null)

function openModal() {
  open.value = true
  query.value = ''
  selected.value = 0
  nextTick(() => inputRef.value && inputRef.value.focus())
}

function closeModal() {
  open.value = false
}

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openModal()
  }
  if (e.key === '/' && !isTyping(e.target)) {
    e.preventDefault()
    openModal()
  }
  if (e.key === 'Escape') closeModal()
}

function isTyping(el) {
  if (!el || !el.tagName) return false
  const t = el.tagName.toLowerCase()
  return t === 'input' || t === 'textarea' || el.isContentEditable
}

function onListKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selected.value = Math.min(selected.value + 1, index.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selected.value = Math.max(selected.value - 1, 0)
  } else if (e.key === 'Enter' && active.value) {
    go(active.value)
  }
}

function go(item) {
  closeModal()
  if (item.kind === 'post') {
    router.push({ name: 'post', params: { slug: item.slug } })
  } else {
    router.push({ name: 'notes', query: { n: item.slug } })
  }
}

watch(open, (v) => {
  if (!v) query.value = ''
})

function onOpenSearch() {
  openModal()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('open-search', onOpenSearch)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('open-search', onOpenSearch)
})
</script>

<template>
  <transition name="modal-fade">
    <div v-if="open" class="search-backdrop" @click.self="closeModal">
      <div class="search-panel" role="dialog" aria-label="搜索">
        <div class="search-box">
          <span class="search-glyph">⌕</span>
          <input
            ref="inputRef"
            v-model="query"
            class="search-input"
            placeholder="搜索文章与随笔…（Esc 关闭）"
            @keydown="onListKeydown"
          />
          <span class="search-hint">Ctrl K</span>
        </div>
        <div class="search-results">
          <p v-if="!query" class="search-empty">输入关键词，跨站搜索文章与随笔</p>
          <p v-else-if="!index.length" class="search-empty">没有找到「{{ query }}」相关的内容</p>
          <div
            v-for="(item, i) in index"
            :key="`${item.kind}-${item.slug}`"
            class="search-item"
            :class="{ on: i === selected }"
            @mouseenter="selected = i"
            @click="go(item)"
          >
            <span class="search-item-kind">{{ item.kind === 'post' ? '文' : '笔' }}</span>
            <div class="search-item-main">
              <div class="search-item-title" v-html="highlight(item.title || '随笔', query)"></div>
              <div class="search-item-excerpt" v-html="highlight(stripMarkdown(item.content).slice(0, 48), query)"></div>
            </div>
            <time class="search-item-date">{{ relativeTime(item.date) }}</time>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>