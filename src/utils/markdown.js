import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: false })

const slugCache = new Map()

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function slugify(text) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const key = `${base}`
  const count = slugCache.get(key) || 0
  slugCache.set(key, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = tokens.map((t) => t.text ?? '').join('')
      const id = slugify(text)
      return `<h${depth} id="${id}">${escapeHtml(text)}</h${depth}>`
    },
    code({ text, lang }) {
      const className = lang ? ` class="language-${lang}"` : ''
      const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
      return `<div class="code-wrap">${label}<button class="code-copy" aria-label="复制代码">复制</button><pre><code${className}>${escapeHtml(text)}</code></pre></div>`
    }
  }
})

export function renderMarkdown(src) {
  slugCache.clear()
  return marked.parse(src)
}
