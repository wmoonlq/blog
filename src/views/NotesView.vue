<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getAllNotes, getTrashedNotes } from '../utils/notes'
import { renderMarkdown } from '../utils/markdown'
import { relativeTime, monthLabel } from '../utils/format'
import { checkPassword, getToken, deleteFile, moveFile } from '../utils/githubFiles'
import {
  getLocalTrashed,
  addLocalTrashed,
  removeLocalTrashed
} from '../utils/localMedia'
import PageHero from '../components/PageHero.vue'
import GroupLabel from '../components/GroupLabel.vue'
import EmptyState from '../components/EmptyState.vue'
import DeleteBar from '../components/DeleteBar.vue'

const route = useRoute()

const trashedLocal = ref(getLocalTrashed())

const notes = computed(() => {
  const localTrashed = new Set(trashedLocal.value.map((t) => t.slug))
  return getAllNotes().filter((n) => !localTrashed.has(n.slug))
})

const trashedNotes = computed(() => {
  const seen = new Map()
  for (const t of trashedLocal.value) {
    seen.set(t.slug, {
      slug: t.slug,
      title: t.title || '',
      date: t.date || '',
      content: '',
      trashed: true
    })
  }
  for (const t of getTrashedNotes()) {
    const cur = seen.get(t.slug)
    if (cur && cur.title) continue
    seen.set(t.slug, {
      slug: t.slug,
      title: t.title || '',
      date: t.date || '',
      content: t.content || '',
      trashed: true
    })
  }
  return [...seen.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
})

const expanded = ref(new Set())
const noteEls = ref([])

const byMonth = computed(() => {
  const groups = new Map()
  notes.value.forEach((n) => {
    const key = (n.date || '').slice(0, 7)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(n)
  })
  return [...groups.entries()]
})

function render(content) {
  return renderMarkdown(content)
}

function toggleExpand(slug) {
  const next = new Set(expanded.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  expanded.value = next
}

const isExpanded = (slug) => expanded.value.has(slug)

function scrollToNote(slug) {
  const el = noteEls.value.find((x) => x && x.dataset.slug === slug)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('flash')
    setTimeout(() => el.classList.remove('flash'), 2000)
  }
}

const jumpTo = computed(() => route.query.q || route.query.n || '')

watch(
  jumpTo,
  async (val) => {
    if (!val) return
    await nextTick()
    scrollToNote(val)
  },
  { immediate: true }
)

/* ---- 管理 / 回收站 ---- */

const showManage = ref(false)
const showTrash = ref(false)
const action = ref(null) // { type: 'trash' | 'restore' | 'purge', slug, title }
const actPwd = ref('')
const actMsg = ref('')
const busy = ref(false)

function startDelete(note) {
  action.value = { type: 'trash', slug: note.slug, title: note.title || note.date || note.slug }
  actPwd.value = ''
  actMsg.value = ''
}

function startRestore(t) {
  action.value = { type: 'restore', slug: t.slug, title: t.title || t.slug }
  actPwd.value = ''
  actMsg.value = ''
}

function startPurge(t) {
  action.value = { type: 'purge', slug: t.slug, title: t.title || t.slug }
  actPwd.value = ''
  actMsg.value = ''
}

function cancelAction() {
  action.value = null
  actMsg.value = ''
}

const actionTitle = computed(() => {
  const a = action.value
  if (!a) return ''
  return a.type === 'trash'
    ? `将「${a.title}」移入回收站？`
    : a.type === 'restore'
      ? `从回收站还原「${a.title}」？`
      : `彻底删除「${a.title}」？`
})

const actionSub = computed(() => {
  const a = action.value
  if (!a) return ''
  return a.type === 'trash'
    ? '文件将移至 src/notes-trash/，可从回收站还原'
    : a.type === 'restore'
      ? '文件将移回 src/notes/，随笔重新上线'
      : '文件将从仓库永久移除，不可恢复'
})

async function confirmAction() {
  if (!action.value) return
  actMsg.value = ''
  if (!checkPassword(actPwd.value)) {
    actMsg.value = '操作密码不正确'
    return
  }
  const token = getToken()
  if (!token) {
    actMsg.value = '需要 GitHub Token（与随笔编辑器共用，可在编辑器高级选项填写）'
    return
  }
  const { type, slug, title } = action.value
  if (type === 'purge' && !window.confirm(`确认彻底删除「${title}」？此操作不可恢复。`)) return
  if (type === 'trash' && !window.confirm(`确认将「${title}」移入回收站？`)) return

  busy.value = true
  try {
    if (type === 'trash') {
      await moveFile({
        fromPath: `src/notes/${slug}.md`,
        toPath: `src/notes-trash/${slug}.md`,
        message: `docs: trash note ${slug}`,
        token
      })
      addLocalTrashed({ slug, title, date: '' })
      trashedLocal.value = getLocalTrashed()
    } else {
      const fromPath = `src/notes-trash/${slug}.md`
      if (type === 'purge') {
        await deleteFile(fromPath, `chore: purge note ${slug}`, token)
      } else {
        await moveFile({
          fromPath,
          toPath: `src/notes/${slug}.md`,
          message: `docs: restore note ${slug}`,
          token
        })
      }
      removeLocalTrashed(slug)
      trashedLocal.value = getLocalTrashed()
    }
    action.value = null
    actMsg.value =
      type === 'trash'
        ? '已移入回收站，等待自动构建发布后生效'
        : type === 'restore'
          ? '已还原，等待自动构建发布后生效'
          : '已彻底删除，等待自动构建发布后生效'
  } catch (e) {
    actMsg.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="page">
    <PageHero
      title="随笔"
      :sub="`随手记下的碎片 · ${notes.length} 篇`"
    >
      <template #actions>
        <router-link class="btn hero-btn" :to="{ name: 'notes-editor' }">写随笔</router-link>
        <button class="btn hero-btn" :class="{ 'btn-on': showTrash }" @click="showTrash = !showTrash">
          {{ showTrash ? '收起回收站' : '回收站' }}<span v-if="trashedNotes.length" class="hero-btn-count">{{ trashedNotes.length }}</span>
        </button>
        <button class="btn hero-btn" :class="{ 'btn-on': showManage }" @click="showManage = !showManage">
          {{ showManage ? '退出管理' : '管理' }}
        </button>
      </template>
    </PageHero>

    <DeleteBar
      v-if="action"
      v-model:pwd="actPwd"
      :title="actionTitle"
      :sub="actionSub"
      :msg="actMsg"
      :busy="busy"
      @confirm="confirmAction"
      @cancel="cancelAction"
    />

    <div v-if="showTrash && trashedNotes.length" class="trash-section">
      <GroupLabel label="回收站" :count="trashedNotes.length" />
      <ul class="trash-list">
        <li v-for="t in trashedNotes" :key="t.slug" class="trash-row">
          <span class="trash-name">{{ t.title || t.slug }}</span>
          <span class="trash-date">{{ t.date || '—' }}</span>
          <button class="btn btn-sm" @click="startRestore(t)">还原</button>
          <button class="btn btn-sm btn-danger" @click="startPurge(t)">彻底删除</button>
        </li>
      </ul>
    </div>

    <div v-if="notes.length">
      <section v-for="[month, list] in byMonth" :key="month" class="month-group">
        <GroupLabel :label="monthLabel(month)" :count="list.length" />
        <ul class="note-list">
          <li v-for="note in list" :key="note.slug">
            <article
              :ref="(el) => noteEls.push(el)"
              :data-slug="note.slug"
              class="note-card"
            >
              <div class="note-head">
                <time class="note-date">{{ note.date }}<span class="note-relative"> · {{ relativeTime(note.date) }}</span></time>
                <span class="note-actions">
                  <router-link
                    class="edit-link"
                    :to="{ name: 'notes-editor', query: { file: `${note.slug}.md` } }"
                  >编辑</router-link>
                  <button v-if="showManage" class="btn btn-sm btn-danger note-del" @click="startDelete(note)">删除</button>
                </span>
              </div>
              <h2 v-if="note.title" class="note-title">{{ note.title }}</h2>
              <div class="prose note-content" :class="{ clamp: !isExpanded(note.slug) }" v-html="render(note.content)"></div>
              <button v-if="note.content.length > 260" class="note-more" @click="toggleExpand(note.slug)">
                {{ isExpanded(note.slug) ? '收起 ▴' : '展开 ▾' }}
              </button>
            </article>
          </li>
        </ul>
      </section>
    </div>
    <EmptyState v-else text="还没有随笔" sub="随手记下的碎片，都在这里归档" />
  </div>
</template>