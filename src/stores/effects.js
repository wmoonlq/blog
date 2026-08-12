import { reactive } from 'vue'

const KEY = 'effects-settings'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

const saved = load()

export const effects = reactive({
  particleTrail: saved.particleTrail !== false
})

export function toggleParticleTrail(value) {
  effects.particleTrail = value
  localStorage.setItem(KEY, JSON.stringify({ particleTrail: effects.particleTrail }))
}
