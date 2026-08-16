export function stripMarkdown(src) {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(src, max = 96) {
  const text = stripMarkdown(src)
  if (text.length <= max) return text
  return `${text.slice(0, max).replace(/[，。！？；、,.\s]+$/, '')}…`
}

export function readingTime(src) {
  const cjk = (src.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = stripMarkdown(src).split(/\s+/).filter(Boolean).length
  const minutes = Math.ceil(cjk / 350 + words / 180) || 1
  return minutes
}

export function relativeTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days < 1) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  if (days < 365) return `${Math.floor(days / 30)} 个月前`
  return `${Math.floor(days / 365)} 年前`
}

export function monthLabel(dateStr) {
  if (!dateStr) return ''
  const [y, m] = dateStr.split('-')
  return `${y} 年 ${Number(m)} 月`
}
