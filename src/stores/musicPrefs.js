import { reactive, watch } from 'vue'

const FAV_KEY = 'music-favorites'
const PL_KEY = 'music-playlists'
const HIST_KEY = 'music-history'

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return v == null ? fallback : v
  } catch {
    return fallback
  }
}

function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* ignore */
  }
}

export const prefs = reactive({
  favorites: load(FAV_KEY, []), // slug[]
  playlists: load(PL_KEY, []), // [{ id, name, slugs: [] }]
  history: load(HIST_KEY, []) // slug[] 最近播放，最新在前
})

watch(
  () => prefs.favorites,
  (v) => save(FAV_KEY, v),
  { deep: true }
)
watch(
  () => prefs.playlists,
  (v) => save(PL_KEY, v),
  { deep: true }
)
watch(
  () => prefs.history,
  (v) => save(HIST_KEY, v),
  { deep: true }
)

export function isFavorite(slug) {
  return prefs.favorites.includes(slug)
}

export function toggleFavorite(slug) {
  const i = prefs.favorites.indexOf(slug)
  if (i >= 0) prefs.favorites.splice(i, 1)
  else prefs.favorites.unshift(slug)
}

export function pushHistory(slug) {
  if (!slug) return
  prefs.history = [slug, ...prefs.history.filter((s) => s !== slug)].slice(0, 100)
}

export function createPlaylist(name) {
  const id = `pl-${Date.now()}`
  prefs.playlists.push({ id, name: name || '未命名歌单', slugs: [] })
  return id
}

export function removePlaylist(id) {
  const i = prefs.playlists.findIndex((p) => p.id === id)
  if (i >= 0) prefs.playlists.splice(i, 1)
}

export function renamePlaylist(id, name) {
  const p = prefs.playlists.find((p) => p.id === id)
  if (p) p.name = name || p.name
}

export function addToPlaylist(pid, slug) {
  const p = prefs.playlists.find((p) => p.id === pid)
  if (p && !p.slugs.includes(slug)) p.slugs.push(slug)
}

export function removeFromPlaylist(pid, slug) {
  const p = prefs.playlists.find((p) => p.id === pid)
  if (p) p.slugs = p.slugs.filter((s) => s !== slug)
}

export function isInPlaylist(pid, slug) {
  const p = prefs.playlists.find((p) => p.id === pid)
  return !!p && p.slugs.includes(slug)
}

export function moveInPlaylist(pid, slug, dir) {
  const p = prefs.playlists.find((p) => p.id === pid)
  if (!p) return
  const i = p.slugs.indexOf(slug)
  if (i < 0) return
  const j = i + dir
  if (j < 0 || j >= p.slugs.length) return
  const tmp = p.slugs[i]
  p.slugs[i] = p.slugs[j]
  p.slugs[j] = tmp
}
