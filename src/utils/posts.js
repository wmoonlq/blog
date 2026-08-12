const modules = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    } else {
      value = value.replace(/^["']|["']$/g, '')
    }
    data[key] = value
  }

  return { data, content: raw.slice(match[0].length).trimStart() }
}

export function getAllPosts() {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw)
      return {
        slug: path.split('/').pop().replace(/\.md$/, ''),
        title: data.title || '未命名',
        date: data.date || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        content
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPostBySlug(slug) {
  return getAllPosts().find((p) => p.slug === slug) || null
}
