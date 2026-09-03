<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import { settings } from '../stores/settings'

const props = defineProps({
  slug: { type: String, required: true }
})

const REPO = 'wmoonlq/blog'
const REPO_ID = 'R_kgDOT2U2qw'
const CATEGORY = 'General'
const CATEGORY_ID = ''

let initialized = false

function giscusTheme() {
  return settings.theme === 'dark' ? 'transparent_dark' : 'transparent_light'
}

function mountScript() {
  if (initialized) return
  if (!CATEGORY_ID) return
  initialized = true
  const s = document.createElement('script')
  s.src = 'https://giscus.app/client.js'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.setAttribute('data-repo', REPO)
  s.setAttribute('data-repo-id', REPO_ID)
  s.setAttribute('data-category', CATEGORY)
  s.setAttribute('data-category-id', CATEGORY_ID)
  s.setAttribute('data-mapping', 'specific')
  s.setAttribute('data-term', props.slug)
  s.setAttribute('data-strict', '0')
  s.setAttribute('data-reactions-enabled', '1')
  s.setAttribute('data-emit-metadata', '0')
  s.setAttribute('data-input-position', 'bottom')
  s.setAttribute('data-theme', giscusTheme())
  s.setAttribute('data-lang', 'zh-CN')
  s.setAttribute('data-loading', 'lazy')
  document.body.appendChild(s)
}

function postToGiscus(payload) {
  const frame = document.querySelector('iframe.giscus-frame')
  frame?.contentWindow?.postMessage({ giscus: payload }, 'https://giscus.app')
}

function updateTheme() {
  postToGiscus({ setConfig: { theme: giscusTheme() } })
}

watch(
  () => props.slug,
  (slug) => postToGiscus({ setConfig: { term: slug } })
)

watch(
  () => settings.theme,
  () => updateTheme()
)

onMounted(() => {
  mountScript()
})
onBeforeUnmount(() => {})
</script>

<template>
  <section v-if="CATEGORY_ID" class="giscus-wrap">
    <div class="giscus"></div>
  </section>
</template>