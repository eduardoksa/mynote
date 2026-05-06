import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { axiosMock } from '../__mocks__/axiosMock'

// Router with the same guard logic as the real router
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: { template: '<div />' }, meta: { requiresGuest: true } },
      { path: '/register', name: 'register', component: { template: '<div />' }, meta: { requiresGuest: true } },
      { path: '/notes', name: 'notes', component: { template: '<div />' }, meta: { requiresAuth: true } },
      { path: '/notes/new', name: 'note-new', component: { template: '<div />' }, meta: { requiresAuth: true } },
      { path: '/', redirect: '/notes' },
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

  return router
}

const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01' }

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    axiosMock.reset()
  })

  it('redirects unauthenticated user from protected route to /login', async () => {
    const router = createTestRouter()
    await router.push('/notes')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('preserves the intended route as redirect query param', async () => {
    const router = createTestRouter()
    await router.push('/notes/new')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/notes/new')
  })

  it('allows authenticated user to access protected route', async () => {
    localStorage.setItem('refresh_token', 'rt_valid')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'at_new' })
    const router = createTestRouter()
    await router.push('/notes')
    expect(router.currentRoute.value.name).toBe('notes')
  })

  it('redirects authenticated user away from guest-only route to /notes', async () => {
    localStorage.setItem('refresh_token', 'rt_valid')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'at_new' })
    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('notes')
  })

  it('allows unauthenticated user to access guest route', async () => {
    const router = createTestRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('initializes auth store only once across multiple navigations', async () => {
    const router = createTestRouter()
    const auth = useAuthStore()
    const initializeSpy = vi.spyOn(auth, 'initialize')
    await router.push('/login')
    await router.push('/register')
    expect(initializeSpy).toHaveBeenCalledTimes(1)
  })
})
