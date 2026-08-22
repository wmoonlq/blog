<script setup>
import { ref, computed } from 'vue'
import { currentTrack, playTracks } from '../stores/music'
import {
  prefs, isFavorite, createPlaylist, removePlaylist,
  renamePlaylist, moveInPlaylist, removeFromPlaylist
} from '../stores/musicPrefs'
import { getAllMusic } from '../utils/music'
import MusicPlayer from '../components/MusicPlayer.vue'
import MediaManager from '../components/MediaManager.vue'
import { checkPassword, getToken, deleteFile } from '../utils/githubFiles'
import { getLocalUploads, addLocalUpload, removeLocalUpload, isLocalUpload } from '../utils/localMedia'
import PageHero from '../components/PageHero.vue'
import EmptyState from '../components/EmptyState.vue'
import DeleteBar from '../components/DeleteBar.vue'

const allTracks = computed(() => {
  const built = getAllMusic()
  const builtSlugs = new Set(built.map((m) => m.slug))
  const local = getLocalUploads()
    .filter((u) => u.kind === 'music' && !builtSlugs.has(u.slug))
    .map((u) => ({ ...u, pending: true, content: '' }))
  return [...local, ...built]
})

const tracks = allTracks
const viewMode = ref('all') // 'all' | 'fav' | 'recent' | 'pl:<id>'
const newPlName = ref('')
const showUpload = ref(false)
const showManage = ref(false)
const deleting = ref(null)
const deletePwd = ref('')
const deleteMsg = ref('')
const deleteBusy = ref(false)

const viewTracks = computed(() => {
  const list = allTracks.value
  if (viewMode.value === 'fav') return list.filter((t) => isFavorite(t.slug))
  if (viewMode.value === 'recent') {
    return prefs.history
      .map((s) => list.find((t) => t.slug === s))
      .filter(Boolean)
  }
  const m = viewMode.value.match(/^pl:(.+)$/)
  if (m) {
    const pl = prefs.playlists.find((p) => p.id === m[1])
    if (!pl) return []
    return pl.slugs.map((s) => list.find((t) => t.slug === s)).filter(Boolean)
  }
  return list
})

const activePlaylist = computed(() => {
  const m = viewMode.value.match(/^pl:(.+)$/)
  return m ? prefs.playlists.find((p) => p.id === m[1]) || null : null
})

const favCount = computed(() => allTracks.value.filter((t) => isFavorite(t.slug)).length)
const recentCount = computed(() =>
  prefs.history.filter((s) => allTracks.value.some((t) => t.slug === s)).length
)

function doCreatePl() {
  const name = newPlName.value.trim()
  if (!name) return
  const id = createPlaylist(name)
  newPlName.value = ''
  viewMode.value = `pl:${id}`
}

function doRenamePl() {
  if (!activePlaylist.value) return
  const name = window.prompt('歌单名称', activePlaylist.value.name)
  if (name && name.trim()) renamePlaylist(activePlaylist.value.id, name.trim())
}

function doDeletePl() {
  if (!activePlaylist.value) return
  if (!window.confirm(`删除歌单「${activePlaylist.value.name}」？仅移除歌单，不影响曲目。`)) return
  removePlaylist(activePlaylist.value.id)
  viewMode.value = 'all'
}

function playAt(i) {
  playTracks(viewTracks.value, i)
}

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
  deleteBusy.value = true
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
  } finally {
    deleteBusy.value = false
  }
}

function onUploaded(item) {
  addLocalUpload({ ...item, kind: 'music' })
}
</script>

<template>
  <div class="music-page">
    <div
      v-if="currentTrack && currentTrack.cover"
      class="music-bg"
      :style="{ backgroundImage: `url(${currentTrack.cover})` }"
    ></div>
    <div v-if="currentTrack && currentTrack.cover" class="music-bg-veil"></div>

    <div class="page">
      <PageHero
        title="音乐"
        :sub="`耳朵的收藏 · ${tracks.length} 首`"
      >
        <template #actions>
          <button class="btn hero-btn" @click="showUpload = !showUpload">
            {{ showUpload ? '收起上传' : '上传音乐' }}
          </button>
          <button class="btn hero-btn" :class="{ 'btn-on': showManage }" @click="showManage = !showManage">
            {{ showManage ? '退出管理' : '管理' }}
          </button>
        </template>
      </PageHero>

      <MediaManager
        v-if="showUpload"
        kind="music"
        media-dir="public/music"
        meta-dir="src/music"
        accept="audio/mpeg,audio/ogg,audio/wav,audio/flac,audio/aac"
        :max-mb="100"
        style="margin-bottom: 32px"
        @uploaded="onUploaded"
      />

      <DeleteBar
        v-if="deleting"
        v-model:pwd="deletePwd"
        :title="`删除「${deleting.title}」`"
        sub="将删除音频文件与元数据，需要操作密码"
        :msg="deleteMsg"
        :busy="deleteBusy"
        confirm-label="确认删除"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />

      <div class="mp-viewbar">
        <button class="chip" :class="{ on: viewMode === 'all' }" @click="viewMode = 'all'">
          全部 <span class="chip-count">{{ tracks.length }}</span>
        </button>
        <button class="chip" :class="{ on: viewMode === 'fav' }" @click="viewMode = 'fav'">
          ♥ 收藏 <span class="chip-count">{{ favCount }}</span>
        </button>
        <button class="chip" :class="{ on: viewMode === 'recent' }" @click="viewMode = 'recent'">
          最近播放 <span class="chip-count">{{ recentCount }}</span>
        </button>
        <button
          v-for="pl in prefs.playlists"
          :key="pl.id"
          class="chip"
          :class="{ on: viewMode === `pl:${pl.id}` }"
          @click="viewMode = `pl:${pl.id}`"
        >{{ pl.name }} <span class="chip-count">{{ pl.slugs.length }}</span></button>
        <div class="mp-viewbar-new">
          <input v-model="newPlName" class="input" placeholder="新建歌单" @keydown.enter="doCreatePl" />
          <button class="btn btn-sm" @click="doCreatePl">新建</button>
        </div>
      </div>

      <section class="music-main">
        <MusicPlayer :tracks="viewTracks" />

        <div v-if="activePlaylist" class="pl-manage">
          <div class="pl-manage-head">
            <p class="pl-manage-title">歌单「{{ activePlaylist.name }}」 · {{ activePlaylist.slugs.length }} 首</p>
            <div class="pl-manage-actions">
              <button class="btn btn-sm" @click="doRenamePl">改名</button>
              <button class="btn btn-sm btn-danger" @click="doDeletePl">删除歌单</button>
            </div>
          </div>
          <div v-for="(t, i) in viewTracks" :key="t.slug" class="pl-manage-row">
            <span class="pl-manage-name">
              {{ t.title }}
              <span class="pl-manage-artist">{{ t.artist }}</span>
              <span v-if="t.pending" class="video-card-pending" style="position: static; margin-left: 8px">待发布</span>
            </span>
            <div class="pl-manage-ops">
              <button class="btn btn-sm" @click="playAt(i)">播放</button>
              <button class="btn btn-sm" title="上移" @click="moveInPlaylist(activePlaylist.id, t.slug, -1)">▲</button>
              <button class="btn btn-sm" title="下移" @click="moveInPlaylist(activePlaylist.id, t.slug, 1)">▼</button>
              <button class="btn btn-sm btn-danger" title="移出歌单" @click="removeFromPlaylist(activePlaylist.id, t.slug)">移除</button>
            </div>
          </div>
          <p v-if="!viewTracks.length" class="mp-empty">歌单为空，在播放器点「+ 歌单」把歌曲加进来</p>
        </div>

        <div v-if="showManage && tracks.length" class="mp-manage">
          <p class="mp-manage-title">管理曲目</p>
          <div v-for="t in tracks" :key="t.slug" class="mp-manage-row">
            <span class="mp-manage-name">{{ t.title }}<span v-if="t.pending" class="video-card-pending" style="position: static; margin-left: 8px">待发布</span></span>
            <button class="btn btn-sm" @click="startDelete(t)">删除</button>
          </div>
        </div>

        <EmptyState v-if="!tracks.length && !showManage" text="还没有音乐" sub="点「上传音乐」添加第一首" />
      </section>
    </div>
  </div>
</template>
