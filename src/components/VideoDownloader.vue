<script setup>
import { ref } from 'vue'
import { checkPassword, getToken, getFileSha, uploadFile } from '../utils/githubFiles'

const url = ref('')
const title = ref('')
const category = ref('')
const collection = ref('')
const pwd = ref('')
const submitting = ref(false)
const msg = ref('')

function fillPwd() {
  pwd.value = '123456'
}

function resetForm() {
  url.value = ''
  title.value = ''
  category.value = ''
  collection.value = ''
  pwd.value = ''
}

async function submit() {
  msg.value = ''
  const link = url.value.trim()
  if (!link) {
    msg.value = '请先粘贴视频链接'
    return
  }
  if (!/^https?:\/\/.+/i.test(link)) {
    msg.value = '链接需以 http(s):// 开头'
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

  submitting.value = true
  try {
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const payload = {
      url: link,
      title: title.value.trim(),
      category: category.value.trim(),
      collection: collection.value.trim(),
      date,
      requestedAt: new Date().toISOString(),
      status: 'queued'
    }
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    const path = 'downloads/queue.json'
    const sha = await getFileSha(path)
    await uploadFile({
      path,
      content,
      message: 'chore: queue video download',
      token,
      sha
    })
    msg.value = '已提交下载任务，服务器自动抓取（约 1-3 分钟），完成后自动发布上线'
    resetForm()
  } catch (e) {
    msg.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="editor-card media-manager">
    <h2 class="effect-title">从链接下载</h2>
    <p class="effect-sub">
      粘贴视频链接（B 站 / YouTube 等），由云端 yt-dlp 自动抓取为 720p 并发布到本站
    </p>

    <div class="field">
      <label class="field-label">视频链接（必填）</label>
      <input v-model="url" class="input" placeholder="https://…" @keydown.enter="submit" />
    </div>
    <div class="field">
      <label class="field-label">标题（可选）</label>
      <input v-model="title" class="input" placeholder="留空则用视频原名 / 链接生成" />
    </div>
    <div class="field-row">
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
        @keydown.enter="submit"
      />
      <button class="btn btn-sm" @click="fillPwd">一键填充</button>
    </div>
    <div class="editor-actions" style="margin-top: 12px">
      <button class="btn btn-primary" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中…' : '提交下载' }}
      </button>
    </div>

    <p v-if="msg" class="editor-msg">{{ msg }}</p>
  </section>
</template>
