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
import { effects, toggleParticleTrail } from '../stores/effects'

const effectsList = [
  { title: '打字机', sub: '逐字敲出，光标闪烁', component: TypewriterEffect },
  { title: '字符雨', sub: '单色字符垂直坠落', component: CharRainEffect, canvas: true },
  { title: '逐字浮现', sub: '文字按节奏次第点亮', component: CharRevealEffect },
  { title: '磁性按钮', sub: '按钮被光标轻轻吸动', component: MagneticEffect },
  { title: '数字时钟', sub: '衬线数字，精确到秒', component: DigitalClock },
  { title: '点击涟漪', sub: '点击水面，波纹荡开', component: RippleEffect, canvas: true },
  { title: '呼吸圆', sub: '跟随节奏一吸一呼', component: BreathingCircle },
  { title: '光标残影', sub: '移动鼠标，字符尾随', component: EchoTrail },
  { title: '烟花', sub: '点击夜空，绽放一瞬', component: FireworksEffect, canvas: true },
  { title: '落雪', sub: '雪花无声，缓缓飘落', component: SnowfallEffect, canvas: true },
  { title: '立体卡片', sub: '跟随光标，旋转立起', component: TiltCardEffect },
  { title: '逐字律动', sub: '每个字都有自己的节拍', component: TextPulseEffect }
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">好看的前端特效</h1>
      <p class="hero-sub">一些在克制配色下仍然好看的动效</p>
    </header>
    <div class="effects-grid">
      <section class="effect-card settings-card">
        <h2 class="effect-title">全局特效</h2>
        <p class="effect-sub">开启后作用于全站所有页面，设置会保存在本地</p>
        <div class="settings-list">
          <div class="switch-row">
            <span class="switch-label">粒子轨迹</span>
            <button
              class="switch"
              :class="{ on: effects.particleTrail }"
              :aria-pressed="effects.particleTrail"
              @click="toggleParticleTrail(!effects.particleTrail)"
            ></button>
          </div>
        </div>
      </section>
      <section v-for="fx in effectsList" :key="fx.title" class="effect-card">
        <h2 class="effect-title">{{ fx.title }}</h2>
        <p class="effect-sub">{{ fx.sub }}</p>
        <div class="effect-demo" :class="{ 'canvas-demo': fx.canvas }">
          <component :is="fx.component" />
        </div>
      </section>
    </div>
  </div>
</template>
