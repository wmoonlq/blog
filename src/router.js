import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('./views/NotesView.vue')
    },
    {
      path: '/notes/editor',
      name: 'notes-editor',
      component: () => import('./views/NotesEditorView.vue')
    },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('./views/PostView.vue')
    },
    {
      path: '/workbench',
      name: 'workbench',
      component: () => import('./views/WorkbenchView.vue')
    },
    {
      path: '/workbench/effects',
      name: 'effects',
      component: () => import('./views/WorkbenchEffectsView.vue')
    }
  ]
})

export default router
