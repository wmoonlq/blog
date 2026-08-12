<script setup>
import TypewriterEffect from '../components/effects/TypewriterEffect.vue'
import CharRainEffect from '../components/effects/CharRainEffect.vue'
import ParticleTrailEffect from '../components/effects/ParticleTrailEffect.vue'
import CharRevealEffect from '../components/effects/CharRevealEffect.vue'
import MagneticEffect from '../components/effects/MagneticEffect.vue'

const effects = [
  { title: '打字机', sub: '逐字敲出，光标闪烁', component: TypewriterEffect },
  { title: '字符雨', sub: '单色字符垂直坠落', component: CharRainEffect, canvas: true },
  { title: '粒子轨迹', sub: '墨点随光标飘散', component: ParticleTrailEffect, canvas: true },
  { title: '逐字浮现', sub: '文字按节奏次第点亮', component: CharRevealEffect },
  { title: '磁性按钮', sub: '按钮被光标轻轻吸动', component: MagneticEffect }
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">好看的前端特效</h1>
      <p class="hero-sub">一些在克制配色下仍然好看的动效</p>
    </header>
    <div class="effects-grid">
      <section v-for="fx in effects" :key="fx.title" class="effect-card">
        <h2 class="effect-title">{{ fx.title }}</h2>
        <p class="effect-sub">{{ fx.sub }}</p>
        <div class="effect-demo" :class="{ 'canvas-demo': fx.canvas }">
          <component :is="fx.component" />
        </div>
      </section>
    </div>
  </div>
</template>
