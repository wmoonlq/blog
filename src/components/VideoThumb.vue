<script setup>
import { ref, onMounted } from 'vue'
import { getVideoPoster } from '../utils/videoPoster'

const props = defineProps({
  source: { type: String, required: true },
  poster: { type: String, default: '' },
  embed: { type: Boolean, default: false }
})

const thumb = ref(props.poster || '')

onMounted(async () => {
  if (!thumb.value && !props.embed) {
    thumb.value = await getVideoPoster(props.source)
  }
})
</script>

<template>
  <span class="video-card-thumb" :style="thumb ? { backgroundImage: `url(${thumb})` } : {}">
    <span class="video-card-play">▶</span>
    <span v-if="embed" class="video-card-tag">外链</span>
  </span>
</template>
