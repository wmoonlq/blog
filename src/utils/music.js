import { parseFrontmatter } from './frontmatter'

const modules = import.meta.glob('../music/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

export function getAllMusic() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: path.split('/').pop().replace(/\.md$/, ''),
        title: data.title || '未命名',
        artist: data.artist || '',
        date: data.date || '',
        source: data.source || '',
        cover: data.cover || '',
        content
      }
    })
    .filter((m) => m.source)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
