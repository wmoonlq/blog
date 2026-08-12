<script setup>
import BlogNav from './components/BlogNav.vue'
import GlobalParticleTrail from './components/GlobalParticleTrail.vue'
import { effects } from './stores/effects'
</script>

<template>
  <GlobalParticleTrail v-if="effects.particleTrail" />
  <BlogNav />
  <main>
    <router-view />
  </main>
  <footer class="footer">© 2026 wmoonlq</footer>
</template>
