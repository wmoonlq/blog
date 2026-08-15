export function parseLRC(text) {
  const lines = []
  const re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g
  for (const raw of String(text || '').split('\n')) {
    const matches = [...raw.matchAll(re)]
    if (!matches.length) continue
    const content = raw.replace(re, '').trim()
    if (!content) continue // 跳过空白/元数据行
    for (const m of matches) {
      const min = parseInt(m[1], 10)
      const sec = parseInt(m[2], 10)
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0
      lines.push({ time: min * 60 + sec + frac, text: content })
    }
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

export function findLyricIndex(lines, time) {
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= time) idx = i
    else break
  }
  return idx
}
