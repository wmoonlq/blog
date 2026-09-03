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
import SharinganEffect from '../components/effects/SharinganEffect.vue'

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
  { title: '反重力方块', sub: '方块被轻轻举起', component: AntiGravityEffect, kind: '3d' },
  { title: '写轮眼', sub: '永恒万花筒 · 三刃回旋', component: SharinganEffect, kind: 'css' }
]

const KIND_LABEL = { css: 'CSS', canvas: 'CANVAS', '3d': '3D' }

const selectedIndex = ref(0)

function ringDist(i) {
  const n = effectsList.length
  const d = Math.abs(i - selectedIndex.value)
  return Math.min(d, n - d)
}

function go(i) {
  selectedIndex.value = i
}

function step(d) {
  const n = effectsList.length
  selectedIndex.value = (selectedIndex.value + d + n) % n
}

function onKeydown(e) {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
  if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="page">
    <header class="fx-orbit-hero">
      <h1 class="fx-orbit-title">特效 <span class="fx-orbit-accent">陈列室</span></h1>
      <p class="fx-orbit-sub">点击卡片或 ← → 循环切换，效果是主角</p>
    </header>

    <!-- 中心舞台：矩形展示区 -->
    <div class="fx-stage" :key="selectedIndex">
      <div class="fx-stage-head">
        <span class="fx-kind">{{ KIND_LABEL[effectsList[selectedIndex].kind] }}</span>
        <h2 class="fx-stage-title">{{ effectsList[selectedIndex].title }}</h2>
        <span class="fx-num">{{ String(selectedIndex + 1).padStart(2, '0') }} / {{ String(effectsList.length).padStart(2, '0') }}</span>
      </div>
      <div class="fx-stage-body">
        <component :is="effectsList[selectedIndex].component" />
      </div>
      <p class="fx-stage-sub">{{ effectsList[selectedIndex].sub }}</p>
    </div>

    <!-- 3D 阶梯轮播：近大远小，循环切换 -->
    <div class="fx-carousel">
      <button class="fx-car-nav" aria-label="上一个特效" @click="step(-1)">‹</button>
      <div class="fx-car-track">
        <button
          v-for="(fx, i) in effectsList"
          :key="fx.title"
          class="fx-car-card"
          :class="[`d${Math.min(ringDist(i), 3)}`, { selected: i === selectedIndex }]"
          @click="go(i)"
        >
          <span class="fx-car-kind">{{ KIND_LABEL[fx.kind] }} · {{ String(i + 1).padStart(2, '0') }}</span>
          <span class="fx-car-title">{{ fx.title }}</span>
          <span class="fx-car-sub">{{ fx.sub }}</span>
        </button>
      </div>
      <button class="fx-car-nav" aria-label="下一个特效" @click="step(1)">›</button>
    </div>

    <p class="fx-orbit-hint">全局特效设置请点右上角 ⚙</p>
  </div>
</template>