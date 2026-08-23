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
        <!-- 永恒万花筒纹样：红底六瓣花 + 三片黑回旋刃 + 中心红环 -->
        <g class="sharingan-pattern">
          <!-- 六瓣红花底（带黑描边，形成环链） -->
          <g class="sharingan-flower">
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(0 50 50)" />
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(60 50 50)" />
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(120 50 50)" />
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(180 50 50)" />
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(240 50 50)" />
            <path d="M50 50 Q34 30 50 6 Q66 30 50 50 Z" transform="rotate(300 50 50)" />
          </g>

          <!-- 三片黑色回旋刃，同向扫掠 -->
          <g class="sharingan-blades">
            <path
              d="M50 50 C58 28 70 12 82 10 C72 24 66 40 62 56 C59 60 54 56 50 50 Z"
              transform="rotate(0 50 50)"
            />
            <path
              d="M50 50 C58 28 70 12 82 10 C72 24 66 40 62 56 C59 60 54 56 50 50 Z"
              transform="rotate(120 50 50)"
            />
            <path
              d="M50 50 C58 28 70 12 82 10 C72 24 66 40 62 56 C59 60 54 56 50 50 Z"
              transform="rotate(240 50 50)"
            />
          </g>

          <!-- 中心红环 -->
          <circle class="sharingan-core" cx="50" cy="50" r="11" />
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
