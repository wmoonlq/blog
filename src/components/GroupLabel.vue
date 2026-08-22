<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: [Number, String], default: null },
  countUnit: { type: String, default: '' }
})
</script>

<template>
  <h2 class="group-label">
    {{ label }}
    <span v-if="count !== null" class="group-label-count">{{ count }}<template v-if="countUnit"> {{ countUnit }}</template></span>
  </h2>
</template>