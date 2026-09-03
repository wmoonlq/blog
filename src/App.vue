<script setup>
import { computed, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import BlogNav from './components/BlogNav.vue'
import { effects } from './stores/effects'
import { getAllPosts } from './utils/posts'
import { getAllNotes } from './utils/notes'
import { music, bindAudio, onEnded, setVolume, setTracks } from './stores/music'
import { getAllMusic } from './utils/music'

const GlobalParticleTrail = defineAsyncComponent(() => import('./components/GlobalParticleTrail.vue'))
const ScrollProgress = defineAsyncComponent(() => import('./components/ScrollProgress.vue'))
const BackToTop = defineAsyncComponent(() => import('./components/BackToTop.vue'))
const SearchModal = defineAsyncComponent(() => import('./components/SearchModal.vue'))
const BgImage = defineAsyncComponent(() => import('./components/BgImage.vue'))
const MiniPlayer = defineAsyncComponent(() => import('./components/MiniPlayer.vue'))

const router = useRouter()
const postCount = computed(() => getAllPosts().length)
const noteCount = computed(() => getAllNotes().length)

// 全局初始化曲库（供跨页面播放）
setTracks(getAllMusic())

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
        <Suspense :timeout="0">
          <component :is="Component" />
          <template #fallback>
            <div class="page route-skeleton" aria-hidden="true">
              <div class="skeleton-hero">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-sub"></div>
              </div>
              <div class="skeleton-block"></div>
              <div class="skeleton-block"></div>
              <div class="skeleton-block"></div>
            </div>
          </template>
        </Suspense>
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