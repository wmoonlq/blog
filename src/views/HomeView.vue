<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { readingTime } from '../utils/format'
import PageHero from '../components/PageHero.vue'
import GroupLabel from '../components/GroupLabel.vue'
import EmptyState from '../components/EmptyState.vue'

const route = useRoute()
const posts = computed(() => getAllPosts())
const notes = computed(() => getAllNotes())

const query = ref('')
const activeTag = ref('')

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
      p.content.toLowerCase().includes(q)
    )
  })
})

const byYear = computed(() => {
  const groups = new Map()
  filtered.value.forEach((p) => {
    const y = (p.date || '未知').slice(0, 4)
    if (!groups.has(y)) groups.set(y, [])
    groups.get(y).push(p)
  })
  return [...groups.entries()]
})

const heroStats = computed(() => [
  { n: posts.value.length, label: '篇文章' },
  { n: notes.value.length, label: '篇随笔' },
  { n: allTags.value.length, label: '个标签' }
])

function toggleTag(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <div class="page">
    <PageHero
      title="记录与思考"
      sub="关于前端、设计与技术的随笔"
      :stats="heroStats"
    >
      <template #actions>
        <router-link class="btn hero-btn" :to="{ name: 'posts-editor' }">写文章</router-link>
      </template>
    </PageHero>

    <div class="home-filter">
      <div class="search-box home-search">
        <span class="search-glyph">⌕</span>
        <input
          v-model="query"
          class="search-input"
          placeholder="在文章中搜索…"
          aria-label="搜索文章"
        />
      </div>
      <div v-if="allTags.length" class="tag-chips">
        <button
          class="chip"
          :class="{ on: activeTag === '' }"
          @click="activeTag = ''"
        >全部</button>
        <button
          v-for="tag in allTags"
          :key="tag"
          class="chip"
          :class="{ on: activeTag === tag }"
          @click="toggleTag(tag)"
        >{{ tag }}</button>
      </div>
    </div>

    <template v-if="filtered.length">
      <section v-for="[year, list] in byYear" :key="year" class="year-group">
        <GroupLabel :label="year" :count="list.length" />
        <ul class="post-list">
          <li v-for="post in list" :key="post.slug">
            <router-link class="post-card" :to="{ name: 'post', params: { slug: post.slug } }">
              <div class="post-card-top">
                <time class="post-date">{{ post.date }}</time>
                <span class="post-time">{{ readingTime(post.content) }} 分钟读完</span>
              </div>
              <h3 class="post-title">{{ post.title }}</h3>
              <div v-if="post.tags.length" class="post-tags">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  :title="`筛选「${tag}」`"
                  @click.prevent.stop="toggleTag(tag)"
                >{{ tag }}</span>
              </div>
              <span class="post-arrow">→</span>
            </router-link>
          </li>
        </ul>
      </section>
    </template>

    <EmptyState v-else
      :text="query || activeTag ? '没有找到匹配的内容' : '还没有文章'"
      :sub="activeTag ? `换个标签试试，或清除「${activeTag}」筛选` : query ? '换个关键词试试' : '点「写文章」开始记录'"
    >
      <button v-if="query || activeTag" class="btn btn-sm" @click="query = ''; activeTag = ''">清除筛选</button>
    </EmptyState>
  </div>
</template>