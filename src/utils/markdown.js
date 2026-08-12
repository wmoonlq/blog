import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: false })

export function renderMarkdown(src) {
  return marked.parse(src)
}
