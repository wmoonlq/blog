<script setup>
import { ref, computed } from 'vue'
import { getAllVideos, isBilibili } from '../utils/videos'
import { renderMarkdown } from '../utils/markdown'
import VideoPlayer from '../components/VideoPlayer.vue'

const videos = computed(() => getAllVideos())
const active = ref(null)

function play(video) {
  active.value = video
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

    <section v-if="active" class="video-featured">
      <h2 class="video-featured-title">{{ active.title }}</h2>
      <VideoPlayer
        :source="active.source"
        :poster="active.poster"
        :embed="isEmbed(active)"
      />
      <div v-if="active.content.trim()" class="prose video-desc" v-html="renderMarkdown(active.content)"></div>
    </section>

    <div v-if="videos.length" class="video-list">
      <button
        v-for="v in videos"
        :key="v.slug"
        class="video-item"
        :class="{ on: active && active.slug === v.slug }"
        @click="play(v)"
      >
        <span class="video-item-thumb" :style="v.poster ? { backgroundImage: `url(${v.poster})` } : {}">
          <span class="video-item-play">▶</span>
        </span>
        <span class="video-item-main">
          <span class="video-item-title">{{ v.title }}</span>
          <span class="video-item-date">{{ v.date }} · {{ isEmbed(v) ? '外链' : '本机' }}</span>
        </span>
      </button>
    </div>
    <p v-else class="hero-sub" style="padding: 96px 0">
      还没有视频。在 <code>src/videos/</code> 新建 markdown 文件（frontmatter 含 <code>source</code> 视频地址）即可。
    </p>
  </div>
</template>
