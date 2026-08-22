<script setup>
import { ref, onMounted } from 'vue'
import { relativeTime } from '../utils/format'
import PageHero from '../components/PageHero.vue'
import GroupLabel from '../components/GroupLabel.vue'
import EmptyState from '../components/EmptyState.vue'

const commits = ref([])
const loading = ref(true)
const error = ref('')

const CACHE_KEY = 'timeline-commits'
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟
const API_URL = 'https://api.github.com/repos/wmoonlq/blog/commits?per_page=60'

const KIND_MAP = {
  feat: ['功能', 'feat'],
  fix: ['修复', 'fix'],
  docs: ['文档', 'docs'],
  chore: ['杂务', 'chore'],
  ci: ['工程', 'ci'],
  refactor: ['重构', 'refactor'],
  perf: ['性能', 'perf'],
  style: ['样式', 'style']
}

const KIND_FALLBACK = ['commit', 'other']

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
  const message = cleanMessage(item.message || commit.message)
  return {
    sha: item.sha.slice(0, 7),
    url: item.url || item.html_url || '#',
    message,
    date: formatDate(date),
    kind: detectKind(message)
  }
}

function detectKind(msg) {
  const m = (msg || '').match(/^(feat|fix|docs|chore|ci|refactor|perf|style)(?:\(.+?\))?:/i)
  if (!m) return KIND_FALLBACK
  const key = m[1].toLowerCase()
  const [label, cls] = KIND_MAP[key]
  return [label, cls]
}

async function fetchCommits() {
  loading.value = true
  error.value = ''

  const cached = loadCache()
  if (cached) {
    commits.value = cached.map(toView)
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
    <PageHero
      title="时间线"
      :sub="`GitHub 提交记录，站点演进的真实足迹 · ${commits.length} 次提交`"
    />

    <EmptyState v-if="loading && !commits.length" text="加载提交记录…" />
    <EmptyState v-else-if="error && !commits.length" :text="error">
      <button class="btn btn-sm" @click="fetchCommits">重试</button>
    </EmptyState>

    <div v-if="commits.length" class="timeline">
      <div v-for="[day, list] in groupByDay()" :key="day" class="timeline-day-group">
        <GroupLabel :label="day" :count="list.length" />
        <div v-for="c in list" :key="c.sha" class="timeline-item">
          <a class="timeline-commit" :href="c.url" target="_blank" rel="noopener">
            <span class="tl-kind" :class="c.kind[1]">{{ c.kind[0] }}</span>
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
