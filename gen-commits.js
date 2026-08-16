// 生成时间线数据 public/commits.json（构建时随 public/ 复制进 dist）
// 用法：
//   node gen-commits.js                    直连 GitHub API（可设 GITHUB_TOKEN 提升限流）
//   node gen-commits.js api-response.json  从已拉取的 API 响应转换（本机走代理时用 curl 拉取）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const INPUT = process.argv[2]

async function fetchFromApi() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'blog-deploy' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch('https://api.github.com/repos/wmoonlq/blog/commits?per_page=100', { headers })
  if (!res.ok) throw new Error(`commits API ${res.status}`)
  return res.json()
}

try {
  const data = INPUT ? JSON.parse(readFileSync(INPUT, 'utf8')) : await fetchFromApi()
  if (!Array.isArray(data)) throw new Error('unexpected API response shape')
  const list = data.map((c) => ({
    sha: c.sha,
    message: (c.commit.message || '').split('\n')[0],
    date: c.commit.author.date,
    url: c.html_url
  }))
  mkdirSync('public', { recursive: true })
  writeFileSync('public/commits.json', JSON.stringify(list))
  console.log(`written ${list.length} commits -> public/commits.json`)
} catch (e) {
  console.error(e)
  process.exit(1)
}
