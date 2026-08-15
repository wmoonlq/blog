<script setup>
import { ref } from 'vue'
import { settings, addNote, removeNote } from '../stores/settings'

const text = ref('')

function add() {
  const t = text.value.trim()
  if (!t) return
  addNote(t)
  text.value = ''
}
</script>

<template>
  <section class="game-card">
    <div class="game-head">
      <h2 class="game-title">便签板</h2>
      <span class="score-item">{{ settings.notes.length }} 条便签 · 存于本地</span>
    </div>
    <div class="notes-pad-body">
      <div class="notes-pad-input">
        <input
          v-model="text"
          class="input"
          placeholder="记点什么…（回车添加）"
          @keydown.enter="add"
        />
        <button class="btn btn-sm" @click="add">添加</button>
      </div>
      <div v-if="settings.notes.length" class="notes-pad-list">
        <div v-for="note in settings.notes" :key="note.id" class="notes-pad-item">
          <p class="notes-pad-text">{{ note.text }}</p>
          <button class="notes-pad-del" aria-label="删除" @click="removeNote(note.id)">✕</button>
        </div>
      </div>
      <p v-else class="notes-pad-empty">暂无便签，随手记下灵感。</p>
    </div>
  </section>
</template>
