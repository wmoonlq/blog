import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import { getPostBySlug } from './utils/posts'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '记录与思考' } },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('./views/NotesView.vue'),
      meta: { title: '随笔' }
    },
    {
      path: '/notes/editor',
      name: 'notes-editor',
      component: () => import('./views/NotesEditorView.vue'),
      meta: { title: '编辑随笔' }
    },
    {
      path: '/posts/editor',
      name: 'posts-editor',
      component: () => import('./views/PostsEditorView.vue'),
      meta: { title: '写文章' }
    },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('./views/PostView.vue'),
      meta: { title: '文章' }
    },
    {
      path: '/workbench',
      name: 'workbench',
      component: () => import('./views/WorkbenchView.vue'),
      meta: { title: '工作台' }
    },
    {
      path: '/workbench/effects',
      name: 'effects',
      component: () => import('./views/WorkbenchEffectsView.vue'),
      meta: { title: '特效' }
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('./views/TagsView.vue'),
      meta: { title: '标签' }
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineView.vue'),
      meta: { title: '时间线' }
    },
    {
      path: '/videos',
      name: 'videos',
      component: () => import('./views/VideosView.vue'),
      meta: { title: '视频' }
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('./views/MusicView.vue'),
      meta: { title: '音乐' }
    },
    {
      path: '/cmd',
      name: 'cmd',
      component: () => import('./views/CmdView.vue'),
      meta: { title: '命令行' }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('./views/AboutView.vue'),
      meta: { title: '关于' }
    }
  ]
})

const SITE = 'wmoonlq · Blog'

router.afterEach((to) => {
  let title = to.meta?.title || ''
  if (to.name === 'post' && to.params.slug) {
    title = getPostBySlug(String(to.params.slug))?.title || title
  }
  document.title = title ? `${title} · ${SITE}` : SITE
})

export default router