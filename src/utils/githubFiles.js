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

/* ============ Web Worker 后台读取（不阻塞主线程） ============ */

let worker = null

export function fileToBase64Worker(file, onProgress) {
  if (!worker) {
    worker = new Worker(new URL('./uploadWorker.js', import.meta.url), { type: 'module' })
  }
  return new Promise((resolve, reject) => {
    const onMsg = (e) => {
      const { type, done, total, content, message } = e.data || {}
      if (type === 'progress') {
        onProgress && onProgress(done, total)
      } else if (type === 'done') {
        worker.removeEventListener('message', onMsg)
        worker.removeEventListener('error', onErr)
        resolve(content)
      } else if (type === 'error') {
        worker.removeEventListener('message', onMsg)
        worker.removeEventListener('error', onErr)
        reject(new Error(message || '读取失败'))
      }
    }
    const onErr = (err) => {
      worker.removeEventListener('message', onMsg)
      worker.removeEventListener('error', onErr)
      reject(new Error(err.message || '读取失败'))
    }
    worker.addEventListener('message', onMsg)
    worker.addEventListener('error', onErr)
    worker.postMessage({ file, chunkSize: 1024 * 512 })
  })
}

export function terminateWorker() {
  if (worker) {
    worker.terminate()
    worker = null
  }
}

/* ============ XHR 上传（带真实上传进度） ============ */

export function uploadFileXhr({ path, content, message, token, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', `${API}/repos/${REPO}/contents/${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Accept', 'application/vnd.github+json')
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.setRequestHeader('X-GitHub-Api-Version', '2022-11-28')
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve(null)
        }
      } else {
        let detail = ''
        try {
          detail = JSON.parse(xhr.responseText).message || ''
        } catch {
          /* ignore */
        }
        reject(new Error(`上传失败（${xhr.status}）${detail ? `：${detail}` : ''}`))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误，上传失败'))
    xhr.send(JSON.stringify({ message, content }))
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

export async function uploadFile({ path, content, message, token, sha }) {
  const body = {
    message,
    content
  }
  if (sha) body.sha = sha
  const res = await fetch(`${API}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify(body)
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

export async function getFileContent(path, token) {
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
