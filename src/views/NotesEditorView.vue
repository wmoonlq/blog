<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { renderMarkdown } from '../utils/markdown'
import { parseFrontmatter } from '../utils/frontmatter'

const REPO = 'wmoonlq/blog'
const API = 'https://api.github.com'

const token = ref(localStorage.getItem('notes-token') || '')
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
  content: ''
})

const preview = computed(() => renderMarkdown(form.content))

const autoName = computed(() => {
  const slug = (form.title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
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

async function saveToken() {
  localStorage.setItem('notes-token', token.value)
  message.value = ''
  await checkConnection()
}

async function checkConnection() {
  if (!token.value) return
  loading.value = true
  message.value = ''
  connStatus.value = 'checking'
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/src/notes`, {
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
      `${API}/repos/${REPO}/contents/src/notes/${encodeURIComponent(name)}`,
      { headers: headers() }
    )
    if (!res.ok) throw new Error(`读取失败（${res.status}）`)
    const data = await res.json()
    const { data: meta, content } = parseFrontmatter(deb64(data.content))
    form.filename = name.replace(/\.md$/, '')
    form.title = meta.title || ''
    form.date = meta.date || ''
    form.content = content
    editingSha.value = sha
    message.value = ''
  } catch (e) {
    message.value = e.message
  }
}

function resetForm() {
  form.filename = ''
  form.title = ''
  form.date = new Date().toISOString().slice(0, 10)
  form.content = ''
  editingSha.value = null
  message.value = ''
}

async function save() {
  if (!token.value) {
    showAdvanced.value = true
    message.value = '请先在高级选项中连接 GitHub Token'
    return
  }
  if (!form.date) {
    message.value = '请填写日期'
    return
  }
  const name = form.filename.trim() || autoName.value
  const finalName = name.endsWith('.md') ? name : `${name}.md`
  const titleLine = form.title.trim() ? `title: "${form.title.trim()}"\n` : ''
  const content = `---\ndate: "${form.date}"\n${titleLine}---\n\n${form.content.trimEnd()}\n`

  let sha = editingSha.value
  let isUpdate = !!sha
  if (!sha) {
    const existing = files.value.find((f) => f.name === finalName)
    if (existing) {
      sha = existing.sha
      isUpdate = true
    }
  }

  saving.value = true
  message.value = ''
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/src/notes/${encodeURIComponent(finalName)}`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: isUpdate ? `docs: update note ${finalName}` : `feat: add note ${finalName}`,
        content: b64(content),
        sha: sha || undefined
      })
    })
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
    message.value = isUpdate
      ? '已更新，等待自动构建发布'
      : '已提交到 GitHub，等待自动构建发布'
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
    const res = await fetch(`${API}/repos/${REPO}/contents/src/notes/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `docs: delete note ${name}`,
        sha
      })
    })
    if (!res.ok) throw new Error(`删除失败（${res.status}）`)
    message.value = '已删除'
    await checkConnection()
  } catch (e) {
    message.value = e.message
  }
}

onMounted(() => {
  if (token.value) checkConnection()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">写随笔</h1>
      <p class="hero-sub">随手记下的碎片，保存后自动发布</p>
    </header>

    <section class="editor-card">
      <div class="field">
        <label class="field-label">标题（可选）</label>
        <input v-model="form.title" class="input" placeholder="随笔标题" />
      </div>
      <div class="field">
        <label class="field-label">正文（Markdown）</label>
        <textarea
          v-model="form.content"
          class="textarea"
          rows="12"
          placeholder="随手写点什么…"
        ></textarea>
      </div>
      <div class="editor-preview-wrap">
        <label class="field-label">预览</label>
        <div class="prose editor-preview" v-html="preview"></div>
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
  </div>
</template>
