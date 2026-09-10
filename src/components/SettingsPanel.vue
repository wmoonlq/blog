<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { settings, toggleTheme, setBackground, setNavBackground } from '../stores/settings'

const open = ref(false)
const page = ref('') // '' | 'appearance' | 'background'
const bgInput = ref(settings.background)
const navBgInput = ref(settings.navBackground)

function openPanel() {
  open.value = true
  page.value = ''
  bgInput.value = settings.background
  navBgInput.value = settings.navBackground
}

function closePanel() {
  open.value = false
  page.value = ''
}

function goPage(name) {
  page.value = name
}

function goHome() {
  page.value = ''
}

function onClickOutside(e) {
  if (!e.target || !e.target.closest) return
  if (!e.target.closest('.settings-root')) closePanel()
}

function applyBackground() {
  setBackground(bgInput.value.trim())
}

function clearBackground() {
  bgInput.value = ''
  setBackground('')
}

function applyNavBackground() {
  setNavBackground(navBgInput.value.trim())
}

function clearNavBackground() {
  navBgInput.value = ''
  setNavBackground('')
}

function onKeydown(e) {
  if (e.key === 'Escape') closePanel()
}

function onOpenSettings() {
  openPanel()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('click', onClickOutside)
  document.addEventListener('open-settings', onOpenSettings)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('open-settings', onOpenSettings)
})
</script>

<template>
  <div class="settings-root">
    <button
      class="theme-toggle nav-settings"
      :class="{ on: open }"
      :aria-expanded="open"
      aria-label="设置"
      @click.stop="open ? closePanel() : openPanel()"
    >⚙</button>

    <transition name="nav-drop">
      <div v-if="open" class="settings-drop" role="dialog" aria-label="设置" @click.stop>
        <div class="settings-head">
          <button v-if="page" class="settings-back" aria-label="返回" @click="goHome">←</button>
          <h2 class="settings-title">{{ page === 'appearance' ? '外观' : page === 'background' ? '背景图片' : '设置' }}</h2>
        </div>

        <!-- 一级菜单 -->
        <div v-if="!page" class="settings-menu">
          <button class="settings-item" @click="goPage('appearance')">
            <span class="settings-item-name">外观</span>
            <span class="settings-item-desc">{{ settings.theme === 'dark' ? '暗色模式：开' : '暗色模式：关' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
          <button class="settings-item" @click="goPage('background')">
            <span class="settings-item-name">背景图片</span>
            <span class="settings-item-desc">{{ settings.background ? '全站已设置' : '全站未设置' }} · {{ settings.navBackground ? '导航已设置' : '导航未设置' }}</span>
            <span class="settings-item-arrow">›</span>
          </button>
        </div>

        <!-- 外观 -->
        <div v-else-if="page === 'appearance'" class="settings-scroll">
          <section class="settings-sec">
            <div class="switch-row">
              <span class="switch-label">暗色模式</span>
              <button
                class="switch"
                :class="{ on: settings.theme === 'dark' }"
                :aria-pressed="settings.theme === 'dark'"
                @click="toggleTheme"
              ></button>
            </div>
          </section>
        </div>

        <!-- 背景图片（URL 引用） -->
        <div v-else-if="page === 'background'" class="settings-scroll">
          <section class="settings-sec">
            <h3 class="settings-sec-title">背景图片</h3>
            <p class="settings-hint">全站背景，个人设置仅对本机生效</p>
            <div class="bg-input-row">
              <input
                v-model="bgInput"
                class="input"
                type="url"
                placeholder="图片 URL（https://…）"
                @keydown.enter="applyBackground"
              />
              <button class="btn btn-sm" @click="applyBackground">应用</button>
              <button v-if="settings.background" class="btn btn-sm" @click="clearBackground">清除</button>
            </div>
            <div class="settings-sep"></div>
            <h3 class="settings-sec-title">导航栏背景图</h3>
            <p class="settings-hint">仅导航栏区域，可复用上方图片 URL</p>
            <div class="bg-input-row">
              <input
                v-model="navBgInput"
                class="input"
                type="url"
                placeholder="图片 URL（https://…）"
                @keydown.enter="applyNavBackground"
              />
              <button class="btn btn-sm" @click="applyNavBackground">应用</button>
              <button v-if="settings.navBackground" class="btn btn-sm" @click="clearNavBackground">清除</button>
            </div>
          </section>
        </div>
      </div>
    </transition>
  </div>
</template>
