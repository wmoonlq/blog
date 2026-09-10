<script setup>
import { computed, defineAsyncComponent } from 'vue'
import BlogNav from './components/BlogNav.vue'
import { getAllPosts } from './utils/posts'
import { getAllNotes } from './utils/notes'

const ScrollProgress = defineAsyncComponent(() => import('./components/ScrollProgress.vue'))
const BackToTop = defineAsyncComponent(() => import('./components/BackToTop.vue'))
const SearchModal = defineAsyncComponent(() => import('./components/SearchModal.vue'))
const BgImage = defineAsyncComponent(() => import('./components/BgImage.vue'))

const postCount = computed(() => getAllPosts().length)
const noteCount = computed(() => getAllNotes().length)
</script>

<template>
  <BgImage />
  <ScrollProgress />
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

  <BackToTop />
  <SearchModal />
</template>
