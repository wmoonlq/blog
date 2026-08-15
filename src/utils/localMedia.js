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
