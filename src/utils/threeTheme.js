export function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16)
    ]
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ]
}

export function themeColors() {
  return {
    accent: cssVar('--accent', '#B68D73'),
    text: cssVar('--text', '#1A1816'),
    textSecondary: cssVar('--text-secondary', '#5E554C'),
    divider: cssVar('--divider', '#EAE3DB')
  }
}
