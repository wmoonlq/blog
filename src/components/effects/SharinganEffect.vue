<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const spin = ref(true)
const zoneEl = ref(null)

let raf = null
let glow = 0
function draw() {
  glow = (Math.sin(Date.now() * 0.0024) + 1) / 2
  const ring = zoneEl.value?.querySelector?.('.sharingan-glow')
  if (ring) ring.style.opacity = 0.35 + glow * 0.45
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  raf = requestAnimationFrame(draw)
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div ref="zoneEl" class="sharingan-wrap">
    <div class="sharingan-eye" :class="{ paused: !spin }">
      <div class="sharingan-glow"></div>
      <svg viewBox="0 0 100 100" class="sharingan-svg" aria-hidden="true">
        <!-- 虹膜 -->
        <circle class="sharingan-iris" cx="50" cy="50" r="46" />
        <circle class="sharingan-rim" cx="50" cy="50" r="46" fill="none" />

        <!-- 永恒万花筒纹样：黑瞳 + 六刃，整体旋转 -->
        <g class="sharingan-pattern">
          <circle cx="50" cy="50" r="6.2" />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(0 50 50)"
          />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(60 50 50)"
          />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(120 50 50)"
          />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(180 50 50)"
          />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(240 50 50)"
          />
          <path
            d="M50 50 C56 36 66 26 80 20 C73 30 70 42 62 52 C58 57 54 54 50 50 Z"
            transform="rotate(300 50 50)"
          />
        </g>
      </svg>
    </div>
    <div class="sharingan-ctrl">
      <button class="btn btn-sm" @click="spin = !spin">
        {{ spin ? '静止' : '转动' }}
      </button>
      <span class="sharingan-text">永恒万花筒 · 写轮眼</span>
    </div>
  </div>
</template>
