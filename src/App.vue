<script setup>
import { computed } from 'vue'
import BlogNav from './components/BlogNav.vue'
import GlobalParticleTrail from './components/GlobalParticleTrail.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import BackToTop from './components/BackToTop.vue'
import SearchModal from './components/SearchModal.vue'
import BgImage from './components/BgImage.vue'
import { effects } from './stores/effects'
import { getAllPosts } from './utils/posts'
import { getAllNotes } from './utils/notes'

const postCount = computed(() => getAllPosts().length)
const noteCount = computed(() => getAllNotes().length)
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
  <BackToTop />
  <SearchModal />
</template>
