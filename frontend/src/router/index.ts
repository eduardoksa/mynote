import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/auth/ForgotPasswordView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/auth/ResetPasswordView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/notes',
      name: 'notes',
      component: () => import('@/views/notes/NotesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes/new',
      name: 'note-new',
      component: () => import('@/views/notes/NoteNewView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/notes/:id/edit',
      name: 'note-edit',
      component: () => import('@/views/notes/NoteEditView.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/', redirect: '/notes' },
    { path: '/:pathMatch(.*)*', redirect: '/notes' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.isInitialized) {
    await auth.initialize()
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresGuest && auth.isAuthenticated) {
    return { name: 'notes' }
  }
})

export default router
