<script setup>
import { ref, onMounted } from 'vue'
import { relativeTime } from '../utils/format'

const commits = ref([])
const loading = ref(true)
const error = ref('')

const CACHE_KEY = 'github-commits-cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.ts > CACHE_TTL) return null
    return data.commits
  } catch {
    return null
  }
}

function saveCache(list) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), commits: list }))
  } catch {
    /* ignore */
  }
}

function cleanMessage(msg) {
  // 只取第一行，去掉前缀 emoji/symbol
  return (msg || '').split('\n')[0].replace(/^[\s\uFEFF☀☾✕✓ℹ]+/, '').trim() || '(无描述)'
}

function formatDate(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function fetchCommits() {
  loading.value = true
  error.value = ''

  const cached = loadCache()
  if (cached) {
    commits.value = cached
    loading.value = false
  }

  try {
    const res = await fetch('https://api.github.com/repos/wmoonlq/blog/commits?per_page=60')
    if (!res.ok) throw new Error(`加载失败（${res.status}）`)
    const data = await res.json()
    const list = data.map((c) => ({
      sha: c.sha.slice(0, 7),
      url: c.html_url,
      message: cleanMessage(c.commit.message),
      fullMessage: (c.commit.message || '').trim(),
      date: c.commit.author.date,
      author: c.commit.author.name
    }))
    commits.value = list
    saveCache(list)
  } catch (e) {
    if (!commits.value.length) error.value = e.message
  } finally {
    loading.value = false
  }
}

function groupByDay() {
  const map = new Map()
  commits.value.forEach((c) => {
    const day = c.date.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day).push(c)
  })
  return [...map.entries()]
}

onMounted(fetchCommits)
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">时间线</h1>
      <p class="hero-sub">GitHub 提交记录，站点演进的真实足迹 · {{ commits.length }} 次提交</p>
    </header>

    <p v-if="loading && !commits.length" class="hero-sub" style="padding: 96px 0">加载提交记录…</p>
    <p v-if="error && !commits.length" class="hero-sub" style="padding: 96px 0">
      {{ error }}
      <button class="btn btn-sm" style="margin-left: 12px" @click="fetchCommits">重试</button>
    </p>

    <div v-if="commits.length" class="timeline">
      <div v-for="[day, list] in groupByDay()" :key="day" class="timeline-day-group">
        <h2 class="timeline-day">{{ day }}</h2>
        <div v-for="c in list" :key="c.sha" class="timeline-item">
          <a class="timeline-commit" :href="c.url" target="_blank" rel="noopener">
            <span class="timeline-kind">commit</span>
            <span class="timeline-msg">{{ c.message }}</span>
            <span class="timeline-meta">
              <span class="timeline-sha">{{ c.sha }}</span>
              <time class="timeline-date">{{ formatDate(c.date) }} · {{ relativeTime(c.date) }}</time>
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
