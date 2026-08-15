const cache = new Map()

function isSameOrigin(source) {
  if (!/^https?:/i.test(source)) return true
  try {
    return new URL(source).origin === window.location.origin
  } catch {
    return false
  }
}

export async function getVideoPoster(source) {
  if (!source) return ''
  if (cache.has(source)) return cache.get(source)

  if (!isSameOrigin(source)) {
    cache.set(source, '')
    return ''
  }

  const v = document.createElement('video')
  v.src = source
  v.muted = true
  v.playsInline = true
  v.preload = 'auto'

  try {
    await new Promise((resolve, reject) => {
      v.onloadeddata = resolve
      v.onerror = () => reject(new Error('load error'))
      setTimeout(() => reject(new Error('timeout')), 8000)
    })
    if (v.readyState < 2) {
      cache.set(source, '')
      return ''
    }
    const seekTo = Math.min(0.5, (v.duration || 1) * 0.2)
    v.currentTime = seekTo
    await new Promise((resolve) => {
      v.onseeked = resolve
      setTimeout(resolve, 3000)
    })

    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth || 320
    canvas.height = v.videoHeight || 180
    canvas.getContext('2d').drawImage(v, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72)
    cache.set(source, dataUrl)
    return dataUrl
  } catch {
    cache.set(source, '')
    return ''
  } finally {
    v.src = ''
  }
}
