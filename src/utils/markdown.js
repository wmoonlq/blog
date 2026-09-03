import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)
hljs.registerLanguage('python', python)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('sh', shell)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

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

function highlightCode(text, lang) {
  if (!lang) return escapeHtml(text)
  const name = hljs.getLanguage(lang) ? lang : lang.toLowerCase()
  if (!hljs.getLanguage(name)) return escapeHtml(text)
  try {
    return hljs.highlight(text, { language: name, ignoreIllegals: true }).value
  } catch {
    return escapeHtml(text)
  }
}

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = tokens.map((t) => t.text ?? '').join('')
      const id = slugify(text)
      return `<h${depth} id="${id}">${escapeHtml(text)}</h${depth}>`
    },
    code({ text, lang }) {
      const className = lang ? ` class="language-${escapeHtml(lang)} hljs"` : ' class="hljs"'
      const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
      const body = highlightCode(text, lang)
      return `<div class="code-wrap">${label}<button class="code-copy" aria-label="复制代码">复制</button><pre><code${className}>${body}</code></pre></div>`
    },
    image({ href, title, text }) {
      const lower = href.toLowerCase()
      if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.ogg')) {
        const poster = title ? ` poster="${escapeHtml(title)}"` : ''
        return `<video class="md-video" controls preload="metadata"${poster} src="${escapeHtml(href)}"></video>`
      }
      const alt = escapeHtml(text)
      const t = title ? ` title="${escapeHtml(title)}"` : ''
      return `<img src="${escapeHtml(href)}" alt="${alt}"${t} loading="lazy" decoding="async" />`
    },
    link({ href, title, tokens }) {
      const text = tokens.map((t) => t.text ?? '').join('')
      const t = title ? ` title="${escapeHtml(title)}"` : ''
      const external = /^https?:\/\//.test(href) && !href.includes('wmoonlq.github.io')
      const ext = external ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(href)}"${t}${ext}>${text}</a>`
    }
  }
})

export function renderMarkdown(src) {
  slugCache.clear()
  return marked.parse(src)
}