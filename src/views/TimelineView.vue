<script setup>
import { ref, onMounted } from 'vue'
import { relativeTime } from '../utils/format'

const commits = ref([])
const loading = ref(true)
const error = ref('')

const CACHE_KEY = 'timeline-commits'
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟
const API_URL = 'https://api.github.com/repos/wmoonlq/blog/commits?per_page=60'

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
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 兼容两种数据源：构建产物 commits.json 与 GitHub API 响应
function toView(item) {
  const commit = item.commit || {}
  const date = item.date || commit.author?.date || ''
  return {
    sha: item.sha.slice(0, 7),
    url: item.url || item.html_url || '#',
    message: cleanMessage(item.message || commit.message),
    date: formatDate(date)
  }
}

async function fetchCommits() {
  loading.value = true
  error.value = ''

  const cached = loadCache()
  if (cached) {
    commits.value = cached
    loading.value = false
  }

  const sources = [
    { url: `${import.meta.env.BASE_URL}commits.json`, label: '本地数据' },
    { url: API_URL, label: 'GitHub' }
  ]

  let lastError = ''
  for (const { url, label } of sources) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${label}加载失败（${res.status}）`)
      const data = await res.json()
      const list = (Array.isArray(data) ? data : []).map(toView)
      if (!list.length) throw new Error(`${label}为空`)
      commits.value = list
      saveCache(list)
      return
    } catch (e) {
      lastError = e.message
    }
  }
  if (!commits.value.length) error.value = lastError
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

    <div v-if="loading && !commits.length" class="timeline-empty">
      <p class="hero-sub">加载提交记录…</p>
    </div>
    <div v-else-if="error && !commits.length" class="timeline-empty">
      <p class="hero-sub">
        {{ error }}
        <button class="btn btn-sm" @click="fetchCommits">重试</button>
      </p>
    </div>

    <div v-if="commits.length" class="timeline">
      <div v-for="[day, list] in groupByDay()" :key="day" class="timeline-day-group">
        <h2 class="timeline-day">{{ day }}</h2>
        <div v-for="c in list" :key="c.sha" class="timeline-item">
          <a class="timeline-commit" :href="c.url" target="_blank" rel="noopener">
            <span class="timeline-kind">commit</span>
            <span class="timeline-msg">{{ c.message }}</span>
            <span class="timeline-meta">
              <span class="timeline-sha">{{ c.sha }}</span>
              <time class="timeline-date">{{ c.date }} · {{ relativeTime(c.date) }}</time>
            </span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
