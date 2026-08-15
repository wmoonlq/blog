import { reactive } from 'vue'

const KEY = 'blog-user'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

function genId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  )
}

const saved = load()

export const user = reactive({
  id: saved.id || genId(),
  nickname: saved.nickname || ''
})

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ ...user }))
}

// 初始化即持久化一次（首次访问生成 ID）
persist()

export function setNickname(name) {
  user.nickname = name
  persist()
}

// 上传记录归属标记：任何上传都带上当前用户 ID
export function tagForUpload() {
  return {
    uid: user.id,
    nick: user.nickname || '匿名'
  }
}
