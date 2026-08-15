<script setup>
const TEXT = '万物皆有其节奏'
</script>

<template>
  <p class="pulse-text">
    <span v-for="(ch, i) in TEXT" :key="i" :style="{ animationDelay: `${i * 0.08}s` }">{{ ch }}</span>
  </p>
</template>
