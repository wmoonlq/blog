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
const editingSha = ref(null)

const form = reactive({
  filename: '',
  title: '',
  date: '',
  content: ''
})

const preview = computed(() => renderMarkdown(form.content))

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
  await loadFiles()
}

async function loadFiles() {
  if (!token.value) return
  loading.value = true
  message.value = ''
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/src/notes`, {
      headers: headers()
    })
    if (!res.ok) throw new Error(`加载失败（${res.status}），请检查 Token`)
    files.value = await res.json()
  } catch (e) {
    message.value = e.message
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
  } catch (e) {
    message.value = e.message
  }
}

function resetForm() {
  form.filename = ''
  form.title = ''
  form.date = ''
  form.content = ''
  editingSha.value = null
  message.value = ''
}

async function save() {
  if (!form.filename.trim()) {
    message.value = '请填写文件名'
    return
  }
  if (!form.date) {
    message.value = '请填写日期'
    return
  }
  const name = form.filename.trim().endsWith('.md')
    ? form.filename.trim()
    : `${form.filename.trim()}.md`
  const titleLine = form.title.trim() ? `title: "${form.title.trim()}"\n` : ''
  const content = `---\ndate: "${form.date}"\n${titleLine}---\n\n${form.content.trimEnd()}\n`

  saving.value = true
  message.value = ''
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/src/notes/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: editingSha.value ? `docs: update note ${name}` : `feat: add note ${name}`,
        content: b64(content),
        sha: editingSha.value || undefined
      })
    })
    if (!res.ok) throw new Error(`保存失败（${res.status}）`)
    message.value = '已提交到 GitHub，等待自动构建发布'
    await loadFiles()
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
    await loadFiles()
  } catch (e) {
    message.value = e.message
  }
}

onMounted(() => {
  if (token.value) loadFiles()
})
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">随笔编辑</h1>
      <p class="hero-sub">在网页上直接增删改 src/notes/ 下的随笔，文件仍保存在 GitHub</p>
    </header>

    <section class="editor-card">
      <div class="token-row">
        <input
          v-model="token"
          type="password"
          class="input token-input"
          placeholder="GitHub Token（仅保存在本机浏览器）"
        />
        <button class="btn" @click="saveToken">连接</button>
      </div>
      <p class="token-hint">
        建议创建仅限本仓库的 fine-grained Token（Contents 读写权限），访问
        github.com → Settings → Developer settings → Fine-grained tokens
      </p>
      <p v-if="message" class="editor-msg">{{ message }}</p>
      <div v-if="files.length" class="file-list">
        <div v-for="f in files" :key="f.name" class="file-row">
          <span class="file-name">{{ f.name }}</span>
          <button class="btn btn-sm" @click="editFile(f.name, f.sha)">编辑</button>
          <button class="btn btn-sm" @click="remove(f.name, f.sha)">删除</button>
        </div>
      </div>
    </section>

    <section class="editor-card">
      <div class="field">
        <label class="field-label">文件名</label>
        <input v-model="form.filename" class="input" placeholder="如 evening-thoughts（无需 .md）" />
      </div>
      <div class="field-row">
        <div class="field">
          <label class="field-label">标题（可选）</label>
          <input v-model="form.title" class="input" placeholder="随笔标题" />
        </div>
        <div class="field">
          <label class="field-label">日期</label>
          <input v-model="form.date" type="date" class="input" />
        </div>
      </div>
      <div class="editor-split">
        <div class="field">
          <label class="field-label">正文（Markdown）</label>
          <textarea
            v-model="form.content"
            class="textarea"
            rows="14"
            placeholder="随手写点什么…"
          ></textarea>
        </div>
        <div class="field">
          <label class="field-label">预览</label>
          <div class="prose editor-preview" v-html="preview"></div>
        </div>
      </div>
      <div class="editor-actions">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          {{ saving ? '保存中…' : '保存到 GitHub' }}
        </button>
        <button v-if="editingSha" class="btn" @click="resetForm">新建</button>
      </div>
    </section>
  </div>
</template>
