<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { renderMarkdown } from '../utils/markdown'
import { parseFrontmatter } from '../utils/frontmatter'
import { readingTime } from '../utils/format'

const props = defineProps({
  dir: { type: String, required: true }, // 'posts' | 'notes'
  initialFile: { type: String, default: '' }
})

const REPO = 'wmoonlq/blog'
const API = 'https://api.github.com'
const TOKEN_KEY = 'notes-token'
const DRAFT_KEY = `draft:${props.dir}`
const isPosts = computed(() => props.dir === 'posts')

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const files = ref([])
const loading = ref(false)
const saving = ref(false)
const message = ref('')
const connStatus = ref('none')
const editingSha = ref(null)
const showAdvanced = ref(false)

const form = reactive({
  filename: '',
  title: '',
  date: new Date().toISOString().slice(0, 10),
  tags: '',
  content: ''
})

const preview = computed(() => renderMarkdown(form.content))

const wordCount = computed(() => {
  const text = form.content.replace(/\s+/g, '')
  return text.length
})

const editMode = ref('split') // 'edit' | 'preview' | 'split'

const hasDraft = ref(false)

let saveTimer = null

function persistDraft() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    if (!form.content && !form.title) {
      hasDraft.value = false
      return
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...form, savedAt: Date.now() })
    )
    hasDraft.value = true
  }, 800)
}

watch(() => ({ ...form }), persistDraft, { deep: true })

function restoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    if (!draft.content && !draft.title) return
    Object.assign(form, draft)
    hasDraft.value = true
  } catch {
    /* ignore */
  }
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY)
  hasDraft.value = false
}

const autoName = computed(() => {
  const slug = (form.title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
  if (isPosts.value) return `${slug || 'post'}.md`
  return `${form.date}-${slug || 'note'}.md`
})

function headers() {
  return {
    Authorization: `Bearer ${token.value}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

function b64(text) {
  return btoa(unescape(encodeURIComponent(text)))
}

function deb64(text) {
  return decodeURIComponent(escape(atob(text)))
}

function buildContent() {
  const body = `${form.content.trimEnd()}\n`
  if (isPosts.value) {
    const title = form.title.trim() || '未命名'
    const tags = form.tags
      .trim()
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
    return `---\ntitle: "${title}"\ndate: "${form.date}"\ntags: [${tags.map((t) => `"${t}"`).join(', ')}]\n---\n\n${body}`
  }
  const titleLine = form.title.trim() ? `title: "${form.title.trim()}"\n` : ''
  return `---\ndate: "${form.date}"\n${titleLine}---\n\n${body}`
}

async function saveToken() {
  localStorage.setItem(TOKEN_KEY, token.value)
  message.value = ''
  await checkConnection()
}

async function checkConnection() {
  if (!token.value) return
  loading.value = true
  message.value = ''
  connStatus.value = 'checking'
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/src/${props.dir}`, {
      headers: headers()
    })
    if (!res.ok) throw new Error(`连接失败（${res.status}），请检查 Token`)
    files.value = await res.json()
    connStatus.value = 'ok'
  } catch (e) {
    message.value = e.message
    connStatus.value = 'fail'
  } finally {
    loading.value = false
  }
}

async function editFile(name, sha) {
  message.value = ''
  try {
    const res = await fetch(
      `${API}/repos/${REPO}/contents/src/${props.dir}/${encodeURIComponent(name)}`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`读取失败（${res.status}）`)
    const data = await res.json()
    const { data: meta, content } = parseFrontmatter(deb64(data.content))
    form.filename = name.replace(/\.md$/, '')
    form.title = meta.title || ''
    form.date = meta.date || ''
    form.tags = Array.isArray(meta.tags) ? meta.tags.join(', ') : ''
    form.content = content
    editingSha.value = sha
    message.value = ''
    clearDraft()
  } catch (e) {
    message.value = e.message
  }
}

function resetForm() {
  form.filename = ''
  form.title = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.tags = ''
  form.content = ''
  editingSha.value = null
  message.value = ''
  clearDraft()
}

async function save() {
  if (!token.value) {
    showAdvanced.value = true
    message.value = '请先在高级选项中连接 GitHub Token'
    return
  }
  if (isPosts.value && !form.title.trim()) {
    message.value = '请填写标题'
    return
  }
  if (!form.date) {
    message.value = '请填写日期'
    return
  }
  const name = form.filename.trim() || autoName.value
  const finalName = name.endsWith('.md') ? name : `${name}.md`

  let sha = editingSha.value
  let isUpdate = !!sha
  if (!sha) {
    const existing = files.value.find((f) => f.name === finalName)
    if (existing) {
      sha = existing.sha
      isUpdate = true
    }
  }

  const kind = isPosts.value ? 'post' : 'note'
  saving.value = true
  message.value = ''
  try {
    const res = await fetch(
      `${API}/repos/${REPO}/contents/src/${props.dir}/${encodeURIComponent(finalName)}`,
      {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: isUpdate ? `docs: update ${kind} ${finalName}` : `feat: add ${kind} ${finalName}`,
          content: b64(buildContent()),
          sha: sha || undefined
        })
      }
    )
    if (!res.ok) {
      let detail = ''
      try {
        const j = await res.json()
        detail = j.message || ''
      } catch {
        /* ignore */
      }
      throw new Error(`保存失败（${res.status}）${detail ? `：${detail}` : ''}`)
    }
    message.value = isUpdate ? '已更新，等待自动构建发布' : '已提交到 GitHub，等待自动构建发布'
    clearDraft()
    await checkConnection()
  } catch (e) {
    message.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(name, sha) {
  if (!window.confirm(`删除 ${name}？`)) return
  message.value = ''
  try {
    const res = await fetch(
      `${API}/repos/${REPO}/contents/src/${props.dir}/${encodeURIComponent(name)}`,
      {
        method: 'DELETE',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `docs: delete ${isPosts.value ? 'post' : 'note'} ${name}`,
          sha
        })
      }
    )
    if (!res.ok) throw new Error(`删除失败（${res.status}）`)
    message.value = '已删除'
    await checkConnection()
  } catch (e) {
    message.value = e.message
  }
}

let pendingFile = null

function loadInitialFile() {
  if (!pendingFile) return
  const target = pendingFile
  pendingFile = null
  const f = files.value.find((x) => x.name === target)
  if (f) {
    editFile(f.name, f.sha)
  } else {
    message.value = `未找到文件 ${target}`
  }
}

onMounted(async () => {
  restoreDraft()
  if (props.initialFile) pendingFile = props.initialFile
  if (token.value) {
    await checkConnection()
    loadInitialFile()
  }
})

watch(connStatus, (s) => {
  if (s === 'ok') loadInitialFile()
})
</script>

<template>
  <section class="editor-card">
    <div class="field">
      <label class="field-label">{{ isPosts ? '标题' : '标题（可选）' }}</label>
      <input v-model="form.title" class="input" placeholder="标题" />
    </div>
    <div v-if="isPosts" class="field">
      <label class="field-label">标签（逗号分隔）</label>
      <input v-model="form.tags" class="input" placeholder="如 Vue, 前端" />
    </div>
    <div class="editor-tabs">
      <button class="editor-tab" :class="{ on: editMode === 'edit' }" @click="editMode = 'edit'">编辑</button>
      <button class="editor-tab" :class="{ on: editMode === 'split' }" @click="editMode = 'split'">分屏</button>
      <button class="editor-tab" :class="{ on: editMode === 'preview' }" @click="editMode = 'preview'">预览</button>
    </div>
    <div class="editor-split" :class="{ single: editMode !== 'split' }">
      <div v-show="editMode !== 'preview'">
        <label class="field-label">正文（Markdown）</label>
        <textarea
          v-model="form.content"
          class="textarea"
          rows="12"
          placeholder="写点什么…"
        ></textarea>
      </div>
      <div v-show="editMode !== 'edit'">
        <label class="field-label">预览</label>
        <div class="prose editor-preview" v-html="preview"></div>
      </div>
    </div>
    <div class="editor-stats">
      <span>{{ wordCount }} 字 · 约 {{ readingTime(form.content) }} 分钟读完</span>
      <span v-if="hasDraft" class="draft-badge">草稿已保存</span>
    </div>
    <div class="editor-actions">
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? '保存中…' : '保存到 GitHub' }}
      </button>
      <button v-if="editingSha" class="btn" @click="resetForm">新建</button>
    </div>
    <p v-if="message" class="editor-msg">{{ message }}</p>
  </section>

  <section class="editor-card">
    <button class="advanced-toggle" @click="showAdvanced = !showAdvanced">
      {{ showAdvanced ? '收起' : '展开' }}高级选项{{ showAdvanced ? '▴' : '▾' }}
    </button>
    <div v-show="showAdvanced">
      <div class="token-row advanced-block">
        <input
          v-model="token"
          type="password"
          class="input token-input"
          placeholder="GitHub Token（仅保存在本机浏览器）"
        />
        <button class="btn" @click="saveToken">连接</button>
      </div>
      <p v-if="connStatus !== 'none'" class="conn-status" :class="connStatus">
        <template v-if="connStatus === 'checking'">正在连接…</template>
        <template v-else-if="connStatus === 'ok'">✓ 连接成功，Token 有效</template>
        <template v-else>✗ 连接失败，请检查 Token 是否正确</template>
      </p>
      <p class="token-hint">
        建议创建仅限本仓库的 fine-grained Token（Contents 读写权限），访问
        github.com → Settings → Developer settings → Fine-grained tokens
      </p>
      <div v-if="loading" class="editor-msg">加载中…</div>
      <div v-else-if="files.length" class="file-list">
        <div v-for="f in files" :key="f.name" class="file-row">
          <span class="file-name">{{ f.name }}</span>
          <button class="btn btn-sm" @click="editFile(f.name, f.sha)">编辑</button>
          <button class="btn btn-sm" @click="remove(f.name, f.sha)">删除</button>
        </div>
      </div>
      <div class="advanced-block">
        <div class="field">
          <label class="field-label">文件名（默认自动生成）</label>
          <input v-model="form.filename" class="input" :placeholder="autoName" />
        </div>
        <div class="field">
          <label class="field-label">日期</label>
          <input v-model="form.date" type="date" class="input" />
        </div>
      </div>
    </div>
  </section>
</template>
