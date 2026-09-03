<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '../utils/media'
import { settings } from '../stores/settings'
import SettingsPanel from './SettingsPanel.vue'

const open = ref(false)
const route = useRoute()
const isWide = useMediaQuery('(min-width: 820px)')

const items = [
  { name: 'home', label: '文章', icon: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v5h5' },
  { name: 'notes', label: '随笔', icon: 'M17 3l4 4L8 20l-5 1 1-5L17 3z' },
  { name: 'videos', label: '视频', icon: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM10 8.5v7l6-3.5-6-3.5z' },
  { name: 'music', label: '音乐', icon: 'M9 18V5l10-2v13M9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z' },
  { name: 'tags', label: '标签', icon: 'M3 3h7l11 11-7 7L3 10V3zM7.5 7.5h.01' },
  { name: 'timeline', label: '时间线', icon: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 7v5l3.5 2' },
  { name: 'workbench', label: '工作台', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
  { name: 'effects', label: '特效', icon: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3z' },
  { name: 'about', label: '关于', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c1.6-3.5 4.6-5 8-5s6.4 1.5 8 5' }
]

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

watch(
  () => route.path,
  () => close()
)

function onClickOutside(e) {
  if (!e.target || !e.target.closest) return
  if (!e.target.closest('.nav')) close()
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

function openSearch() {
  document.dispatchEvent(new CustomEvent('open-search'))
}

function openSettings() {
  document.dispatchEvent(new CustomEvent('open-settings'))
}
</script>

<template>
  <header class="nav" :class="{ 'nav-has-bg': settings.navBackground }" :style="settings.navBackground ? { '--nav-bg-image': `url(${settings.navBackground})` } : null">
    <div class="nav-inner">
      <router-link class="nav-brand" :to="{ name: 'home' }" @click="close">wmoonlq · Blog</router-link>
      <nav v-if="isWide" class="nav-links">
        <router-link
          v-for="item in items"
          :key="item.name"
          class="nav-link"
          :class="{ active: route.name === item.name }"
          :to="{ name: item.name }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </router-link>
        <button class="nav-search" aria-label="搜索" @click="openSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </button>
      </nav>
      <div class="nav-side">
        <button v-if="!isWide" class="nav-toggle" :aria-expanded="open" @click.stop="toggle">
          <span v-if="!open">☰</span>
          <span v-else>✕</span>
        </button>
        <SettingsPanel />
      </div>
    </div>
    <transition name="nav-drop">
      <nav v-if="open" class="nav-drop">
        <router-link
          v-for="item in items"
          :key="item.name"
          class="nav-drop-link"
          :class="{ active: route.name === item.name }"
          :to="{ name: item.name }"
          @click="close"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          {{ item.label }}
        </router-link>
        <button class="nav-drop-link nav-drop-search" @click="close; openSearch()">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          搜索
        </button>
        <button class="nav-drop-link nav-drop-theme" @click="close; openSettings()">⚙ 设置</button>
      </nav>
    </transition>
  </header>
</template>