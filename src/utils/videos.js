import { parseFrontmatter } from './frontmatter'
import videoMeta from '../videos/video-meta.json'

const modules = import.meta.glob('../videos/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

export function getCategories() {
  return Array.isArray(videoMeta.categories) ? [...videoMeta.categories] : []
}

export function getCollections() {
  return (videoMeta.collections || [])
    .slice()
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

function resolveCollections(ids, legacy) {
  const all = getCollections()
  const map = new Map(all.map((c) => [c.id, c]))
  const byName = new Map(all.map((c) => [c.name, c]))
  const out = []
  ;(Array.isArray(ids) ? ids : []).forEach((id) => {
    const c = map.get(id)
    if (c && !out.some((x) => x.id === c.id)) out.push(c)
  })
  // 兼容旧字段 collection: "名称"（上传/下载流程仍写该字段），先按名称匹配清单，未命中则生成临时集合
  if (!out.length && legacy) {
    out.push(byName.get(legacy) || { id: legacy, name: legacy, description: '', sort: 999 })
  }
  return out
}

export function getAllVideos() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: path.split('/').pop().replace(/\.md$/, ''),
        title: data.title || '未命名视频',
        date: data.date || '',
        source: data.source || '',
        type: data.type || 'video',
        poster: data.poster || '',
        category: data.category || '未分类',
        collections: resolveCollections(data.collections, data.collection),
        content
      }
    })
    .filter((v) => v.source)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function isBilibili(url) {
  return /bilibili\.com|bilibili/i.test(url) && /player\.bilibili\.com/.test(url)
}

export function toEmbedUrl(source) {
  if (isBilibili(source)) return source
  return source
}
