<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useMediaQuery } from '../utils/media'

const open = ref(false)
const route = useRoute()
const isWide = useMediaQuery('(min-width: 760px)')

const items = [
  { name: 'home', label: '文章' },
  { name: 'notes', label: '随笔' },
  { name: 'workbench', label: '工作台' },
  { name: 'effects', label: '特效' }
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
</script>

<template>
  <header class="nav">
    <div class="nav-inner">
      <router-link class="nav-brand" :to="{ name: 'home' }" @click="close">wmoonlq · Blog</router-link>
      <nav v-if="isWide" class="nav-links">
        <router-link
          v-for="item in items"
          :key="item.name"
          class="nav-link"
          :class="{ active: route.name === item.name }"
          :to="{ name: item.name }"
        >{{ item.label }}</router-link>
        <button class="nav-search" aria-label="搜索" @click="openSearch">⌕</button>
      </nav>
      <button v-else class="nav-toggle" :aria-expanded="open" @click.stop="toggle">
        <span v-if="!open">☰</span>
        <span v-else>✕</span>
      </button>
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
        >{{ item.label }}</router-link>
        <button class="nav-drop-link nav-drop-search" @click="close; openSearch()">⌕ 搜索</button>
      </nav>
    </transition>
  </header>
</template>
