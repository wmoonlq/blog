<script setup>
import { ref, computed, nextTick } from 'vue'
import { getAllVideos, isBilibili, getCategories, getCollections } from '../utils/videos'
import { renderMarkdown } from '../utils/markdown'
import VideoPlayer from '../components/VideoPlayer.vue'
import VideoThumb from '../components/VideoThumb.vue'
import MediaManager from '../components/MediaManager.vue'
import VideoDownloader from '../components/VideoDownloader.vue'
import { checkPassword, getToken, deleteFile } from '../utils/githubFiles'
import { getLocalUploads, addLocalUpload, removeLocalUpload, isLocalUpload } from '../utils/localMedia'

// 构建中的本地上传条目合并进列表，刷新后由真实数据替代
const allVideos = computed(() => {
  const built = getAllVideos()
  const builtSlugs = new Set(built.map((v) => v.slug))
  const local = getLocalUploads()
    .filter((u) => u.kind === 'video' && !builtSlugs.has(u.slug))
    .map((u) => ({ ...u, pending: true, collections: [], category: u.category || '未分类', content: '' }))
  return [...local, ...built]
})

const videos = allVideos
const active = ref(null)
const activeCategory = ref('')
const showUpload = ref(false)
const showDownload = ref(false)
const showManage = ref(false)
const deleting = ref(null) // 待删除的视频
const deletePwd = ref('')
const deleteMsg = ref('')

const categories = computed(() => {
  const counts = new Map()
  allVideos.value.forEach((v) => counts.set(v.category, (counts.get(v.category) || 0) + 1))
  const list = getCategories().map((name) => [name, counts.get(name) || 0])
  const rest = [...counts.entries()].filter(([name]) => !getCategories().includes(name))
  return [...list, ...rest]
})

const filtered = computed(() =>
  activeCategory.value
    ? allVideos.value.filter((v) => v.category === activeCategory.value)
    : allVideos.value
)

const collections = computed(() => {
  const groups = []
  const inAny = new Set()
  getCollections().forEach((col) => {
    const vids = filtered.value.filter((v) => (v.collections || []).some((c) => c.id === col.id))
    vids.forEach((v) => inAny.add(v.slug))
    // 全部分区下显示空集合（可被手动挑选）；指定分区时隐藏无内容的集合
    if (vids.length || !activeCategory.value) {
      groups.push({ col, videos: vids })
    }
  })
  const loose = filtered.value.filter((v) => !inAny.has(v.slug))
  if (loose.length) {
    groups.push({ col: { id: '__loose__', name: '未加入集合', description: '', sort: 999 }, videos: loose })
  }
  return groups
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

function startDelete(v) {
  deleting.value = v
  deletePwd.value = ''
  deleteMsg.value = ''
}

function cancelDelete() {
  deleting.value = null
}

async function confirmDelete() {
  if (!deleting.value) return
  deleteMsg.value = ''
  if (!checkPassword(deletePwd.value)) {
    deleteMsg.value = '操作密码不正确'
    return
  }
  const token = getToken()
  if (!token) {
    deleteMsg.value = '需要 GitHub Token（与随笔编辑器共用）'
    return
  }
  if (!window.confirm(`确认删除「${deleting.value.title}」？该操作会同时删除视频文件和元数据。`)) return

  try {
    // 本地待发布条目：仅清除本地记录
    if (isLocalUpload(deleting.value.slug)) {
      removeLocalUpload(deleting.value.slug)
      if (active.value && active.value.slug === deleting.value.slug) active.value = null
      deleteMsg.value = '已删除（待发布条目）'
      deleting.value = null
      return
    }
    // 从 source 推导 public 文件路径：/blog/videos/xxx.mp4 → public/videos/xxx.mp4
    const filePath = `public/videos/${deleting.value.source.split('/').pop()}`
    await deleteFile(filePath, `docs: delete video ${deleting.value.slug}`, token)
    await deleteFile(`src/videos/${deleting.value.slug}.md`, `docs: delete video meta ${deleting.value.slug}`, token)
    removeLocalUpload(deleting.value.slug)
    deleteMsg.value = '已删除，等待自动构建发布后刷新生效'
    deleting.value = null
  } catch (e) {
    deleteMsg.value = e.message
  }
}

function onUploaded(item) {
  addLocalUpload({ ...item, kind: 'video' })
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">视频</h1>
      <p class="hero-sub">影像与声音的合集 · {{ videos.length }} 个</p>
      <div class="hero-actions">
        <button class="btn hero-btn" @click="showUpload = !showUpload">
          {{ showUpload ? '收起上传' : '上传视频' }}
        </button>
        <button class="btn hero-btn" @click="showDownload = !showDownload">
          {{ showDownload ? '收起下载' : '下载视频' }}
        </button>
        <button class="btn hero-btn" :class="{ 'btn-on': showManage }" @click="showManage = !showManage">
          {{ showManage ? '退出管理' : '管理' }}
        </button>
      </div>
    </header>

    <VideoDownloader
      v-if="showDownload"
      style="margin-bottom: 32px"
    />

    <MediaManager
      v-if="showUpload"
      kind="video"
      media-dir="public/videos"
      meta-dir="src/videos"
      accept="video/mp4,video/webm,video/ogg"
      :max-mb="100"
      style="margin-bottom: 32px"
      @uploaded="onUploaded"
    />

    <!-- 删除确认条 -->
    <div v-if="deleting" class="delete-bar">
      <div class="delete-bar-main">
        <p class="delete-bar-title">删除「{{ deleting.title }}」</p>
        <p class="delete-bar-sub">将删除视频文件与元数据，需要操作密码</p>
      </div>
      <input
        v-model="deletePwd"
        class="input delete-pwd"
        type="password"
        placeholder="操作密码"
        @keydown.enter="confirmDelete"
      />
      <button class="btn btn-sm" @click="deletePwd = '123456'">一键填充</button>
      <button class="btn btn-sm btn-danger" @click="confirmDelete">确认删除</button>
      <button class="btn btn-sm" @click="cancelDelete">取消</button>
      <p v-if="deleteMsg" class="editor-msg">{{ deleteMsg }}</p>
    </div>

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

    <template v-if="filtered.length || !activeCategory">
      <section v-for="g in collections" :key="g.col.id" class="video-col">
        <div class="video-col-head">
          <h2 class="video-col-title">{{ g.col.name }}</h2>
          <span class="video-col-count">{{ g.videos.length }} 集</span>
        </div>
        <p v-if="g.col.description" class="video-col-desc">{{ g.col.description }}</p>
        <div v-if="g.videos.length" class="video-grid">
          <button
            v-for="v in g.videos"
            :key="v.slug"
            class="video-card"
            :class="{ on: active && active.slug === v.slug }"
            @click="showManage ? startDelete(v) : play(v)"
          >
            <VideoThumb :source="v.source" :poster="v.poster" :embed="isEmbed(v)" />
            <span v-if="v.pending" class="video-card-pending">待发布</span>
            <span v-if="showManage" class="video-card-del">✕ 删除</span>
            <span class="video-card-title">{{ v.title }}</span>
            <span class="video-card-date">{{ v.date }}</span>
          </button>
        </div>
        <p v-else class="video-col-empty">暂无视频</p>
      </section>
    </template>
    <p v-else class="hero-sub" style="padding: 96px 0">该分类下暂无视频。</p>
  </div>
</template>
