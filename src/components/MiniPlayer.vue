<script setup>
import { computed } from 'vue'
import { music, currentTrack, progress, togglePlay, next, prev, playIndex } from '../stores/music'
import { isFavorite, toggleFavorite } from '../stores/musicPrefs'

const emit = defineEmits(['goto-music'])

const visible = computed(() => music.tracks.length > 0)
const slug = computed(() => (currentTrack.value ? currentTrack.value.slug : ''))
const isFav = computed(() => slug.value && isFavorite(slug.value))

function fmt(s) {
  if (!isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
</script>

<template>
  <transition name="miniplayer">
    <div v-if="visible" class="miniplayer" @click="emit('goto-music')">
      <div class="mini-progress" :style="{ width: `${progress}%` }"></div>
      <div class="mini-main" @click.stop>
        <div class="mini-cover" :style="currentTrack && currentTrack.cover ? { backgroundImage: `url(${currentTrack.cover})` } : {}">
          <span v-if="!currentTrack || !currentTrack.cover" class="mini-glyph">♫</span>
        </div>
        <div class="mini-info" @click="emit('goto-music')">
          <p class="mini-title">{{ currentTrack ? currentTrack.title : '' }}</p>
          <p class="mini-artist">{{ currentTrack && currentTrack.artist ? currentTrack.artist : '未知歌手' }} · {{ fmt(music.current) }} / {{ fmt(music.duration) }}</p>
        </div>
        <div class="mini-ctrl">
          <button class="mini-btn mini-fav" :class="{ on: isFav }" title="收藏" @click="slug && toggleFavorite(slug)">{{ isFav ? '♥' : '♡' }}</button>
          <button class="mini-btn" title="上一首" @click="prev">⏮</button>
          <button class="mini-btn mini-play" title="播放/暂停" @click="togglePlay">{{ music.playing ? '❚❚' : '▶' }}</button>
          <button class="mini-btn" title="下一首" @click="next(true)">⏭</button>
        </div>
      </div>
    </div>
  </transition>
</template>
