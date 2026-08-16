<script setup>
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
  { title: '粒子星云', sub: '900 颗粒子在暗夜中流转', component: ParticleNebula, kind: '3d', wide: true },
  { title: '打字机', sub: '逐字敲出，光标闪烁', component: TypewriterEffect, kind: 'css' },
  { title: '字符雨', sub: '单色字符垂直坠落', component: CharRainEffect, kind: 'canvas' },
  { title: '逐字浮现', sub: '文字按节奏次第点亮', component: CharRevealEffect, kind: 'css' },
  { title: '粒子玫瑰', sub: '四千粒子，聚成一朵玫瑰', component: ParticleRose, kind: '3d', tall: true },
  { title: '磁性按钮', sub: '按钮被光标轻轻吸动', component: MagneticEffect, kind: 'css' },
  { title: '数字时钟', sub: '衬线数字，精确到秒', component: DigitalClock, kind: 'css' },
  { title: '点击涟漪', sub: '点击水面，波纹荡开', component: RippleEffect, kind: 'canvas' },
  { title: '波形网格', sub: '正弦波在网格上起伏', component: WaveGrid, kind: '3d', wide: true },
  { title: '呼吸圆', sub: '跟随节奏一吸一呼', component: BreathingCircle, kind: 'css' },
  { title: '光标残影', sub: '移动鼠标，字符尾随', component: EchoTrail, kind: 'css' },
  { title: '烟花', sub: '点击夜空，绽放一瞬', component: FireworksEffect, kind: 'canvas' },
  { title: '莫比乌斯环', sub: '线框环结，永无止境', component: KnotWire, kind: '3d', tall: true },
  { title: '落雪', sub: '雪花无声，缓缓飘落', component: SnowfallEffect, kind: 'canvas' },
  { title: '立体卡片', sub: '跟随光标，旋转立起', component: TiltCardEffect, kind: 'css' },
  { title: '逐字律动', sub: '每个字都有自己的节拍', component: TextPulseEffect, kind: 'css' },
  { title: '流星雨', sub: '粒子倾斜坠落，如雨如流', component: MeteorFlow, kind: '3d' },
  { title: '反重力方块', sub: '方块堆在地面，被光标轻轻举起', component: AntiGravityEffect, kind: '3d' }
]

const KIND_LABEL = { css: 'CSS', canvas: 'CANVAS', '3d': '3D' }

// 3D 视差：卡片跟随鼠标视线倾斜
function onCardMove(e) {
  const card = e.currentTarget
  const rect = card.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width - 0.5
  const py = (e.clientY - rect.top) / rect.height - 0.5
  card.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-4px)`
}

function onCardLeave(e) {
  e.currentTarget.style.transform = ''
}
</script>

<template>
  <div class="page">
    <header class="fx-hero">
      <div class="fx-hero-title-wrap">
        <h1 class="fx-hero-title">
          <span class="fx-hero-line">好看的前端</span>
          <span class="fx-hero-line fx-hero-accent">特效陈列室</span>
        </h1>
        <div class="fx-hero-meta">
          <span class="fx-hero-count">{{ String(effectsList.length).padStart(2, '0') }}</span>
          <span class="fx-hero-label">个作品 · 三种技术<br />CSS / Canvas / WebGL</span>
        </div>
      </div>
      <p class="fx-hero-sub">克制配色之下，仍然好看的动效 —— 移动鼠标，卡片会跟着你的视线倾斜</p>
      <div class="fx-hero-rule"></div>
    </header>

    <div class="fx-grid">
      <section
        v-for="(fx, i) in effectsList"
        :key="fx.title"
        class="fx-card"
        :class="{ wide: fx.wide, tall: fx.tall }"
        :style="{ '--i': i }"
        @mousemove="onCardMove"
        @mouseleave="onCardLeave"
      >
        <div class="fx-card-head">
          <span class="fx-kind">{{ KIND_LABEL[fx.kind] }}</span>
          <span class="fx-num">{{ String(i + 1).padStart(2, '0') }}</span>
        </div>
        <h2 class="fx-card-title">{{ fx.title }}</h2>
        <p class="fx-card-sub">{{ fx.sub }}</p>
        <div class="fx-demo">
          <component :is="fx.component" />
        </div>
      </section>
    </div>
  </div>
</template>
