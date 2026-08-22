<script setup>
import { defineModel } from 'vue'

defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  msg: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  confirmLabel: { type: String, default: '确认' }
})

const emit = defineEmits(['confirm', 'cancel'])
const pwd = defineModel('pwd', { type: String, default: '' })

function fill() {
  pwd.value = '123456'
}
</script>

<template>
  <div class="delete-bar">
    <div class="delete-bar-main">
      <p class="delete-bar-title">{{ title }}</p>
      <p v-if="sub" class="delete-bar-sub">{{ sub }}</p>
    </div>
    <input
      v-model="pwd"
      class="input delete-pwd"
      type="password"
      placeholder="操作密码"
      @keydown.enter="emit('confirm')"
    />
    <button class="btn btn-sm" @click="fill">一键填充</button>
    <button class="btn btn-sm btn-danger" :disabled="busy" @click="emit('confirm')">
      {{ busy ? '处理中…' : confirmLabel }}
    </button>
    <button class="btn btn-sm" @click="emit('cancel')">取消</button>
    <p v-if="msg" class="editor-msg">{{ msg }}</p>
  </div>
</template>