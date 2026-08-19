const KEY = 'local-uploads'

export function getLocalUploads() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addLocalUpload(item) {
  const list = getLocalUploads().filter((u) => u.slug !== item.slug)
  list.unshift({ ...item, pending: true })
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function removeLocalUpload(slug) {
  const list = getLocalUploads().filter((u) => u.slug !== slug)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function isLocalUpload(slug) {
  return getLocalUploads().some((u) => u.slug === slug)
}

/* ============ 回收站本地记录（删除/还原即时生效，构建后由 glob 接管） ============ */

const TRASH_KEY = 'local-trashed'

export function getLocalTrashed() {
  try {
    const list = JSON.parse(localStorage.getItem(TRASH_KEY)) || []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function addLocalTrashed(item) {
  const list = getLocalTrashed().filter((u) => u.slug !== item.slug)
  list.unshift({ ...item, trashed: true })
  localStorage.setItem(TRASH_KEY, JSON.stringify(list))
}

export function removeLocalTrashed(slug) {
  const list = getLocalTrashed().filter((u) => u.slug !== slug)
  localStorage.setItem(TRASH_KEY, JSON.stringify(list))
}

export function isLocalTrashed(slug) {
  return getLocalTrashed().some((u) => u.slug === slug)
}
