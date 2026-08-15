<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { checkPassword, getToken, fileToBase64Worker, terminateWorker, uploadFileXhr } from '../utils/githubFiles'

const props = defineProps({
  kind: { type: String, required: true }, // 'video' | 'music'
  mediaDir: { type: String, required: true }, // 'public/videos' | 'public/music'
  metaDir: { type: String, required: true }, // 'src/videos' | 'src/music'
  accept: { type: String, default: 'video/mp4,video/webm,video/ogg' },
  maxMB: { type: Number, default: 50 }
})

const emit = defineEmits(['uploaded'])

const pwd = ref('')
const file = ref(null)
const title = ref('')
const artist = ref('')
const category = ref('')
const collection = ref('')
const uploading = ref(false)
const msg = ref('')
const phase = ref('') // 'read' | 'upload'
const progress = ref(0) // 0-100

const progressLabel = computed(() => {
  if (!uploading.value) return ''
  if (phase.value === 'read') return `后台读取 ${progress.value.toFixed(0)}%`
  return `上传中 ${progress.value.toFixed(0)}%`
})

function fillPwd() {
  pwd.value = '123456'
}

function pickFile(e) {
  file.value = e.target.files[0] || null
  msg.value = ''
  if (file.value && !title.value) {
    title.value = file.value.name.replace(/\.[^.]+$/, '')
  }
}

function resetForm() {
  pwd.value = ''
  file.value = null
  title.value = ''
  artist.value = ''
  category.value = ''
  collection.value = ''
  msg.value = ''
}

async function upload() {
  msg.value = ''
  if (!file.value) {
    msg.value = '请先选择文件'
    return
  }
  if (!checkPassword(pwd.value)) {
    msg.value = '操作密码不正确'
    return
  }
  const token = getToken()
  if (!token) {
    msg.value = '需要 GitHub Token（与随笔编辑器共用，可前往随笔页填写）'
    return
  }
  if (file.value.size > props.maxMB * 1024 * 1024) {
    msg.value = `文件不能超过 ${props.maxMB}MB`
    return
  }

  uploading.value = true
  progress.value = 0
  try {
    const ext = (file.value.name.match(/\.[a-zA-Z0-9]+$/) || ['.mp4'])[0].toLowerCase()
    const name = `${props.kind}-${Date.now()}${ext}`
    const ts = Date.now()

    // 阶段 1：Worker 后台分块读取 base64（0-45%）
    phase.value = 'read'
    const content = await fileToBase64Worker(file.value, (done, total) => {
      progress.value = total ? (done / total) * 45 : 0
    })

    // 阶段 2：XHR 上传文件（45-80%）
    phase.value = 'upload'
    await uploadFileXhr({
      path: `${props.mediaDir}/${name}`,
      content,
      message: `feat: upload ${props.kind} ${name}`,
      token,
      onProgress: (loaded, total) => {
        progress.value = 45 + (total ? (loaded / total) * 35 : 0)
      }
    })
    progress.value = 80

    // 阶段 3：元数据 md（80-100%）
    const t = title.value.trim() || name
    const lines = [`---`, `title: "${t}"`, `date: "${new Date().toISOString().slice(0, 10)}"`, `source: "/blog/${props.mediaDir.replace('public/', '')}/${name}"`]
    if (props.kind === 'video') {
      if (category.value.trim()) lines.push(`category: "${category.value.trim()}"`)
      if (collection.value.trim()) lines.push(`collection: "${collection.value.trim()}"`)
    } else {
      if (artist.value.trim()) lines.push(`artist: "${artist.value.trim()}"`)
    }
    lines.push(`type: "${props.kind}"`, `---`, '', t)

    const mdContent = btoa(unescape(encodeURIComponent(lines.join('\n'))))
    const mdName = `${props.kind}-${ts}.md`
    await uploadFileXhr({
      path: `${props.metaDir}/${mdName}`,
      content: mdContent,
      message: `feat: add ${props.kind} meta ${mdName}`,
      token
    })
    progress.value = 100

    msg.value = '上传成功，等待自动构建发布'
    emit('uploaded')
    resetForm()
  } catch (e) {
    msg.value = e.message
  } finally {
    uploading.value = false
    phase.value = ''
    terminateWorker()
  }
}

onBeforeUnmount(() => {
  terminateWorker()
})
</script>

<template>
  <section class="editor-card media-manager">
    <h2 class="effect-title">上传{{ kind === 'video' ? '视频' : '音乐' }}</h2>
    <p class="effect-sub">文件将保存至 GitHub 仓库，需操作密码（防止人机刷取）；后台线程读取，不卡页面</p>

    <div class="field">
      <label class="field-label">文件</label>
      <input class="input bg-file-input" type="file" :accept="accept" @change="pickFile" />
    </div>
    <div class="field">
      <label class="field-label">标题</label>
      <input v-model="title" class="input" placeholder="标题" />
    </div>
    <div v-if="kind === 'music'" class="field">
      <label class="field-label">歌手 / 作者</label>
      <input v-model="artist" class="input" placeholder="歌手（可选）" />
    </div>
    <div v-if="kind === 'video'" class="field-row">
      <div class="field">
        <label class="field-label">分类（可选）</label>
        <input v-model="category" class="input" placeholder="如：自然、动画" />
      </div>
      <div class="field">
        <label class="field-label">合集（可选）</label>
        <input v-model="collection" class="input" placeholder="如：MDN 样片" />
      </div>
    </div>
    <div class="token-row">
      <input
        v-model="pwd"
        class="input"
        type="password"
        placeholder="操作密码"
        @keydown.enter="upload"
      />
      <button class="btn btn-sm" @click="fillPwd">一键填充</button>
    </div>
    <div class="editor-actions" style="margin-top: 12px">
      <button class="btn btn-primary" :disabled="uploading" @click="upload">
        {{ uploading ? '上传中…' : '上传' }}
      </button>
    </div>

    <div v-if="uploading" class="upload-progress">
      <div class="upload-progress-bar">
        <div class="upload-progress-fill" :style="{ width: `${progress}%` }"></div>
      </div>
      <p class="upload-progress-label">{{ progressLabel }}</p>
    </div>

    <p v-if="msg" class="editor-msg">{{ msg }}</p>
  </section>
</template>
