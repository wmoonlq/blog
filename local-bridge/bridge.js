#!/usr/bin/env node
/**
 * blog-bridge — 博客命令行 ↔ 本机命令行桥接（WebSocket + 持久会话版）
 *
 * 参考 DeepSeek Harness 的本地执行设计：WebSocket 双向传输 + 常驻 shell 会话 +
 * 命令 nonce 标记包装（截取干净输出与退出码）+ 有界缓冲/超时自复位。
 *
 * 运行：npm run bridge
 * 环境变量：BRIDGE_PORT（默认 9876）· BRIDGE_TOKEN（默认 blog-local）
 *          BRIDGE_TIMEOUT（单条 exec 超时 ms，默认 120000）· BRIDGE_SHELL（默认 cmd.exe）
 *
 * HTTP 接口（兼容旧版）：
 *   GET  /api/status           存活检测（无鉴权）
 *   POST /api/exec             一次性执行 { token, cmd, cwd? }，分块流式输出
 *
 * WebSocket 接口（/ws，推荐）——先发 {type:'auth',token}，之后：
 *   {type:'open'}                          → {type:'session', id, shell, cwd} 开持久 shell
 *   {type:'exec',  id, cmd}                → 标记包装执行，流式 {type:'output'} + 最终 {type:'result', output, exitCode}
 *   {type:'interactive', id, cmd}          → 专供交互程序（REPL/ssh），输出实时流式，配合 stdin
 *   {type:'stdin',  id, data}              → 向会话写原始输入
 *   {type:'reset',  id}                    → 杀掉并重开该 exec 会话
 *   {type:'close',  id}                    → 关闭会话
 *   {type:'ping'}                          → {type:'pong'}
 */
import http from 'node:http'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

const PORT = Number(process.env.BRIDGE_PORT || 9876)
const HOST = '127.0.0.1'
const TOKEN = process.env.BRIDGE_TOKEN || 'blog-local'
const TIMEOUT_MS = Number(process.env.BRIDGE_TIMEOUT || 120000)
const SHELL = process.env.BRIDGE_SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash')
const IS_WIN = process.platform === 'win32'

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

/* ===================== 极简 WebSocket 服务端（RFC 6455） ===================== */

class WSConn {
  constructor(socket) {
    this.socket = socket
    this.buffer = Buffer.alloc(0)
    this.fragBuf = ''
    this.closed = false
    this.onmessage = null
    this.onclose = null
    socket.on('data', (chunk) => this._onData(chunk))
    socket.on('close', () => {
      if (this.closed) return
      this.closed = true
      if (this.onclose) this.onclose()
    })
    socket.on('error', () => {
      if (this.closed) return
      this.closed = true
      if (this.onclose) this.onclose()
    })
  }

  _onData(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (!this.closed) {
      const frame = this._readFrame()
      if (!frame) break
      this._handleFrame(frame)
    }
  }

  _readFrame() {
    const b = this.buffer
    if (b.length < 2) return null
    const fin = (b[0] & 0x80) !== 0
    const opcode = b[0] & 0x0f
    const masked = (b[1] & 0x80) !== 0
    let len = b[1] & 0x7f
    let off = 2
    if (len === 126) {
      if (b.length < 4) return null
      len = b.readUInt16BE(2)
      off = 4
    } else if (len === 127) {
      if (b.length < 10) return null
      const high = b.readUInt32BE(2)
      const low = b.readUInt32BE(6)
      len = high * 0x100000000 + low
      if (len > 16 * 1024 * 1024) throw new Error('frame too large')
      off = 10
    }
    let maskKey = null
    if (masked) {
      if (b.length < off + 4) return null
      maskKey = b.subarray(off, off + 4)
      off += 4
    }
    if (b.length < off + len) return null
    let payload = b.subarray(off, off + len)
    if (masked && maskKey) {
      const out = Buffer.alloc(len)
      for (let i = 0; i < len; i++) out[i] = payload[i] ^ maskKey[i % 4]
      payload = out
    }
    this.buffer = b.subarray(off + len)
    return { fin, opcode, payload }
  }

  _handleFrame(frame) {
    const { fin, opcode, payload } = frame
    if (opcode === 0x8) {
      this._sendFrame(0x8, payload)
      this.closed = true
      this.socket.end()
      if (this.onclose) this.onclose()
      return
    }
    if (opcode === 0x9) {
      this._sendFrame(0xa, payload)
      return
    }
    if (opcode === 0xa) return
    if (opcode === 0x1 || opcode === 0x0) {
      this.fragBuf += payload.toString('utf8')
      if (fin && this.onmessage) this.onmessage(this.fragBuf)
      if (fin) this.fragBuf = ''
    }
  }

  _sendFrame(opcode, payload) {
    if (this.closed) return
    const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8')
    const len = buf.length
    const header = []
    header.push(0x80 | opcode)
    if (len < 126) {
      header.push(len)
    } else if (len < 65536) {
      header.push(126, (len >> 8) & 0xff, len & 0xff)
    } else {
      const be = Buffer.alloc(8)
      be.writeBigUInt64BE(BigInt(len))
      header.push(127, ...be)
    }
    this.socket.write(Buffer.concat([Buffer.from(header), buf]))
  }

  send(text) {
    this._sendFrame(0x1, Buffer.from(text, 'utf8'))
  }

  close() {
    if (this.closed) return
    try {
      this._sendFrame(0x8, Buffer.from('bye', 'utf8'))
      this.socket.end()
    } catch {
      /* ignore */
    }
    this.closed = true
  }
}

/* ===================== 会话管理 ===================== */

// exec 会话：常驻 shell + 标记包装；interactive 会话：实时流 + stdin
const sessions = new Map()
let idSeq = 0

function newId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`
}

function spawnShell(cwd) {
  // /Q（cmd）或 -NoLogo -NoProfile（pwsh）关闭回显细节；提示符前缀在解析时剥离
  const args = /cmd(\.exe)?$/i.test(SHELL)
    ? ['/Q']
    : /pw?sh$/i.test(SHELL)
      ? ['-NoLogo', '-NoProfile']
      : []
  const child = spawn(SHELL, args, {
    cwd: cwd || os.homedir(),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env }
  })
  return child
}

class ExecSession {
  constructor(conn) {
    this.conn = conn
    this.id = newId('exec')
    this.child = null
    this.state = 'idle' // idle | pending
    this.buffer = ''
    this.pending = null // { nonce, start, end, timer, resolve }
    this.reset()
  }

  reset() {
    if (this.child) {
      try {
        this.child.kill()
      } catch {
        /* ignore */
      }
    }
    this.buffer = ''
    this.state = 'idle'
    this.child = spawnShell()
    this.child.stdout.on('data', (d) => this._onOut(d))
    this.child.stderr.on('data', (d) => this._onOut(d))
    this.child.on('error', (e) => {
      this._emit({ type: 'error', id: this.id, message: String(e.message || e) })
    })
    this.child.on('close', (code) => {
      // shell 异常退出：若命令未完成，给一个结果并自动重开干净 shell
      if (this.state === 'pending' && this.pending) {
        const output = this._extractPartial()
        this._finish({ output, exitCode: code ?? null, reset: true })
      } else {
        this._emit({ type: 'closed', id: this.id, reason: 'shell-exit' })
        this.state = 'dead'
      }
    })
    // 切 UTF-8 代码页，避免中文乱码
    if (IS_WIN) {
      try {
        this.child.stdin.write('chcp 65001 >nul\r\n')
      } catch {
        /* ignore */
      }
    }
  }

  _onOut(d) {
    const text = d.toString('utf8')
    if (this.state === 'pending' && this.pending) {
      this.buffer += text
      const { end, start } = this.pending
      const endIdx = this.buffer.lastIndexOf(end)
      if (endIdx >= 0) {
        const statusMatch = /(\d+)\r?\n/.exec(this.buffer.slice(endIdx + end.length))
        const exitCode = statusMatch ? Number(statusMatch[1]) : 0
        const output = this._extractOutput(start, endIdx, end)
        this._finish({ output, exitCode })
        return
      }
      this.conn.send(JSON.stringify({ type: 'output', id: this.id, text }))
      if (this.buffer.length > 4 * 1024 * 1024) {
        this.buffer = this.buffer.slice(-1024 * 1024)
      }
    } else {
      // 非 pending 时的零散输出（异常）
      this.conn.send(JSON.stringify({ type: 'output', id: this.id, text }))
    }
  }

  // 从缓冲中截取 start 标记之后、end 标记之前的干净输出（剥掉 cmd/pwsh 的提示符前缀）
  _extractOutput(start, endIdx, end) {
    const startIdx = this.buffer.lastIndexOf(start)
    if (startIdx < 0) return ''
    let seg = this.buffer.slice(startIdx + start.length, endIdx)
    // 每行输出前会有 \r\n\r\n<PROMPT> 或行首 \r\n<PROMPT>（如 E:\path>）
    seg = seg.replace(/\r\n\r\n[^\r\n>]*>/g, '\r\n')
    seg = seg.replace(/^\r\n[^\r\n>]*>/, '')
    seg = seg.replace(/^\r\n/, '')
    seg = seg.replace(/\r?\n$/, '')
    seg = seg.replace(/\r\n/g, '\n')
    seg = seg.split('\n').filter((l) => l.trim() !== '').join('\n')
    return seg
  }

  exec(cmd) {
    if (this.state === 'dead') this.reset()
    if (this.state === 'pending') {
      this._emit({ type: 'error', id: this.id, message: '会话忙，等待上一条命令结束' })
      return
    }
    const nonce = crypto.randomUUID().replace(/-/g, '')
    const start = `__DSH_B_${nonce}__`
    const end = `__DSH_E_${nonce}`
    this.state = 'pending'
    this.buffer = ''
    this.pending = {
      nonce,
      start,
      end,
      timer: setTimeout(() => {
        const partial = this._extractPartial()
        this._finish({ output: partial, exitCode: null, incomplete: true, reset: true })
      }, TIMEOUT_MS)
    }
    const line = cmd.replace(/\r?\n/g, '\r\n')
    let wrapped
    if (IS_WIN) {
      wrapped = `echo ${start}\r\n${line}\r\necho ${end}%errorlevel%\r\n`
    } else {
      wrapped = `printf '%s\\n' '${start}'; eval -- '${line.replace(/'/g, "'\\''")}'; printf '%s%s\\n' '${end}' "$?"`
    }
    try {
      this.child.stdin.write(wrapped)
    } catch (e) {
      this._finish({ output: '', exitCode: null, error: String(e.message || e) })
    }
  }

  _extractPartial() {
    const { start, end } = this.pending
    const startIdx = this.buffer.lastIndexOf(start)
    if (startIdx >= 0) {
      let out = this.buffer.slice(startIdx + start.length)
      const endIdx = out.lastIndexOf(end)
      if (endIdx >= 0) out = out.slice(0, endIdx)
      return out.replace(/^\r?\n/, '').replace(/\r\n/g, '\n')
    }
    return ''
  }

  _finish(result) {
    if (this.state !== 'pending') return
    clearTimeout(this.pending.timer)
    this.state = 'idle'
    this.pending = null
    this.buffer = ''
    if (result.reset) {
      // 命令没正常返回（交互程序占用了 shell）→ 重开一个干净 shell
      this.reset()
      this.conn.send(JSON.stringify({ type: 'result', id: this.id, ...result, reset: true }))
    } else {
      this.conn.send(JSON.stringify({ type: 'result', id: this.id, ...result }))
    }
  }

  sendStdin(data) {
    try {
      this.child.stdin.write(data)
    } catch (e) {
      this._emit({ type: 'error', id: this.id, message: String(e.message || e) })
    }
  }

  close() {
    if (this.pending) clearTimeout(this.pending.timer)
    try {
      this.child.kill()
    } catch {
      /* ignore */
    }
    sessions.delete(this.id)
  }

  _emit(msg) {
    this.conn.send(JSON.stringify(msg))
  }
}

class InteractiveSession {
  constructor(conn, cmd, cwd) {
    this.conn = conn
    this.id = newId('live')
    this.child = spawnShell(cwd)
    this.child.stdout.on('data', (d) => this._emit({ type: 'output', id: this.id, text: d.toString('utf8') }))
    this.child.stderr.on('data', (d) => this._emit({ type: 'output', id: this.id, text: d.toString('utf8') }))
    this.child.on('error', (e) => this._emit({ type: 'error', id: this.id, message: String(e.message || e) }))
    this.child.on('close', (code) => {
      this._emit({ type: 'closed', id: this.id, reason: 'exit', exitCode: code })
      sessions.delete(this.id)
    })
    if (cmd) this.sendStdin(cmd + (IS_WIN ? '\r\n' : '\n'))
  }

  sendStdin(data) {
    try {
      this.child.stdin.write(data)
    } catch (e) {
      this._emit({ type: 'error', id: this.id, message: String(e.message || e) })
    }
  }

  close() {
    try {
      this.child.kill()
    } catch {
      /* ignore */
    }
    sessions.delete(this.id)
  }

  _emit(msg) {
    this.conn.send(JSON.stringify(msg))
  }
}

/* ===================== HTTP 服务器 ===================== */

function sendStatus(res, code, type, text) {
  res.writeHead(code, { ...CORS, 'Content-Type': type })
  res.end(text)
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }
  if (req.url === '/api/status') {
    sendStatus(res, 200, 'application/json', JSON.stringify({ ok: true, port: PORT, ws: true }))
    return
  }
  if (req.url === '/api/exec' && req.method === 'POST') {
    let body = ''
    req.on('data', (c) => {
      body += c
    })
    req.on('end', () => {
      let parsed = {}
      try {
        parsed = JSON.parse(body)
      } catch {
        /* ignore */
      }
      if (parsed.token !== TOKEN) {
        sendStatus(res, 401, 'text/plain; charset=utf-8', 'Token 无效')
        return
      }
      const cmd = String(parsed.cmd || '').trim()
      if (!cmd) {
        sendStatus(res, 400, 'text/plain; charset=utf-8', '缺少命令')
        return
      }
      const cwd = parsed.cwd && path.isAbsolute(String(parsed.cwd)) ? String(parsed.cwd) : os.homedir()
      res.writeHead(200, { ...CORS, 'Content-Type': 'text/plain; charset=utf-8' })
      const child = spawn(cmd, { shell: true, cwd })
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL')
        } catch {
          /* ignore */
        }
        if (!res.writableEnded) {
          res.write(`\n[超时] 命令超过 ${TIMEOUT_MS / 1000}s，已终止\n`)
          res.end()
        }
      }, TIMEOUT_MS)
      child.stdout.on('data', (d) => {
        if (!res.writableEnded) res.write(d)
      })
      child.stderr.on('data', (d) => {
        if (!res.writableEnded) res.write(d)
      })
      child.on('error', (e) => {
        if (!res.writableEnded) res.write(`\n[错误] ${String(e.message || e)}\n`)
      })
      child.on('close', (code) => {
        clearTimeout(timer)
        if (!res.writableEnded) {
          res.write(`\n[退出码] ${code ?? 'null'}\n`)
          res.end()
        }
      })
    })
    return
  }
  sendStatus(res, 404, 'text/plain; charset=utf-8', 'Not Found')
})

/* ===================== WebSocket 升级 ===================== */

server.on('upgrade', (req, socket) => {
  if (!req.headers.upgrade || req.headers.upgrade.toLowerCase() !== 'websocket') {
    socket.destroy()
    return
  }
  const key = req.headers['sec-websocket-key']
  if (!key) {
    socket.destroy()
    return
  }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  )
  const conn = new WSConn(socket)
  const connSessions = new Set()
  let authed = false
  let shellName = IS_WIN ? 'cmd.exe' : SHELL.split(/[\\/]/).pop()

  conn.onmessage = (raw) => {
    let msg = {}
    try {
      msg = JSON.parse(raw)
    } catch {
      conn.send(JSON.stringify({ type: 'error', message: '无效消息' }))
      return
    }
    if (msg.type === 'auth') {
      if (msg.token === TOKEN) {
        authed = true
        conn.send(JSON.stringify({ type: 'auth-ok', port: PORT, shell: shellName }))
      } else {
        conn.send(JSON.stringify({ type: 'auth-fail', message: 'Token 无效' }))
        conn.close()
      }
      return
    }
    if (!authed) {
      conn.send(JSON.stringify({ type: 'auth-fail', message: '先发送 auth' }))
      return
    }
    switch (msg.type) {
      case 'ping':
        conn.send(JSON.stringify({ type: 'pong' }))
        break
      case 'open': {
        const s = new ExecSession(conn)
        sessions.set(s.id, s)
        connSessions.add(s.id)
        conn.send(JSON.stringify({ type: 'session', id: s.id, shell: shellName, cwd: os.homedir() }))
        break
      }
      case 'exec': {
        const s = sessions.get(msg.id)
        if (!s || !(s instanceof ExecSession)) {
          conn.send(JSON.stringify({ type: 'error', id: msg.id, message: '会话不存在，先 open' }))
        } else {
          s.exec(String(msg.cmd || ''))
        }
        break
      }
      case 'interactive': {
        const s = new InteractiveSession(conn, String(msg.cmd || ''), msg.cwd)
        sessions.set(s.id, s)
        connSessions.add(s.id)
        conn.send(JSON.stringify({ type: 'session', id: s.id, interactive: true, cmd: msg.cmd }))
        break
      }
      case 'stdin': {
        const s = sessions.get(msg.id)
        if (s) s.sendStdin(String(msg.data || ''))
        else conn.send(JSON.stringify({ type: 'error', id: msg.id, message: '会话不存在' }))
        break
      }
      case 'reset': {
        const s = sessions.get(msg.id)
        if (s && s instanceof ExecSession) {
          s.reset()
          conn.send(JSON.stringify({ type: 'session', id: s.id, reset: true }))
        } else {
          conn.send(JSON.stringify({ type: 'error', id: msg.id, message: '会话不存在' }))
        }
        break
      }
      case 'close': {
        const s = sessions.get(msg.id)
        if (s) {
          s.close()
          conn.send(JSON.stringify({ type: 'closed', id: s.id, reason: 'by-client' }))
        }
        break
      }
      default:
        conn.send(JSON.stringify({ type: 'error', message: `未知消息类型 ${msg.type}` }))
    }
  }

  conn.onclose = () => {
    for (const id of connSessions) {
      const s = sessions.get(id)
      if (s) s.close()
    }
    connSessions.clear()
  }
})

server.listen(PORT, HOST, () => {
  console.log(`[blog-bridge] 已启动 http://${HOST}:${PORT}  (WS: /ws)`)
  console.log(`[blog-bridge] Token: ${TOKEN}`)
  console.log(`[blog-bridge] Shell: ${SHELL}`)
  console.log(`[blog-bridge] 博客「命令行」页输入：connect ${TOKEN}`)
  console.log('[blog-bridge] 然后 local <命令> 执行；cd 跨命令保留；interactive <命令> 跑交互程序')
  console.log('[blog-bridge] Ctrl+C 停止')
})