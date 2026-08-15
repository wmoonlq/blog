import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useMediaQuery(query) {
  const matches = ref(false)
  let mql = null

  function update() {
    matches.value = !!mql && mql.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    update()
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return matches
}
