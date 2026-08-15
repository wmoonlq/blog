/* Web Worker：后台分块读取文件 → base64，避免阻塞主线程 */

const reader = new FileReaderSync()

self.onmessage = (e) => {
  const { file, chunkSize = 1024 * 512 } = e.data || {}
  if (!file) {
    self.postMessage({ type: 'error', message: 'no file' })
    return
  }
  try {
    const total = file.size
    let offset = 0
    let result = ''
    let lastReport = 0

    while (offset < total) {
      const chunk = file.slice(offset, Math.min(offset + chunkSize, total))
      const dataUrl = reader.readAsDataURL(chunk)
      result += dataUrl.slice(dataUrl.indexOf(',') + 1)
      offset += chunk.size
      // 进度上报（节流，避免消息过密）
      if (offset - lastReport > 1024 * 128 || offset >= total) {
        lastReport = offset
        self.postMessage({ type: 'progress', done: offset, total })
      }
    }

    self.postMessage({ type: 'done', content: result })
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || 'read error' })
  }
}
