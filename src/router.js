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
      path: '/post/:slug',
      name: 'post',
      component: () => import('./views/PostView.vue'),
      meta: { title: '文章' }
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineView.vue'),
      meta: { title: '时间线' }
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
