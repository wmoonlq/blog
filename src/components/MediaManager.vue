<script setup>
import { ref } from 'vue'
import { checkPassword, getToken, fileToBase64, uploadFile } from '../utils/githubFiles'

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
  try {
    const ext = (file.value.name.match(/\.[a-zA-Z0-9]+$/) || ['.mp4'])[0].toLowerCase()
    const name = `${props.kind}-${Date.now()}${ext}`
    const content = await fileToBase64(file.value)

    await uploadFile({
      path: `${props.mediaDir}/${name}`,
      content,
      message: `feat: upload ${props.kind} ${name}`,
      token
    })

    // 元数据 md
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
    const mdName = `${props.kind}-${Date.now()}.md`
    await uploadFile({
      path: `${props.metaDir}/${mdName}`,
      content: mdContent,
      message: `feat: add ${props.kind} meta ${mdName}`,
      token
    })

    msg.value = '上传成功，等待自动构建发布'
    emit('uploaded')
    resetForm()
  } catch (e) {
    msg.value = e.message
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <section class="editor-card media-manager">
    <h2 class="effect-title">上传{{ kind === 'video' ? '视频' : '音乐' }}</h2>
    <p class="effect-sub">文件将保存至 GitHub 仓库，需操作密码（防止人机刷取）</p>

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
    <p v-if="msg" class="editor-msg">{{ msg }}</p>
  </section>
</template>
