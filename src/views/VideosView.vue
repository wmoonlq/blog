<script setup>
import { ref, computed, nextTick } from 'vue'
import { getAllVideos, isBilibili } from '../utils/videos'
import { renderMarkdown } from '../utils/markdown'
import VideoPlayer from '../components/VideoPlayer.vue'

const videos = computed(() => getAllVideos())
const active = ref(null)
const activeCategory = ref('')

const categories = computed(() => {
  const map = new Map()
  videos.value.forEach((v) => map.set(v.category, (map.get(v.category) || 0) + 1))
  return [...map.entries()]
})

const filtered = computed(() =>
  activeCategory.value
    ? videos.value.filter((v) => v.category === activeCategory.value)
    : videos.value
)

const collections = computed(() => {
  const map = new Map()
  filtered.value.forEach((v) => {
    const key = v.collection || '单集'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(v)
  })
  return [...map.entries()]
})

async function play(video) {
  active.value = video
  await nextTick()
  const el = document.querySelector('.video-featured')
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 88
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function isEmbed(v) {
  return isBilibili(v.source) || v.type === 'embed'
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">视频</h1>
      <p class="hero-sub">影像与声音的合集 · {{ videos.length }} 个</p>
    </header>

    <div v-if="categories.length" class="video-cats">
      <button
        class="chip"
        :class="{ on: activeCategory === '' }"
        @click="activeCategory = ''"
      >全部 <span class="chip-count">{{ videos.length }}</span></button>
      <button
        v-for="[cat, count] in categories"
        :key="cat"
        class="chip"
        :class="{ on: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ cat }} <span class="chip-count">{{ count }}</span></button>
    </div>

    <section v-if="active" class="video-featured">
      <h2 class="video-featured-title">{{ active.title }}</h2>
      <VideoPlayer
        :source="active.source"
        :poster="active.poster"
        :embed="isEmbed(active)"
      />
      <div v-if="active.content.trim()" class="prose video-desc" v-html="renderMarkdown(active.content)"></div>
    </section>

    <template v-if="filtered.length">
      <section v-for="[col, list] in collections" :key="col" class="video-col">
        <div class="video-col-head">
          <h2 class="video-col-title">{{ col }}</h2>
          <span class="video-col-count">{{ list.length }} 集</span>
        </div>
        <div class="video-grid">
          <button
            v-for="v in list"
            :key="v.slug"
            class="video-card"
            :class="{ on: active && active.slug === v.slug }"
            @click="play(v)"
          >
            <span
              class="video-card-thumb"
              :style="v.poster ? { backgroundImage: `url(${v.poster})` } : {}"
            >
              <span class="video-card-play">▶</span>
              <span v-if="isEmbed(v)" class="video-card-tag">外链</span>
            </span>
            <span class="video-card-title">{{ v.title }}</span>
            <span class="video-card-date">{{ v.date }}</span>
          </button>
        </div>
      </section>
    </template>
    <p v-else class="hero-sub" style="padding: 96px 0">该分类下暂无视频。</p>
  </div>
</template>
