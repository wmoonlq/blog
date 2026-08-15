<script setup>
import { ref } from 'vue'

const breathing = ref(true)
</script>

<template>
  <div class="breathe-wrap">
    <div class="breathe-ring" :class="{ paused: !breathing }">
      <span class="breathe-core"></span>
    </div>
    <div class="breathe-ctrl">
      <button class="btn btn-sm" @click="breathing = !breathing">
        {{ breathing ? '暂停' : '开始' }}
      </button>
      <span class="breathe-text">跟随圆圈吸气、呼气</span>
    </div>
  </div>
</template>
