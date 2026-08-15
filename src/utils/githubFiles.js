const REPO = 'wmoonlq/blog'
const API = 'https://api.github.com'
const UPLOAD_PWD = '123456'
const TOKEN_KEY = 'notes-token'

export function checkPassword(pwd) {
  return pwd === UPLOAD_PWD
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const dataUrl = r.result
      const idx = dataUrl.indexOf(',')
      resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl)
    }
    r.onerror = () => reject(new Error('读取文件失败'))
    r.readAsDataURL(file)
  })
}

export async function getFileSha(path) {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
      headers: headers(token)
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.sha || null
  } catch {
    return null
  }
}

export async function uploadFile({ path, content, message, token }) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message,
      content
    })
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).message || ''
    } catch {
      /* ignore */
    }
    throw new Error(`上传失败（${res.status}）${detail ? `：${detail}` : ''}`)
  }
  return res.json()
}

export async function deleteFile(path, message, token) {
  const sha = await getFileSha(path)
  if (!sha) throw new Error(`文件不存在：${path}`)
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: headers(token),
    body: JSON.stringify({ message, sha })
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = (await res.json()).message || ''
    } catch {
      /* ignore */
    }
    throw new Error(`删除失败（${res.status}）${detail ? `：${detail}` : ''}`)
  }
}
