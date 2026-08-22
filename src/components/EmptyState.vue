<script setup>
defineProps({
  text: { type: String, default: '暂无内容' },
  sub: { type: String, default: '' }
})
</script>

<template>
  <div class="empty-state">
    <p class="empty-state-text">{{ text }}</p>
    <p v-if="sub" class="empty-state-sub">{{ sub }}</p>
    <div v-if="$slots.default" class="empty-state-action">
      <slot />
    </div>
  </div>
</template>