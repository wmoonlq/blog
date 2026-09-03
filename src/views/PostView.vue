<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getAllPosts, getPostBySlug } from '../utils/posts'
import { renderMarkdown } from '../utils/markdown'
import { readingTime } from '../utils/format'
import { settings, setFontSize } from '../stores/settings'
import { useMediaQuery } from '../utils/media'
import EmptyState from '../components/EmptyState.vue'
import GiscusComments from '../components/GiscusComments.vue'

const route = useRoute()
const post = computed(() => getPostBySlug(route.params.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))
const activeId = ref('')
const tocObserver = ref(null)
const rootEl = ref(null)
const linkCopied = ref(false)
const tocOpen = ref(false)
const lightbox = ref(null)
const isNarrow = useMediaQuery('(max-width: 1080px)')

const proseStyle = computed(() => ({ fontSize: `${settings.fontSize}px` }))

const toc = computed(() => {
  if (!html.value) return []
  const doc = new DOMParser().parseFromString(html.value, 'text/html')
  const items = []
  doc.querySelectorAll('h2, h3').forEach((h, i) => {
    items.push({
      id: h.id || `h-${i}`,
      text: h.textContent,
      level: h.tagName === 'H2' ? 2 : 3
    })
  })
  return items
})

const all = computed(() => getAllPosts())
const prev = computed(() => {
  const i = all.value.findIndex((p) => p.slug === post.value?.slug)
  return i > 0 ? all.value[i - 1] : null
})
const next = computed(() => {
  const i = all.value.findIndex((p) => p.slug === post.value?.slug)
  return i >= 0 && i < all.value.length - 1 ? all.value[i + 1] : null
})

watch(
  [post, html],
  async () => {
    await nextTick()
    if (tocObserver.value) tocObserver.value.disconnect()
    const targets = rootEl.value
      ? [...rootEl.value.querySelectorAll('h2[id], h3[id]')]
      : []
    if (!targets.length) return
    tocObserver.value = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) activeId.value = visible[0].target.id
      },
      { rootMargin: '-15% 0px -70% 0px' }
    )
    targets.forEach((t) => tocObserver.value.observe(t))
  },
  { immediate: true }
)

function scrollToHeading(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function copyCode(btn) {
  const pre = btn.closest('pre')
  if (!pre) return
  const code = pre.querySelector('code')
  if (!code) return
  try {
    await navigator.clipboard.writeText(code.innerText)
    const old = btn.textContent
    btn.textContent = '已复制 ✓'
    setTimeout(() => (btn.textContent = old), 1600)
  } catch {
    btn.textContent = '复制失败'
  }
}

async function share() {
  const url = window.location.href
  const title = post.value?.title || 'wmoonlq · Blog'
  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url })
      return
    } catch {
      /* 用户取消则回退复制 */
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    linkCopied.value = true
    setTimeout(() => (linkCopied.value = false), 1600)
  } catch {
    /* ignore */
  }
}

function openLightbox(src) {
  lightbox.value = src
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  lightbox.value = null
  document.body.style.overflow = ''
}

function onKeydown(e) {
  if (e.key === 'Escape' && lightbox.value) closeLightbox()
}

function onClick(e) {
  const btn = e.target.closest('.code-copy')
  if (btn) {
    copyCode(btn)
    return
  }
  const img = e.target.closest('.prose img')
  if (img && img.src) openLightbox(img.src)
}

onMounted(() => {
  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClick)
  document.removeEventListener('keydown', onKeydown)
  if (tocObserver.value) tocObserver.value.disconnect()
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="page">
    <article v-if="post" ref="rootEl" class="post-layout">
      <div class="article-tools">
        <router-link class="back" :to="{ name: 'home' }">← 全部文章</router-link>
        <div class="article-tools-right">
          <div class="readsize" aria-label="字号调节">
            <button class="readsize-btn" :disabled="settings.fontSize <= 14" @click="setFontSize(settings.fontSize - 1)">A−</button>
            <button class="readsize-btn" :disabled="settings.fontSize >= 20" @click="setFontSize(settings.fontSize + 1)">A+</button>
          </div>
          <button class="copy-link" @click="share">{{ linkCopied ? '已复制 ✓' : '分享' }}</button>
          <router-link
            class="edit-link"
            :to="{ name: 'posts-editor', query: { file: `${post.slug}.md` } }"
          >编辑</router-link>
        </div>
      </div>
      <header class="article-head">
        <h1 class="article-title">{{ post.title }}</h1>
        <div class="article-meta">
          <time>{{ post.date }}</time>
          <span class="article-meta-dot">·</span>
          <span>{{ readingTime(post.content) }} 分钟读完</span>
          <span v-for="tag in post.tags" :key="tag" class="article-tag">{{ tag }}</span>
        </div>
      </header>

      <button v-if="toc.length && isNarrow" class="toc-toggle" :aria-expanded="tocOpen" @click="tocOpen = !tocOpen">
        {{ tocOpen ? '收起目录 ▲' : '目录 ▼' }}
      </button>
      <aside v-if="toc.length && (isNarrow ? tocOpen : true)" class="toc">
        <h3 class="toc-title">目录</h3>
        <button
          v-for="item in toc"
          :key="item.id"
          class="toc-link"
          :class="{ active: activeId === item.id, 'is-sub': item.level === 3 }"
          @click="tocOpen = false; scrollToHeading(item.id)"
        >{{ item.text }}</button>
      </aside>

      <div class="prose" :style="proseStyle" v-html="html"></div>

      <nav v-if="prev || next" class="post-pager">
        <router-link v-if="prev" class="pager-item" :to="{ name: 'post', params: { slug: prev.slug } }">
          <span class="pager-label">← 上一篇</span>
          <span class="pager-title">{{ prev.title }}</span>
        </router-link>
        <span v-else class="pager-item pager-empty"></span>
        <router-link v-if="next" class="pager-item right" :to="{ name: 'post', params: { slug: next.slug } }">
          <span class="pager-label">下一篇 →</span>
          <span class="pager-title">{{ next.title }}</span>
        </router-link>
        <span v-else class="pager-item pager-empty"></span>
      </nav>

      <GiscusComments :slug="post.slug" />
    </article>
    <EmptyState v-else text="文章不存在" sub="链接可能有误，或文章已被移除" />

    <transition name="lightbox-fade">
      <div v-if="lightbox" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox-close" aria-label="关闭预览" @click="closeLightbox">✕</button>
        <img :src="lightbox" class="lightbox-img" alt="图片预览" @click="closeLightbox" />
      </div>
    </transition>
  </div>
</template>