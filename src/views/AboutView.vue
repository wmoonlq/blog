<script setup>
import { computed } from 'vue'
import { getAllPosts } from '../utils/posts'
import { getAllNotes } from '../utils/notes'
import { stripMarkdown } from '../utils/format'

const posts = computed(() => getAllPosts())
const notes = computed(() => getAllNotes())

const totalWords = computed(() => {
  let n = 0
  posts.value.forEach((p) => (n += stripMarkdown(p.content).length))
  notes.value.forEach((x) => (n += stripMarkdown(x.content).length))
  return n
})

const tagCount = computed(() => {
  const set = new Set()
  posts.value.forEach((p) => p.tags.forEach((t) => set.add(t)))
  return set.size
})

const firstDate = computed(() => {
  const all = [...posts.value, ...notes.value].filter((x) => x.date).sort((a, b) => (a.date > b.date ? 1 : -1))
  return all[0]?.date || '—'
})

const latestDate = computed(() => {
  const all = [...posts.value, ...notes.value].filter((x) => x.date).sort((a, b) => (a.date < b.date ? 1 : -1))
  return all[0]?.date || '—'
})

const tech = ['Vite', 'Vue 3', 'Vue Router', 'Marked', 'GitHub Pages', 'Design Tokens']
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">关于本站</h1>
      <p class="hero-sub">一个安静、克制、可写可读的个人站点</p>
    </header>
    <div class="about-body">
      <section class="about-card">
        <h2 class="about-title">站点统计</h2>
        <div class="stats-grid">
          <div class="stat-cell">
            <p class="stat-num">{{ posts.length }}</p>
            <p class="stat-label">文章</p>
          </div>
          <div class="stat-cell">
            <p class="stat-num">{{ notes.length }}</p>
            <p class="stat-label">随笔</p>
          </div>
          <div class="stat-cell">
            <p class="stat-num">{{ tagCount }}</p>
            <p class="stat-label">标签</p>
          </div>
          <div class="stat-cell">
            <p class="stat-num">{{ Math.round(totalWords / 1000) }}k</p>
            <p class="stat-label">总字数</p>
          </div>
        </div>
        <div class="about-meta">
          <p>第一篇内容：<b>{{ firstDate }}</b> · 最近更新：<b>{{ latestDate }}</b></p>
        </div>
      </section>

      <section class="about-card">
        <h2 class="about-title">技术栈</h2>
        <div class="about-tech">
          <span v-for="t in tech" :key="t">{{ t }}</span>
        </div>
        <p class="about-text">
          纯静态构建，零后端。文章与随笔以 Markdown 存储于仓库，推送即发布。
          全站围绕一套锁定的设计系统构建：暖白底、衬线标题、单强调色，克制即是风格。
        </p>
      </section>

      <section class="about-card">
        <h2 class="about-title">使用指南</h2>
        <p class="about-text">
          按 <b>Ctrl / Cmd + K</b> 或 <b>/</b> 唤起全站搜索；<br />
          导航栏右侧的月亮/太阳按钮切换暗色主题；<br />
          文章页可调节字号、复制代码块、查看目录；<br />
          写文章与随笔：点击各页「写」按钮，填入 GitHub Token 即可在线保存并自动发布。
        </p>
      </section>

      <section class="about-card">
        <h2 class="about-title">版权声明</h2>
        <p class="about-text">
          本站文章与随笔为原创内容，转载或引用请注明出处。<br />
          音乐、视频等媒体部分来自公开网络，仅作个人收藏与学习交流，版权归原作者所有，仅供试听/试看。<br />
          如您认为本站内容侵犯了您的合法权益，请在<a href="#/notes" class="about-link">随笔</a>页面留言告知，我们将在核实后第一时间处理（删除相关内容）。
        </p>
      </section>
    </div>
  </div>
</template>
