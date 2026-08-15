<script setup>
import SnakeGame from '../components/SnakeGame.vue'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import DiceTool from '../components/DiceTool.vue'
import RandomPick from '../components/RandomPick.vue'
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">工作台</h1>
      <p class="hero-sub">小工具集散地 · 摸鱼五分钟，效率两小时</p>
    </header>
    <div class="tools-grid">
      <div class="tools-cell">
        <PomodoroTimer />
      </div>
      <div class="tools-cell">
        <DiceTool />
      </div>
      <div class="tools-cell">
        <RandomPick />
      </div>
      <div class="tools-cell">
        <SnakeGame />
      </div>
    </div>
  </div>
</template>
