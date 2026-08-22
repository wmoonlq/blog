<script setup>
import SnakeGame from '../components/SnakeGame.vue'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import DiceTool from '../components/DiceTool.vue'
import RandomPick from '../components/RandomPick.vue'
import CountdownTimer from '../components/CountdownTimer.vue'
import PasswordGenerator from '../components/PasswordGenerator.vue'
import StickyNotes from '../components/StickyNotes.vue'
import PageHero from '../components/PageHero.vue'
</script>

<template>
  <div class="page">
    <PageHero
      title="工作台"
      sub="小工具集散地 · 摸鱼五分钟，效率两小时"
    />
    <div class="tools-grid">
      <div class="tools-cell">
        <PomodoroTimer />
      </div>
      <div class="tools-cell">
        <CountdownTimer />
      </div>
      <div class="tools-cell">
        <PasswordGenerator />
      </div>
      <div class="tools-cell">
        <DiceTool />
      </div>
      <div class="tools-cell">
        <RandomPick />
      </div>
      <div class="tools-cell">
        <StickyNotes />
      </div>
      <div class="tools-cell">
        <SnakeGame />
      </div>
    </div>
  </div>
</template>
