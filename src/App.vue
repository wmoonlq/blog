<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BlogNav from './components/BlogNav.vue'
import GlobalParticleTrail from './components/GlobalParticleTrail.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import BackToTop from './components/BackToTop.vue'
import SearchModal from './components/SearchModal.vue'
import BgImage from './components/BgImage.vue'
import MiniPlayer from './components/MiniPlayer.vue'
import { effects } from './stores/effects'
import { getAllPosts } from './utils/posts'
import { getAllNotes } from './utils/notes'
import { music, bindAudio, onEnded, setVolume, setTracks } from './stores/music'
import { getAllMusic } from './utils/music'

const router = useRouter()
const postCount = computed(() => getAllPosts().length)
const noteCount = computed(() => getAllNotes().length)

// 全局初始化曲库（供跨页面播放）
setTracks(getAllMusic())

function onAudioTime() {
  music.current = audioEl.currentTime
}

function onAudioMeta() {
  music.duration = audioEl.duration
}

let audioEl = null

onMounted(() => {
  audioEl = document.getElementById('global-audio')
  bindAudio(audioEl)
  audioEl.volume = music.volume
})

function goMusic() {
  router.push({ name: 'music' })
}

onBeforeUnmount(() => bindAudio(null))
</script>

<template>
  <BgImage />
  <ScrollProgress />
  <GlobalParticleTrail v-if="effects.particleTrail" />
  <BlogNav />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <footer class="footer">
    <span>© 2026 wmoonlq</span>
    <span class="footer-dot">·</span>
    <span>{{ postCount }} 篇文章 · {{ noteCount }} 篇随笔</span>
  </footer>

  <audio
    id="global-audio"
    @timeupdate="music.current = $event.target.currentTime"
    @loadedmetadata="music.duration = $event.target.duration"
    @play="music.playing = true"
    @pause="music.playing = false"
    @ended="onEnded"
    @volumechange="music.volume = $event.target.volume"
  ></audio>

  <MiniPlayer @goto-music="goMusic" />

  <BackToTop />
  <SearchModal />
</template>
