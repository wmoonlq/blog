import { parseFrontmatter } from './frontmatter'

const modules = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const MARKDOWN_STRIP = /[#>*`_~\-\[\]()!|]/g

function excerptOf(content) {
  const line = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !/^!\[/.test(l))
  if (!line) return ''
  const text = line.replace(MARKDOWN_STRIP, '').replace(/\s+/g, ' ').trim()
  return text.length > 88 ? text.slice(0, 88) + '…' : text
}

export function getAllPosts() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: path.split('/').pop().replace(/\.md$/, ''),
        title: data.title || '未命名',
        date: data.date || '',
        updated: data.updated || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: data.category || '',
        cover: data.cover || '',
        pinned: data.pinned === 'true' || data.pinned === true,
        excerpt: excerptOf(content),
        content
      }
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return a.date < b.date ? 1 : -1
    })
}

export function getPostBySlug(slug) {
  return getAllPosts().find((p) => p.slug === slug) || null
}
