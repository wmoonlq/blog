<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { settings, toggleTheme, setBackground, setNavBackground } from '../stores/settings'
import { effects, toggleParticleTrail } from '../stores/effects'
import { user, setNickname } from '../stores/user'
import { checkPassword, getToken, fileToBase64Worker, terminateWorker, uploadFileXhr } from '../utils/githubFiles'

const open = ref(false)
const page = ref('') // '' | 'appearance' | 'background' | 'effects' | 'profile'
const bgInput = ref(settings.background)
const navBgInput = ref(settings.navBackground)

const pwd = ref('')
const bgFile = ref(null)
const bgPreview = ref('')
const uploading = ref(false)
const uploadMsg = ref('')
const progress = ref(0)
const phase = ref('')

const API = 'https://api.github.com'
const BG_REPO = 'wmoonlq/blog'
const gallery = ref([])
const galleryLoading = ref(false)

function openPanel() {
  open.value = true
  page.value = ''
  bgInput.value = settings.background
  navBgInput.value = settings.navBackground
}

function closePanel() {
  open.value = false
  page.value = ''
}

function goPage(name) {
  page.value = name
}

function goHome() {
  page.value = ''
}

function onClickOutside(e) {
  if (!e.target || !e.target.closest) return
  if (!e.target.closest('.settings-root')) closePanel()
}

function applyBackground() {
  setBackground(bgInput.value.trim())
}

function clearBackground() {
  bgInput.value = ''
  setBackground('')
}

function applyNavBackground() {
  setNavBackground(navBgInput.value.trim())
}

function clearNavBackground() {
  navBgInput.value = ''
  setNavBackground('')
}

async function loadGallery() {
  gallery.value = []
  galleryLoading.value = true
  try {
    const res = await fetch(`${API}/repos/${BG_REPO}/contents/public/bg`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    gallery.value = (Array.isArray(data) ? data : [])
      .filter((f) => f.type === 'file' && /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f.name))
      .sort((a, b) => (a.name < b.name ? 1 : -1))
      .map((f) => ({ name: f.name, url: `/blog/bg/${f.name}` }))
  } catch {
    gallery.value = []
  } finally {
    galleryLoading.value = false
  }
}

function selectBg(url) {
  if (settings.background === url) {
    clearBackground()
  } else {
    bgInput.value = url
    setBackground(url)
  }
}

function selectNavBg(url) {
  if (settings.navBackground === url) {
    clearNavBackground()
  } else {
    navBgInput.value = url
    setNavBackground(url)
  }
}

watch(
  () => page.value,
  (p) => {
    if (p === 'background') loadGallery()
  }
)

function onKeydown(e) {
  if (e.key === 'Escape') closePanel()
}

function onOpenSettings() {
  openPanel()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onClickOutside)
  document.addEventListener('open-settings', onOpenSettings)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('open-settings', onOpenSettings)
  terminateWorker()
  if (bgPreview.value) URL.revokeObjectURL(bgPreview.value)
})

// ---- 背景图上传（带用户归属） ----
function fillPwd() {
  pwd.value = '123456'
}

function pickFile(e) {
  bgFile.value = e.target.files[0] || null
  uploadMsg.value = ''
  if (bgPreview.value) URL.revokeObjectURL(bgPreview.value)
  bgPreview.value = bgFile.value ? URL.createObjectURL(bgFile.value) : ''
}

async function uploadBg() {
  uploadMsg.value = ''
  if (!bgFile.value) {
    uploadMsg.value = '请先选择图片'
    return
  }
  if (!checkPassword(pwd.value)) {
    uploadMsg.value = '操作密码不正确'
    return
  }
  const token = getToken()
  if (!token) {
    uploadMsg.value = '需要 GitHub Token（与随笔编辑器共用）'
    return
  }
  if (bgFile.value.size > 5 * 1024 * 1024) {
    uploadMsg.value = '图片不能超过 5MB'
    return
  }
  uploading.value = true
  progress.value = 0
  try {
    const ext = (bgFile.value.name.match(/\.(png|jpe?g|webp|gif|avif)$/i) || ['.jpg'])[0]
    const name = `bg-${user.id.slice(-6)}-${Date.now()}${ext}`
    phase.value = 'read'
    const content = await fileToBase64Worker(bgFile.value, (done, total) => {
      progress.value = total ? (done / total) * 50 : 0
    })
    phase.value = 'upload'
    await uploadFileXhr({
      path: `public/bg/${name}`,
      content,
      message: `feat: upload background by ${user.nickname || user.id.slice(-6)} (${name})`,
      token,
      onProgress: (loaded, total) => {
        progress.value = 50 + (total ? (loaded / total) * 50 : 0)
      }
    })
    progress.value = 100
    setBackground(`/blog/bg/${name}`)
    bgInput.value = `/blog/bg/${name}`
    uploadMsg.value = '上传成功，背景已应用'
    pwd.value = ''
    bgFile.value = null
    if (bgPreview.value) URL.revokeObjectURL(bgPreview.value)
    bgPreview.value = ''
  } catch (e) {
    uploadMsg.value = e.message
  } finally {
    uploading.value = false
    phase.value = ''
  }
}
</script>

<template>
  <div class="settings-root">
    <button
      class="theme-toggle nav-settings"
      :class="{ on: open }"
      :aria-expanded="open"
      aria-label="设置"
      @click.stop="open ? closePanel() : openPanel()"
    >⚙</button>

    <transition name="nav-drop">
      <div v-if="open" class="settings-drop" role="dialog" aria-label="设置" @click.stop>
        <div class="settings-head">
          <button v-if="page" class="settings-back" aria-label="返回" @click="goHome">←</button>
          <h2 class="settings-title">{{ page === 'appearance' ? '外观' : page === 'background' ? '背景图片' : page === 'effects' ? '特效' : page === 'profile' ? '我的身份' : '设置' }}</h2>
        </div>

        <!-- 一级菜单 -->
        <div v-if="!page" class="settings-menu">
          <button class="settings-item" @click="goPage('appearance')">
            <span class="settings-item-name">外观</span>
            <span class="settings-item-desc">{{ settings.theme === 'dark' ? '暗色模式：开' : '暗色模式：关' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
          <button class="settings-item" @click="goPage('background')">
            <span class="settings-item-name">背景图片</span>
            <span class="settings-item-desc">{{ settings.background ? '全站已设置' : '全站未设置' }} · {{ settings.navBackground ? '导航已设置' : '导航未设置' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
          <button class="settings-item" @click="goPage('effects')">
            <span class="settings-item-name">特效</span>
            <span class="settings-item-desc">{{ effects.particleTrail ? '粒子轨迹：开' : '粒子轨迹：关' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
          <button class="settings-item" @click="goPage('profile')">
            <span class="settings-item-name">我的身份</span>
            <span class="settings-item-desc">{{ user.nickname || '未设置昵称' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
        </div>

        <!-- 外观 -->
        <div v-else-if="page === 'appearance'" class="settings-scroll">
          <section class="settings-sec">
            <div class="switch-row">
              <span class="switch-label">暗色模式</span>
              <button
                class="switch"
                :class="{ on: settings.theme === 'dark' }"
                :aria-pressed="settings.theme === 'dark'"
                @click="toggleTheme"
              ></button>
            </div>
          </section>
        </div>

        <!-- 背景图片 -->
        <div v-else-if="page === 'background'" class="settings-scroll">
          <section class="settings-sec">
            <h3 class="settings-sec-title">背景图片</h3>
            <p class="settings-hint">全站背景，个人设置仅对本机生效</p>
            <div class="bg-input-row">
              <input
                v-model="bgInput"
                class="input"
                type="url"
                placeholder="图片 URL（https://…）"
                @keydown.enter="applyBackground"
              />
              <button class="btn btn-sm" @click="applyBackground">应用</button>
              <button v-if="settings.background" class="btn btn-sm" @click="clearBackground">清除</button>
            </div>
            <div class="settings-sep"></div>
            <p class="settings-hint">上传图片到 GitHub（需密码 + Token，记录上传者）</p>
            <div class="bg-upload-row">
              <input class="input bg-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" @change="pickFile" />
            </div>
            <div v-if="bgPreview" class="bg-preview">
              <img :src="bgPreview" alt="预览" />
            </div>
            <div class="bg-upload-row">
              <input v-model="pwd" class="input" type="password" placeholder="操作密码" @keydown.enter="uploadBg" />
              <button class="btn btn-sm" @click="fillPwd">一键填充</button>
              <button class="btn btn-sm" :disabled="uploading" @click="uploadBg">{{ uploading ? '上传中…' : '上传' }}</button>
            </div>
            <div v-if="uploading" class="upload-progress">
              <div class="upload-progress-bar">
                <div class="upload-progress-fill" :style="{ width: `${progress}%` }"></div>
              </div>
              <p class="upload-progress-label">{{ phase === 'read' ? '后台读取' : '上传中' }} {{ progress.toFixed(0) }}%</p>
            </div>
            <p v-if="uploadMsg" class="editor-msg">{{ uploadMsg }}</p>
            <div class="settings-sep"></div>
            <h3 class="settings-sec-title">导航栏背景图</h3>
            <p class="settings-hint">仅导航栏区域，可复用上方上传的图片 URL</p>
            <div class="bg-input-row">
              <input
                v-model="navBgInput"
                class="input"
                type="url"
                placeholder="图片 URL（https://…）"
                @keydown.enter="applyNavBackground"
              />
              <button class="btn btn-sm" @click="applyNavBackground">应用</button>
              <button v-if="settings.navBackground" class="btn btn-sm" @click="clearNavBackground">清除</button>
            </div>
          </section>
        </div>

        <!-- 特效 -->
        <div v-else-if="page === 'effects'" class="settings-scroll">
          <section class="settings-sec">
            <div class="switch-row">
              <span class="switch-label">粒子轨迹（全站）</span>
              <button
                class="switch"
                :class="{ on: effects.particleTrail }"
                :aria-pressed="effects.particleTrail"
                @click="toggleParticleTrail(!effects.particleTrail)"
              ></button>
            </div>
          </section>
        </div>

        <!-- 我的身份 -->
        <div v-else-if="page === 'profile'" class="settings-scroll">
          <section class="settings-sec">
            <h3 class="settings-sec-title">我的身份</h3>
            <p class="settings-hint">上传记录将带此标识，用于多用户区分</p>
            <div class="bg-input-row">
              <input v-model="user.nickname" class="input" placeholder="昵称（可选）" />
              <button class="btn btn-sm" @click="setNickname(user.nickname)">保存</button>
            </div>
            <p class="settings-uid">ID：{{ user.id }}</p>
          </section>
        </div>
      </div>
    </transition>
  </div>
</template>
