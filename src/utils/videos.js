import { parseFrontmatter } from './frontmatter'

const modules = import.meta.glob('../videos/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

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
