<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { checkPassword, getToken, fileToBase64Worker, fileToBase64, terminateWorker, uploadFileXhr } from '../utils/githubFiles'

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
const coverFile = ref(null)
const lrcFile = ref(null)
const yrcFile = ref(null)
const title = ref('')
const artist = ref('')
const category = ref('')
const collection = ref('')
const uploading = ref(false)
const msg = ref('')
const phase = ref('') // 'read' | 'upload' | 'meta'
const progress = ref(0) // 0-100

const isMusic = computed(() => props.kind === 'music')

const progressLabel = computed(() => {
  if (!uploading.value) return ''
  if (phase.value === 'read') return `后台读取 ${progress.value.toFixed(0)}%`
  if (phase.value === 'meta') return `写入元数据 ${progress.value.toFixed(0)}%`
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
  coverFile.value = null
  lrcFile.value = null
  yrcFile.value = null
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
    msg.value = `文件不能超过 ${props.maxMB}MB（GitHub 单文件上限）`
    return
  }

  uploading.value = true
  progress.value = 0
  try {
    const ext = (file.value.name.match(/\.[a-zA-Z0-9]+$/) || ['.mp4'])[0].toLowerCase()
    const name = `${props.kind}-${Date.now()}`
    const source = `/blog/${props.mediaDir.replace('public/', '')}/${name}${ext}`

    // 阶段 1：后台读取主文件（0-32%）
    phase.value = 'read'
    const content = await fileToBase64Worker(file.value, (done, total) => {
      progress.value = total ? (done / total) * 32 : 0
    })

    // 阶段 2：上传主文件（32-55%）
    phase.value = 'upload'
    await uploadFileXhr({
      path: `${props.mediaDir}/${name}${ext}`,
      content,
      message: `feat: upload ${props.kind} ${name}${ext}`,
      token,
      onProgress: (loaded, total) => {
        progress.value = 32 + (total ? (loaded / total) * 23 : 0)
      }
    })

    let cover = ''
    let lyrics = ''
    let yrc = ''

    // 阶段 3：可选附件（音乐：封面/歌词/逐字歌词）
    if (isMusic.value) {
      if (coverFile.value && coverFile.value.size > 8 * 1024 * 1024) {
        throw new Error('封面不能超过 8MB')
      }
      if (lrcFile.value && lrcFile.value.size > 1024 * 1024) {
        throw new Error('歌词文件不能超过 1MB')
      }
      if (yrcFile.value && yrcFile.value.size > 1024 * 1024) {
        throw new Error('逐字歌词文件不能超过 1MB')
      }
      if (coverFile.value) {
        const cExt = (coverFile.value.name.match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0].toLowerCase()
        cover = `/blog/music/covers/${name}${cExt}`
        const coverContent = await fileToBase64(coverFile.value)
        await uploadFileXhr({
          path: `public/music/covers/${name}${cExt}`,
          content: coverContent,
          message: `feat: upload music cover ${name}${cExt}`,
          token,
          onProgress: (loaded, total) => {
            progress.value = 55 + (total ? (loaded / total) * 13 : 0)
          }
        })
      }
      if (lrcFile.value) {
        lyrics = `/blog/music/${name}.lrc`
        const lrcContent = await fileToBase64(lrcFile.value)
        await uploadFileXhr({
          path: `public/music/${name}.lrc`,
          content: lrcContent,
          message: `feat: upload music lyrics ${name}.lrc`,
          token,
          onProgress: (loaded, total) => {
            progress.value = 68 + (total ? (loaded / total) * 10 : 0)
          }
        })
      }
      if (yrcFile.value) {
        yrc = `/blog/music/${name}.yrc`
        const yrcContent = await fileToBase64(yrcFile.value)
        await uploadFileXhr({
          path: `public/music/${name}.yrc`,
          content: yrcContent,
          message: `feat: upload music yrc ${name}.yrc`,
          token,
          onProgress: (loaded, total) => {
            progress.value = 78 + (total ? (loaded / total) * 10 : 0)
          }
        })
      }
    }

    // 阶段 4：元数据 md（88-100%）
    phase.value = 'meta'
    progress.value = 88
    const t = title.value.trim() || name
    const lines = [
      '---',
      `title: "${t}"`,
      `date: "${new Date().toISOString().slice(0, 10)}"`,
      `source: "${source}"`
    ]
    if (isMusic.value) {
      if (artist.value.trim()) lines.push(`artist: "${artist.value.trim()}"`)
      if (cover) lines.push(`cover: "${cover}"`)
      if (lyrics) lines.push(`lyrics: "${lyrics}"`)
      if (yrc) lines.push(`yrc: "${yrc}"`)
    } else {
      if (category.value.trim()) lines.push(`category: "${category.value.trim()}"`)
      if (collection.value.trim()) lines.push(`collection: "${collection.value.trim()}"`)
    }
    lines.push(`type: "${props.kind}"`, '---', '', t)

    const mdContent = btoa(unescape(encodeURIComponent(lines.join('\n'))))
    const mdName = `${name}.md`
    await uploadFileXhr({
      path: `${props.metaDir}/${mdName}`,
      content: mdContent,
      message: `feat: add ${props.kind} meta ${mdName}`,
      token
    })
    progress.value = 100

    msg.value = '上传成功，等待自动构建发布'
    emit('uploaded', {
      slug: mdName.replace(/\.md$/, ''),
      title: t,
      date: new Date().toISOString().slice(0, 10),
      source,
      category: category.value.trim(),
      collection: collection.value.trim(),
      artist: artist.value.trim(),
      cover,
      lyrics,
      yrc
    })
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
    <h2 class="effect-title">上传{{ isMusic ? '音乐' : '视频' }}</h2>
    <p class="effect-sub">文件将保存至 GitHub 仓库，需操作密码（防止人机刷取）；后台线程读取，不卡页面</p>

    <div class="field">
      <label class="field-label">文件</label>
      <input class="input bg-file-input" type="file" :accept="accept" @change="pickFile" />
    </div>
    <div class="field">
      <label class="field-label">标题</label>
      <input v-model="title" class="input" placeholder="标题" />
    </div>
    <div v-if="isMusic" class="field">
      <label class="field-label">歌手 / 作者</label>
      <input v-model="artist" class="input" placeholder="歌手（可选）" />
    </div>
    <div v-if="isMusic" class="field-row">
      <div class="field">
        <label class="field-label">封面（可选）</label>
        <input class="input bg-file-input" type="file" accept="image/jpeg,image/png,image/webp" @change="coverFile = $event.target.files[0] || null" />
      </div>
      <div class="field">
        <label class="field-label">歌词 .lrc（可选）</label>
        <input class="input bg-file-input" type="file" accept=".lrc,.txt" @change="lrcFile = $event.target.files[0] || null" />
      </div>
    </div>
    <div v-if="isMusic" class="field">
      <label class="field-label">逐字歌词 .yrc（可选）</label>
      <input class="input bg-file-input" type="file" accept=".yrc,.txt" @change="yrcFile = $event.target.files[0] || null" />
    </div>
    <div v-if="!isMusic" class="field-row">
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
