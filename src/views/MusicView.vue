<script setup>
import { ref, computed } from 'vue'
import { getAllMusic } from '../utils/music'
import MusicPlayer from '../components/MusicPlayer.vue'
import MediaManager from '../components/MediaManager.vue'
import { checkPassword, getToken, deleteFile } from '../utils/githubFiles'
import { getLocalUploads, addLocalUpload, removeLocalUpload, isLocalUpload } from '../utils/localMedia'

const allTracks = computed(() => {
  const built = getAllMusic()
  const builtSlugs = new Set(built.map((m) => m.slug))
  const local = getLocalUploads()
    .filter((u) => u.kind === 'music' && !builtSlugs.has(u.slug))
    .map((u) => ({ ...u, pending: true, content: '' }))
  return [...local, ...built]
})

const tracks = allTracks
const showUpload = ref(false)
const showManage = ref(false)
const deleting = ref(null)
const deletePwd = ref('')
const deleteMsg = ref('')

function startDelete(t) {
  deleting.value = t
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
  if (!window.confirm(`确认删除「${deleting.value.title}」？该操作会同时删除音频文件和元数据。`)) return
  try {
    if (isLocalUpload(deleting.value.slug)) {
      removeLocalUpload(deleting.value.slug)
      deleteMsg.value = '已删除（待发布条目）'
      deleting.value = null
      return
    }
    const filePath = `public/music/${deleting.value.source.split('/').pop()}`
    await deleteFile(filePath, `docs: delete music ${deleting.value.slug}`, token)
    await deleteFile(`src/music/${deleting.value.slug}.md`, `docs: delete music meta ${deleting.value.slug}`, token)
    removeLocalUpload(deleting.value.slug)
    deleteMsg.value = '已删除，等待自动构建发布后刷新生效'
    deleting.value = null
  } catch (e) {
    deleteMsg.value = e.message
  }
}

function onUploaded(item) {
  addLocalUpload({ ...item, kind: 'music' })
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">音乐</h1>
      <p class="hero-sub">耳朵的收藏 · {{ tracks.length }} 首</p>
      <div class="hero-actions">
        <button class="btn hero-btn" @click="showUpload = !showUpload">
          {{ showUpload ? '收起上传' : '上传音乐' }}
        </button>
        <button class="btn hero-btn" :class="{ 'btn-on': showManage }" @click="showManage = !showManage">
          {{ showManage ? '退出管理' : '管理' }}
        </button>
      </div>
    </header>

    <MediaManager
      v-if="showUpload"
      kind="music"
      media-dir="public/music"
      meta-dir="src/music"
      accept="audio/mpeg,audio/ogg,audio/wav,audio/flac,audio/aac"
      :max-mb="30"
      style="margin-bottom: 32px"
      @uploaded="onUploaded"
    />

    <div v-if="deleting" class="delete-bar">
      <div class="delete-bar-main">
        <p class="delete-bar-title">删除「{{ deleting.title }}」</p>
        <p class="delete-bar-sub">将删除音频文件与元数据，需要操作密码</p>
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

    <section class="music-main">
      <MusicPlayer :tracks="tracks" />

      <div v-if="showManage && tracks.length" class="mp-manage">
        <p class="mp-manage-title">管理曲目</p>
        <div v-for="t in tracks" :key="t.slug" class="mp-manage-row">
          <span class="mp-manage-name">{{ t.title }}<span v-if="t.pending" class="video-card-pending" style="position: static; margin-left: 8px">待发布</span></span>
          <button class="btn btn-sm" @click="startDelete(t)">删除</button>
        </div>
      </div>

      <p v-if="!tracks.length && !showManage" class="hero-sub" style="padding: 48px 0">
        还没有音乐。点「上传音乐」添加第一首。
      </p>
    </section>
  </div>
</template>
