import { reactive, watch } from 'vue'

const KEY = 'settings'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const saved = load()

export const settings = reactive({
  theme: saved.theme || 'light',
  fontSize: saved.fontSize || 16,
  notes: Array.isArray(saved.notes) ? saved.notes : [],
  background: saved.background || ''
})

watch(
  () => settings.theme,
  (v) => {
    document.documentElement.dataset.theme = v
  },
  { immediate: true }
)

function persist() {
  localStorage.setItem(KEY, JSON.stringify({ ...settings }))
}

watch(settings, persist, { deep: true })

export function toggleTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light'
}

export function setBackground(url) {
  settings.background = url
}

export function setFontSize(size) {
  settings.fontSize = Math.min(20, Math.max(14, size))
}

export function addNote(text) {
  settings.notes.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text,
    createdAt: Date.now()
  })
}

export function removeNote(id) {
  settings.notes = settings.notes.filter((n) => n.id !== id)
}
