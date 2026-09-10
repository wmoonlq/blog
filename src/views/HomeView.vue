<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { readingTime } from '../utils/format'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const BASE = import.meta.env.BASE_URL
const posts = computed(() => getAllPosts())
const notes = computed(() => getAllNotes())

const query = ref('')
const activeTag = ref('')
const layoutEl = ref(null)

onMounted(() => {
  if (route.query.tag) activeTag.value = route.query.tag
})

watch(
  () => route.query.tag,
  (tag) => {
    if (tag) activeTag.value = tag
  }
)

const allTags = computed(() => {
  const set = new Set()
  posts.value.forEach((p) => p.tags.forEach((t) => set.add(t)))
  return [...set]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return posts.value.filter((p) => {
    if (activeTag.value && !p.tags.includes(activeTag.value)) return false
    if (!q) return true
    return (
      p.title.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.excerpt.toLowerCase().includes(q)
    )
  })
})

const heroStats = computed(() => [
  { n: posts.value.length, label: '篇文章' },
  { n: notes.value.length, label: '篇随笔' },
  { n: allTags.value.length, label: '个标签' }
])

const daysSince = computed(() => {
  const start = new Date('2026-08-01T00:00:00')
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000))
})

function coverSrc(p) {
  return p.cover ? BASE + p.cover : ''
}

function pickTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
  layoutEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="page">
    <section
      class="home-hero"
      :style="{ backgroundImage: `url(${BASE}bg/bg-1786809364416.png)` }"
    >
      <div class="home-hero-inner">
        <p class="home-hero-overline">WMONLQ · BLOG</p>
        <h1 class="hero-title">记录与思考</h1>
        <p class="hero-sub">关于前端、设计与技术的随笔</p>
        <div class="hero-stats">
          <template v-for="(s, i) in heroStats" :key="i">
            <span v-if="i" class="hero-stats-dot">·</span>
            <span>{{ s.n }} {{ s.label }}</span>
          </template>
        </div>
      </div>
    </section>

    <div ref="layoutEl" class="home-layout">
      <main class="home-main">
        <div class="search-box home-search">
          <span class="search-glyph">⌕</span>
          <input
            v-model="query"
            class="search-input"
            placeholder="在文章中搜索…"
            aria-label="搜索文章"
          />
        </div>

        <template v-if="filtered.length">
          <article v-for="post in filtered" :key="post.slug" class="cover-card">
            <router-link
              class="cover-card-link"
              :to="{ name: 'post', params: { slug: post.slug } }"
            >
              <div class="cover-thumb" :class="{ 'cover-thumb--none': !post.cover }">
                <img
                  v-if="post.cover"
                  :src="coverSrc(post)"
                  :alt="post.title"
                  loading="lazy"
                  decoding="async"
                />
                <span v-else class="cover-thumb-fallback">{{ post.title.slice(0, 1) }}</span>
              </div>
              <div class="cover-body">
                <div class="cover-title-row">
                  <span v-if="post.pinned" class="pin-badge">置顶</span>
                  <h3 class="cover-title">{{ post.title }}</h3>
                </div>
                <p class="card-meta">
                  <span>发表于 {{ post.date }}</span>
                  <template v-if="post.updated && post.updated !== post.date">
                    <span class="card-meta-sep">·</span>
                    <span>更新于 {{ post.updated }}</span>
                  </template>
                  <span class="card-meta-sep">·</span>
                  <span>{{ readingTime(post.content) }} 分钟读完</span>
                </p>
                <div v-if="post.category || post.tags.length" class="cover-tags">
                  <span v-if="post.category" class="chip chip-category">{{ post.category }}</span>
                  <span
                    v-for="tag in post.tags"
                    :key="tag"
                    class="chip"
                    :title="`筛选「${tag}」`"
                    @click.prevent.stop="pickTag(tag)"
                  >{{ tag }}</span>
                </div>
                <p v-if="post.excerpt" class="card-excerpt">{{ post.excerpt }}</p>
              </div>
            </router-link>
          </article>
        </template>

        <EmptyState
          v-else
          :text="query || activeTag ? '没有找到匹配的内容' : '还没有文章'"
          :sub="activeTag ? `换个标签试试，或清除「${activeTag}」筛选` : query ? '换个关键词试试' : '在 src/posts/ 新建 Markdown 文件即可发布'"
        >
          <button v-if="query || activeTag" class="btn btn-sm" @click="query = ''; activeTag = ''">清除筛选</button>
        </EmptyState>
      </main>

      <aside class="home-side">
        <section class="side-card">
          <div class="side-author">
            <img class="side-avatar" :src="BASE + 'favicon.svg'" alt="wmoonlq" />
            <div>
              <h4 class="side-name">wmoonlq</h4>
              <p class="side-desc">记录与思考 · 前端 / 设计 / 技术</p>
            </div>
          </div>
        </section>

        <section class="side-card">
          <h4 class="side-title">网站资讯</h4>
          <dl class="stat-list">
            <div class="stat-row">
              <dt>文章</dt>
              <dd>{{ posts.length }}</dd>
            </div>
            <div class="stat-row">
              <dt>随笔</dt>
              <dd>{{ notes.length }}</dd>
            </div>
            <div class="stat-row">
              <dt>标签</dt>
              <dd>{{ allTags.length }}</dd>
            </div>
            <div class="stat-row">
              <dt>建站</dt>
              <dd>{{ daysSince }} 天</dd>
            </div>
          </dl>
        </section>

        <section v-if="allTags.length" class="side-card">
          <h4 class="side-title">标签</h4>
          <div class="side-tags">
            <button class="chip" :class="{ on: activeTag === '' }" @click="pickTag('')">全部</button>
            <button
              v-for="tag in allTags"
              :key="tag"
              class="chip"
              :class="{ on: activeTag === tag }"
              @click="pickTag(tag)"
            >{{ tag }}</button>
          </div>
        </section>

        <section class="side-card">
          <h4 class="side-title">链接</h4>
          <a class="side-link" href="https://github.com/wmoonlq/blog" target="_blank" rel="noopener">GitHub 源码 ↗</a>
        </section>
      </aside>
    </div>
  </div>
</template>
