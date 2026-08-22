<script setup>
defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  stats: { type: Array, default: () => [] } // [{ n: number|string, label: string }]
})
</script>

<template>
  <header class="hero">
    <h1 class="hero-title">{{ title }}</h1>
    <p v-if="sub" class="hero-sub">{{ sub }}</p>
    <div v-if="stats.length" class="hero-stats">
      <template v-for="(s, i) in stats" :key="i">
        <span v-if="i" class="hero-stats-dot">·</span>
        <span>{{ s.n }} {{ s.label }}</span>
      </template>
    </div>
    <div v-if="$slots.actions" class="hero-actions">
      <slot name="actions" />
    </div>
  </header>
</template>