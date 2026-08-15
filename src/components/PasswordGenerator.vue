<script setup>
import { ref, watch } from 'vue'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?'

const length = ref(16)
const opts = ref({ lower: true, upper: true, digits: true, symbols: false })
const password = ref('')
const copied = ref(false)

function pool() {
  let s = ''
  if (opts.value.lower) s += LOWER
  if (opts.value.upper) s += UPPER
  if (opts.value.digits) s += DIGITS
  if (opts.value.symbols) s += SYMBOLS
  return s || LOWER
}

function generate() {
  const p = pool()
  password.value = Array.from({ length: length.value }, () => p[Math.floor(Math.random() * p.length)]).join('')
  copied.value = false
}

async function copy() {
  try {
    await navigator.clipboard.writeText(password.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* ignore */
  }
}

watch(opts, () => generate(), { deep: true })
generate()
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">密码生成器</h2>
      <span class="score-item">随机且安全</span>
    </div>
    <div class="pw-body">
      <div class="pw-output">
        <span class="pw-text">{{ password || '—' }}</span>
        <button class="btn btn-sm" @click="copy">{{ copied ? '✓' : '复制' }}</button>
        <button class="btn btn-sm" @click="generate">刷新</button>
      </div>
      <div class="pw-row">
        <span>长度</span>
        <input v-model.number="length" type="range" min="6" max="32" class="pw-range" />
        <span class="pw-value">{{ length }}</span>
      </div>
      <div class="pw-opts">
        <button class="pw-opt" :class="{ on: opts.lower }" @click="opts.lower = !opts.lower">小写 a–z</button>
        <button class="pw-opt" :class="{ on: opts.upper }" @click="opts.upper = !opts.upper">大写 A–Z</button>
        <button class="pw-opt" :class="{ on: opts.digits }" @click="opts.digits = !opts.digits">数字 0–9</button>
        <button class="pw-opt" :class="{ on: opts.symbols }" @click="opts.symbols = !opts.symbols">符号 !@#</button>
      </div>
    </div>
  </section>
</template>
