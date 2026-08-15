export function parseLRC(text) {
  const lines = []
  let offset = 0
  const re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g
  for (const raw of String(text || '').split('\n')) {
    // LRC 规范：[offset:+/-毫秒] 整首歌偏移
    const om = raw.match(/^\s*\[offset:\s*([+-]?\d+)\s*\]/i)
    if (om) {
      offset = parseInt(om[1], 10) / 1000
      continue
    }
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
  return { lines, offset }
}

export function findLyricIndex(lines, time) {
  let idx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= time) idx = i
    else break
  }
  return idx
}

/* ============ YRC 逐字歌词（网易云卡拉OK格式） ============
   行格式: [行开始ms,行时长ms](字开始ms,字时长ms,字后间隔ms)字(...)字...
   例: [21110,1660](21110,370,0)简(21480,340,0)单(21820,950,0)点
*/

export function parseYRC(text) {
  const lines = []
  for (const raw of String(text || '').split('\n')) {
    const head = raw.match(/^\[(\d+),(\d+)\]\s*(.*)$/)
    if (!head) continue
    const lineStart = parseInt(head[1], 10) / 1000
    const rest = head[3]
    const chars = []
    const re = /\((\d+),(\d+),(\d+)\)(.)/g
    let m
    while ((m = re.exec(rest))) {
      chars.push({
        start: parseInt(m[1], 10) / 1000,
        end: (parseInt(m[1], 10) + parseInt(m[2], 10)) / 1000,
        char: m[3]
      })
    }
    // 过滤元数据行（如"作词 : 薛之谦"，只有 1 个时间戳组且字符为空格）
    if (!chars.length) continue
    if (chars.length === 1 && chars[0].char === ' ') continue
    lines.push({
      time: lineStart,
      chars,
      text: chars.map((c) => c.char).join('')
    })
  }
  lines.sort((a, b) => a.time - b.time)
  return lines
}

export function findCharIndex(line, time) {
  let idx = -1
  if (!line) return idx
  for (let i = 0; i < line.chars.length; i++) {
    if (line.chars[i].start <= time) idx = i
    else break
  }
  return idx
}
