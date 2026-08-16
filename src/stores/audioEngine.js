import { getAudio } from './music'

// 全局音频分析引擎（单例）
// 关键：createMediaElementSource 对同一 audio 元素只能调用一次，
// 且一旦创建，audio 输出由 AudioContext 路由 —— 所以必须全局持有、永不关闭。

let audioCtx = null
let sourceNode = null
let analyserNode = null
let initialized = false

export function ensureAudioEngine() {
  const a = getAudio()
  if (!a) return null
  if (initialized) return analyserNode
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    sourceNode = audioCtx.createMediaElementSource(a)
    analyserNode = audioCtx.createAnalyser()
    analyserNode.fftSize = 128
    sourceNode.connect(analyserNode)
    analyserNode.connect(audioCtx.destination)
    initialized = true
    return analyserNode
  } catch {
    return null
  }
}

export function getAnalyser() {
  return analyserNode
}

export function resumeAudioCtx() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume()
}
