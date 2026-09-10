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

async function getFileContent(path, token) {
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    headers: headers(token)
  })
  if (!res.ok) throw new Error(`读取失败（${res.status}）`)
  return res.json()
}

export async function moveFile({ fromPath, toPath, message, token }) {
  const data = await getFileContent(fromPath, token)
  const putRes = await fetch(`${API}/repos/${REPO}/contents/${toPath}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message: `docs: move ${fromPath} -> ${toPath}`,
      content: data.content
    })
  })
  if (!putRes.ok) {
    let detail = ''
    try {
      detail = (await putRes.json()).message || ''
    } catch {
      /* ignore */
    }
    throw new Error(`移动失败（${putRes.status}）${detail ? `：${detail}` : ''}`)
  }
  await deleteFile(fromPath, message, token)
}
