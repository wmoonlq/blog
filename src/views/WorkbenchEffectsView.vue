<script setup>
import TypewriterEffect from '../components/effects/TypewriterEffect.vue'
import CharRainEffect from '../components/effects/CharRainEffect.vue'
import CharRevealEffect from '../components/effects/CharRevealEffect.vue'
import MagneticEffect from '../components/effects/MagneticEffect.vue'
import DigitalClock from '../components/effects/DigitalClock.vue'
import RippleEffect from '../components/effects/RippleEffect.vue'
import BreathingCircle from '../components/effects/BreathingCircle.vue'
import EchoTrail from '../components/effects/EchoTrail.vue'
import FireworksEffect from '../components/effects/FireworksEffect.vue'
import SnowfallEffect from '../components/effects/SnowfallEffect.vue'
import TiltCardEffect from '../components/effects/TiltCardEffect.vue'
import TextPulseEffect from '../components/effects/TextPulseEffect.vue'
import ParticleNebula from '../components/effects/ParticleNebula.vue'
import WaveGrid from '../components/effects/WaveGrid.vue'
import KnotWire from '../components/effects/KnotWire.vue'
import MeteorFlow from '../components/effects/MeteorFlow.vue'
import AntiGravityEffect from '../components/effects/AntiGravityEffect.vue'
import ParticleRose from '../components/effects/ParticleRose.vue'
import { effects, toggleParticleTrail } from '../stores/effects'
import { settings, setBackground } from '../stores/settings'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const bgInput = ref(settings.background)

function applyBackground() {
  setBackground(bgInput.value.trim())
}

function clearBackground() {
  bgInput.value = ''
  setBackground('')
}

// ============ 背景图上传 ============
const REPO = 'wmoonlq/blog'
const API = 'https://api.github.com'
const UPLOAD_PWD = '123456'
const TOKEN_KEY = 'notes-token'

const pwd = ref('')
const bgFile = ref(null)
const bgPreview = ref('')
const uploading = ref(false)
const uploadMsg = ref('')

function setBgFile(file) {
  bgFile.value = file
  uploadMsg.value = ''
  if (bgPreview.value) URL.revokeObjectURL(bgPreview.value)
  bgPreview.value = file ? URL.createObjectURL(file) : ''
}

function pickFile(e) {
  setBgFile(e.target.files[0] || null)
}

function onPaste(e) {
  const items = e.clipboardData && e.clipboardData.items
  if (!items) return
  for (const it of items) {
    if (it.type && it.type.startsWith('image/')) {
      const file = it.getAsFile()
      if (file) {
        e.preventDefault()
        const name = file.name || `clipboard-${Date.now()}.png`
        const renamed = new File([file], name, { type: file.type })
        setBgFile(renamed)
        uploadMsg.value = `已粘贴截图：${name}（${(file.size / 1024).toFixed(0)} KB）`
      }
      break
    }
  }
}

onMounted(() => document.addEventListener('paste', onPaste))
onBeforeUnmount(() => {
  document.removeEventListener('paste', onPaste)
  if (bgPreview.value) URL.revokeObjectURL(bgPreview.value)
})

function fillPwd() {
  pwd.value = UPLOAD_PWD
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const dataUrl = r.result
      const idx = dataUrl.indexOf(',')
      resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl)
    }
    r.onerror = () => reject(new Error('读取文件失败'))
    r.readAsDataURL(file)
  })
}

async function uploadBg() {
  uploadMsg.value = ''
  if (!bgFile.value) {
    uploadMsg.value = '请先选择图片'
    return
  }
  if (pwd.value !== UPLOAD_PWD) {
    uploadMsg.value = '上传密码不正确'
    return
  }
  const file = bgFile.value
  if (file.size > 5 * 1024 * 1024) {
    uploadMsg.value = '图片不能超过 5MB'
    return
  }
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) {
    uploadMsg.value = '需要 GitHub Token（与随笔编辑器共用，可前往随笔页填写）'
    return
  }

  uploading.value = true
  try {
    const ext = (file.name.match(/\.(png|jpe?g|webp|gif|avif)$/i) || ['.jpg'])[0]
    const name = `bg-${Date.now()}${ext}`
    const content = await fileToBase64(file)
    const res = await fetch(`${API}/repos/${REPO}/contents/public/bg/${name}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        message: `feat: upload blog background ${name}`,
        content
      })
    })
    if (!res.ok) {
      let detail = ''
      try {
        detail = (await res.json()).message || ''
      } catch {
        /* ignore */
      }
      throw new Error(`上传失败（${res.status}）${detail ? `：${detail}` : ''}`)
    }
    setBackground(`/blog/bg/${name}`)
    bgInput.value = `/blog/bg/${name}`
    uploadMsg.value = '上传成功，背景已应用'
    pwd.value = ''
    bgFile.value = null
    e && e.target && (e.target.value = '')
  } catch (err) {
    uploadMsg.value = err.message
  } finally {
    uploading.value = false
  }
}

const effectsList = [
  { title: '打字机', sub: '逐字敲出，光标闪烁', component: TypewriterEffect },
  { title: '字符雨', sub: '单色字符垂直坠落', component: CharRainEffect, canvas: true },
  { title: '逐字浮现', sub: '文字按节奏次第点亮', component: CharRevealEffect },
  { title: '磁性按钮', sub: '按钮被光标轻轻吸动', component: MagneticEffect },
  { title: '数字时钟', sub: '衬线数字，精确到秒', component: DigitalClock },
  { title: '点击涟漪', sub: '点击水面，波纹荡开', component: RippleEffect, canvas: true },
  { title: '呼吸圆', sub: '跟随节奏一吸一呼', component: BreathingCircle },
  { title: '光标残影', sub: '移动鼠标，字符尾随', component: EchoTrail },
  { title: '烟花', sub: '点击夜空，绽放一瞬', component: FireworksEffect, canvas: true },
  { title: '落雪', sub: '雪花无声，缓缓飘落', component: SnowfallEffect, canvas: true },
  { title: '立体卡片', sub: '跟随光标，旋转立起', component: TiltCardEffect },
  { title: '逐字律动', sub: '每个字都有自己的节拍', component: TextPulseEffect },
  { title: '粒子星云', sub: '900 颗粒子在暗夜中流转', component: ParticleNebula, canvas: true },
  { title: '波形网格', sub: '正弦波在网格上起伏', component: WaveGrid, canvas: true },
  { title: '莫比乌斯环', sub: '线框环结，永无止境', component: KnotWire, canvas: true },
  { title: '流星雨', sub: '粒子倾斜坠落，如雨如流', component: MeteorFlow, canvas: true },
  { title: '反重力方块', sub: '方块堆在地面，被光标轻轻举起', component: AntiGravityEffect, canvas: true },
  { title: '粒子玫瑰', sub: '四千粒子，聚成一朵玫瑰', component: ParticleRose, canvas: true }
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">好看的前端特效</h1>
      <p class="hero-sub">一些在克制配色下仍然好看的动效</p>
    </header>
    <div class="effects-grid">
      <section class="effect-card settings-card">
        <h2 class="effect-title">全局特效</h2>
        <p class="effect-sub">开启后作用于全站所有页面，设置会保存在本地</p>
        <div class="settings-list">
          <div class="switch-row">
            <span class="switch-label">粒子轨迹</span>
            <button
              class="switch"
              :class="{ on: effects.particleTrail }"
              :aria-pressed="effects.particleTrail"
              @click="toggleParticleTrail(!effects.particleTrail)"
            ></button>
          </div>
          <div class="bg-settings">
            <div class="switch-row">
              <span class="switch-label">背景图片</span>
              <button
                v-if="settings.background"
                class="advanced-toggle"
                @click="clearBackground"
              >清除</button>
            </div>
            <div class="bg-input-row">
              <input
                v-model="bgInput"
                class="input"
                type="url"
                placeholder="图片 URL（https://…）"
                @keydown.enter="applyBackground"
              />
              <button class="btn btn-sm" @click="applyBackground">应用</button>
            </div>
            <p class="token-hint">
              全站背景将显示该图片，正文区域自动加遮罩保持可读；设置保存在本地。
            </p>
              <div class="bg-upload">
                <div class="switch-row">
                  <span class="switch-label">上传背景图到 GitHub</span>
                </div>
                <div class="bg-upload-row">
                  <input
                    class="input bg-file-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                    @change="pickFile"
                  />
                </div>
                <p class="token-hint">也可以直接 <b>Ctrl / ⌘ + V</b> 粘贴截图（无需选文件）。</p>
                <div v-if="bgPreview" class="bg-preview">
                  <img :src="bgPreview" alt="背景预览" />
                </div>
                <div class="bg-upload-row">
                  <input
                    v-model="pwd"
                    class="input"
                    type="password"
                    placeholder="上传密码"
                    @keydown.enter="uploadBg"
                  />
                  <button class="btn btn-sm" @click="fillPwd">一键填充</button>
                  <button class="btn btn-sm" :disabled="uploading" @click="uploadBg">
                    {{ uploading ? '上传中…' : '上传' }}
                  </button>
                </div>
                <p class="token-hint">上传需密码校验（防止人机刷取）；图片保存至仓库 <code>public/bg/</code>，上限 5MB。</p>
                <p v-if="uploadMsg" class="editor-msg">{{ uploadMsg }}</p>
              </div>
          </div>
        </div>
      </section>
      <section v-for="fx in effectsList" :key="fx.title" class="effect-card">
        <h2 class="effect-title">{{ fx.title }}</h2>
        <p class="effect-sub">{{ fx.sub }}</p>
        <div class="effect-demo" :class="{ 'canvas-demo': fx.canvas }">
          <component :is="fx.component" />
        </div>
      </section>
    </div>
  </div>
</template>
