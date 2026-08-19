#!/usr/bin/env node
/**
 * blog-bridge — 博客命令行 ↔ 本机命令行桥接
 *
 * 启动一个仅监听 127.0.0.1 的 HTTP 服务，博客「命令行」页通过它执行本机命令。
 * 运行：node local-bridge/bridge.js
 * 环境变量：BRIDGE_PORT（默认 9876）· BRIDGE_TOKEN（默认 blog-local）· BRIDGE_TIMEOUT（默认 120000ms）
 *
 * 接口：
 *   GET  /api/status           存活检测（无鉴权，仅探测桥接是否在跑）
 *   POST /api/exec             执行命令，请求体 { token, cmd, cwd? }，响应为分块流式输出
 */
import http from 'node:http'
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const PORT = Number(process.env.BRIDGE_PORT || 9876)
const HOST = '127.0.0.1'
const TOKEN = process.env.BRIDGE_TOKEN || 'blog-local'
const TIMEOUT_MS = Number(process.env.BRIDGE_TIMEOUT || 120000)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}

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
    sendStatus(res, 200, 'application/json', JSON.stringify({ ok: true, port: PORT }))
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
      const cwd =
        parsed.cwd && path.isAbsolute(String(parsed.cwd))
          ? String(parsed.cwd)
          : os.homedir()

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

server.listen(PORT, HOST, () => {
  console.log(`[blog-bridge] 已启动 http://${HOST}:${PORT}`)
  console.log(`[blog-bridge] Token: ${TOKEN}`)
  console.log(`[blog-bridge] 在博客「命令行」页输入：connect ${TOKEN}`)
  console.log('[blog-bridge] 然后输入 local <命令> 即可在本机执行')
  console.log('[blog-bridge] Ctrl+C 停止')
})