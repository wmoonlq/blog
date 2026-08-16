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
const selectedIndex = ref(0) // 默认展示第一个特效
const cards = effectsList.map((fx, i) => ({
  ...fx,
  baseAngle: (i / effectsList.length) * Math.PI * 2,
  dx: 0,
  dy: 0
}))

let raf = null
let slowAngle = 0
let radius = 0
let cardSize = 150
const CARD_GAP = 10 // 相邻卡片最小间距

function layout() {
  const el = orbitRef.value
  if (!el) return
  const w = el.clientWidth
  const h = el.clientHeight
  const count = cards.length

  const MAX_CARD = 150
  const MIN_CARD = w < 560 ? 64 : w < 860 ? 76 : 90

  let r = Math.min(w, h) * 0.34
  let size = (2 * Math.PI * r) / count - CARD_GAP

  if (size < MIN_CARD) {
    const needR = (count * (MIN_CARD + CARD_GAP)) / (2 * Math.PI)
    const maxR = Math.min(w, h) / 2 - MIN_CARD / 2
    r = Math.min(needR, maxR)
    size = (2 * Math.PI * r) / count - CARD_GAP
    if (size < MIN_CARD) size = MIN_CARD
  }

  if (size > MAX_CARD) size = MAX_CARD
  radius = r
  cardSize = size

  cards.forEach((c, i) => {
    const card = c.el
    if (card) {
      card.style.width = `${cardSize}px`
      card.style.height = `${cardSize * 0.72}px`
    }
  })
}

function frame() {
  slowAngle += 0.0012
  cards.forEach((c) => {
    const card = c.el
    if (!card) return
    const angle = c.baseAngle + slowAngle
    const targetX = Math.cos(angle) * radius
    const targetY = Math.sin(angle) * radius
    c.dx += (targetX - c.dx) * 0.08
    c.dy += (targetY - c.dy) * 0.08
    card.style.transform = `translate(calc(-50% + ${c.dx}px), calc(-50% + ${c.dy}px))`
  })
  raf = requestAnimationFrame(frame)
}

function onSelect(i) {
  selectedIndex.value = i
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
      <p class="fx-orbit-sub">点击轨道上的名称，在中心舞台查看效果 —— 效果是主角</p>
    </header>

    <div ref="orbitRef" class="fx-orbit">
      <!-- 中心舞台：矩形展示区 -->
      <div class="fx-stage" :key="selectedIndex">
        <div class="fx-stage-head">
          <span class="fx-kind">{{ KIND_LABEL[cards[selectedIndex].kind] }}</span>
          <h2 class="fx-stage-title">{{ cards[selectedIndex].title }}</h2>
          <span class="fx-num">{{ String(selectedIndex + 1).padStart(2, '0') }} / {{ String(cards.length).padStart(2, '0') }}</span>
        </div>
        <div class="fx-stage-body">
          <component :is="cards[selectedIndex].component" />
        </div>
        <p class="fx-stage-sub">{{ cards[selectedIndex].sub }}</p>
      </div>

      <!-- 轨道文字卡片 -->
      <section
        v-for="(fx, i) in cards"
        :key="fx.title"
        :ref="(el) => setCardEl(i, el)"
        class="fx-orbit-card"
        :class="{ selected: i === selectedIndex }"
        @click="onSelect(i)"
      >
        <span class="fx-orbit-card-inner">
          <span class="fx-orbit-card-title">{{ fx.title }}</span>
        </span>
      </section>
    </div>

    <p class="fx-orbit-hint">全局特效设置请点右上角 ⚙</p>
  </div>
</template>
