<script setup>
import { settings } from '../stores/settings'
</script>

<template>
  <div
    v-if="settings.background"
    class="bg-image-layer"
    :style="{ backgroundImage: `url(${settings.background})` }"
  ></div>
  <div v-if="settings.background" class="bg-tint-layer"></div>
</template>
