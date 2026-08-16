<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TypewriterEffect from '../components/effects/TypewriterEffect.vue'
import CharRainEffect from '../components/effects/CharRainEffect.vue'
import CharRevealEffect from '../components/effects/CharRevealEffect.vue'
import MagneticEffect from '../components/effects/MagneticEffect.vue'
import DigitalClock from '../components/effects/DigitalClock.vue'
import RippleEffect from '../components/effects/RippleEffect.vue'
import BreathingCircle from '../components/effects/BreathingCircle.vue'
import EchoTrail from '../components/effects/EchoTrail.vue'
import FireworksEffect from '../components/effects/FireworksEffect.vue'
import SnowfallEffect from '../components/effects/SnowfallEffect.vue'
import TiltCardEffect from '../components/effects/TiltCardEffect.vue'
import TextPulseEffect from '../components/effects/TextPulseEffect.vue'
import ParticleNebula from '../components/effects/ParticleNebula.vue'
import WaveGrid from '../components/effects/WaveGrid.vue'
import KnotWire from '../components/effects/KnotWire.vue'
import MeteorFlow from '../components/effects/MeteorFlow.vue'
import AntiGravityEffect from '../components/effects/AntiGravityEffect.vue'
import ParticleRose from '../components/effects/ParticleRose.vue'

const effectsList = [
  { title: '粒子星云', sub: '900 颗粒子流转', component: ParticleNebula, kind: '3d' },
  { title: '打字机', sub: '逐字敲出', component: TypewriterEffect, kind: 'css' },
  { title: '字符雨', sub: '字符垂直坠落', component: CharRainEffect, kind: 'canvas' },
  { title: '逐字浮现', sub: '文字次第点亮', component: CharRevealEffect, kind: 'css' },
  { title: '粒子玫瑰', sub: '粒子聚成一朵玫瑰', component: ParticleRose, kind: '3d' },
  { title: '磁性按钮', sub: '按钮被光标吸动', component: MagneticEffect, kind: 'css' },
  { title: '数字时钟', sub: '衬线数字到秒', component: DigitalClock, kind: 'css' },
  { title: '点击涟漪', sub: '点击波纹荡开', component: RippleEffect, kind: 'canvas' },
  { title: '波形网格', sub: '正弦波网格起伏', component: WaveGrid, kind: '3d' },
  { title: '呼吸圆', sub: '一吸一呼', component: BreathingCircle, kind: 'css' },
  { title: '光标残影', sub: '字符尾随光标', component: EchoTrail, kind: 'css' },
  { title: '烟花', sub: '点击夜空绽放', component: FireworksEffect, kind: 'canvas' },
  { title: '莫比乌斯环', sub: '线框环结永无止境', component: KnotWire, kind: '3d' },
  { title: '落雪', sub: '雪花缓缓飘落', component: SnowfallEffect, kind: 'canvas' },
  { title: '立体卡片', sub: '跟随光标旋转', component: TiltCardEffect, kind: 'css' },
  { title: '逐字律动', sub: '每字自有节拍', component: TextPulseEffect, kind: 'css' },
  { title: '流星雨', sub: '粒子如雨如流', component: MeteorFlow, kind: '3d' },
  { title: '反重力方块', sub: '方块被轻轻举起', component: AntiGravityEffect, kind: '3d' }
]

const KIND_LABEL = { css: 'CSS', canvas: 'CANVAS', '3d': '3D' }

// ---- 环形轨道 ----
const orbitRef = ref(null)
const selectedIndex = ref(-1)
const cards = effectsList.map((fx, i) => ({
  ...fx,
  baseAngle: (i / effectsList.length) * Math.PI * 2,
  // 动画状态（插值缓动）
  dx: 0,
  dy: 0
}))

let raf = null
let slowAngle = 0
let radius = 0
let cardSize = 180

function layout() {
  const el = orbitRef.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  radius = Math.min(w, h) * 0.36
  cardSize = Math.min(190, Math.max(140, (Math.PI * 2 * radius) / effectsList.length * 0.72))
  cards.forEach((c, i) => {
    const card = c.el
    if (card) {
      const sel = i === selectedIndex.value
      card.style.width = sel ? `${cardSize * 1.9}px` : `${cardSize}px`
      card.style.height = sel ? `${cardSize * 1.18 * 1.25}px` : `${cardSize * 1.18}px`
    }
  })
}

function frame() {
  slowAngle += 0.0012
  cards.forEach((c, i) => {
    const card = c.el
    if (!card) return

    let targetX = 0
    let targetY = 0
    let k = 0.08

    if (i === selectedIndex.value) {
      // 选中：飘向中心
      targetX = 0
      targetY = 0
      k = 0.06
    } else {
      // 轨道上：继续随星环旋转
      const angle = c.baseAngle + slowAngle
      targetX = Math.cos(angle) * radius
      targetY = Math.sin(angle) * radius
    }

    c.dx += (targetX - c.dx) * k
    c.dy += (targetY - c.dy) * k

    card.style.transform = `translate(calc(-50% + ${c.dx}px), calc(-50% + ${c.dy}px))`
  })
  raf = requestAnimationFrame(frame)
}

function onSelect(i) {
  selectedIndex.value = selectedIndex.value === i ? -1 : i
  layout()
}

function clearSelect() {
  selectedIndex.value = -1
  layout()
}

function setCardEl(i, el) {
  cards[i].el = el
}

onMounted(() => {
  layout()
  window.addEventListener('resize', layout)
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', layout)
})
</script>

<template>
  <div class="page">
    <header class="fx-orbit-hero">
      <h1 class="fx-orbit-title">特效 <span class="fx-orbit-accent">陈列室</span></h1>
      <p class="fx-orbit-sub">环绕中心的特效星环 —— 卡片呼吸起伏，整体缓慢自转</p>
    </header>

    <div ref="orbitRef" class="fx-orbit">
      <div class="fx-orbit-core" @click="clearSelect">
        <p class="fx-orbit-core-count">{{ String(effectsList.length).padStart(2, '0') }}</p>
        <p class="fx-orbit-core-label">个作品<br />CSS · Canvas · WebGL</p>
      </div>

      <section
        v-for="(fx, i) in cards"
        :key="fx.title"
        :ref="(el) => setCardEl(i, el)"
        class="fx-orbit-card"
        :class="{ selected: i === selectedIndex }"
        @click="onSelect(i)"
      >
        <div
          class="fx-orbit-card-inner"
          :style="{ animationDelay: `${(i / cards.length) * 4}s` }"
        >
          <div class="fx-orbit-card-head">
            <span class="fx-kind">{{ KIND_LABEL[fx.kind] }}</span>
            <span class="fx-num">{{ String(i + 1).padStart(2, '0') }}</span>
          </div>
          <h2 class="fx-orbit-card-title">{{ fx.title }}</h2>
          <p v-if="i === selectedIndex" class="fx-orbit-card-sub">{{ fx.sub }}</p>
          <div class="fx-orbit-demo">
            <component :is="fx.component" />
          </div>
        </div>
      </section>
      <div v-if="selectedIndex >= 0" class="fx-orbit-close" @click="clearSelect">✕ 收起</div>
    </div>

    <p class="fx-orbit-hint">移入卡片查看效果 · 点击右上角 ⚙ 设置全局特效</p>
  </div>
</template>
