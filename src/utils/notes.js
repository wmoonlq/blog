import { parseFrontmatter } from './frontmatter'

const modules = import.meta.glob('../notes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

export function getAllNotes() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: path.split('/').pop().replace(/\.md$/, ''),
        title: data.title || '',
        date: data.date || '',
        content
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
