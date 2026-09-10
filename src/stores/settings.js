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
  background: saved.background || '',
  navBackground: saved.navBackground || ''
})

watch(
  () => settings.theme,
  (v) => {
    document.documentElement.dataset.theme = v
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = v === 'dark' ? '#0F172A' : '#FCFDFF'
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

export function setNavBackground(url) {
  settings.navBackground = url
}

export function setFontSize(size) {
  settings.fontSize = Math.min(20, Math.max(14, size))
}
