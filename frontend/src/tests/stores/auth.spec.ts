import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { axiosMock } from '../__mocks__/axiosMock'

const mockPush = vi.fn()
const mockQuery: Record<string, string> = {}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
    currentRoute: { value: { query: mockQuery } },
  }),
}))

const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01' }
const authResponse = { user: mockUser, access_token: 'at_123', refresh_token: 'rt_456' }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    axiosMock.reset()
    mockPush.mockClear()
    Object.keys(mockQuery).forEach((k) => delete mockQuery[k])
  })

  it('isAuthenticated is false initially', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('initialize() sets isInitialized=true when no refresh token exists', async () => {
    const store = useAuthStore()
    await store.initialize()
    expect(store.isInitialized).toBe(true)
    expect(store.user).toBeNull()
  })

  it('initialize() restores session from localStorage', async () => {
    localStorage.setItem('refresh_token', 'rt_456')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'at_new' })
    const store = useAuthStore()
    await store.initialize()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user).toEqual(mockUser)
    expect(store.isInitialized).toBe(true)
  })

  it('login() persists session and navigates to /notes', async () => {
    axiosMock.onPost('/auth/login').reply(200, authResponse)
    const store = useAuthStore()
    await store.login({ user: { email: 'alice@example.com', password: 'password' } })
    expect(localStorage.getItem('refresh_token')).toBe('rt_456')
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    expect(store.isAuthenticated).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/notes')
  })

  it('register() persists session and navigates to /notes', async () => {
    axiosMock.onPost('/auth/register').reply(200, authResponse)
    const store = useAuthStore()
    await store.register({
      user: { name: 'Alice', email: 'alice@example.com', password: 'password', password_confirmation: 'password' },
    })
    expect(localStorage.getItem('refresh_token')).toBe('rt_456')
    expect(store.isAuthenticated).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/notes')
  })

  it('logout() clears session and navigates to /login', async () => {
    localStorage.setItem('refresh_token', 'rt_456')
    axiosMock.onDelete('/auth/logout').reply(200)
    const store = useAuthStore()
    await store.logout()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  // login() error handling
  it('login() sets error and does not navigate on 401 invalid credentials', async () => {
    axiosMock.onPost('/auth/login').reply(401, { error: 'Credenciais inválidas' })
    const store = useAuthStore()
    await expect(store.login({ user: { email: 'a@b.com', password: 'wrong' } })).rejects.toThrow()
    expect(store.error).toBe('Credenciais inválidas')
    expect(store.isAuthenticated).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('login() joins multiple validation errors from {errors: [...]} format', async () => {
    axiosMock.onPost('/auth/login').reply(422, { errors: ['Email inválido', 'Senha obrigatória'] })
    const store = useAuthStore()
    await expect(store.login({ user: { email: '', password: '' } })).rejects.toThrow()
    expect(store.error).toBe('Email inválido, Senha obrigatória')
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('login() sets generic error on 500 with unrecognized body', async () => {
    axiosMock.onPost('/auth/login').reply(500, {})
    const store = useAuthStore()
    await expect(store.login({ user: { email: 'a@b.com', password: 'p' } })).rejects.toThrow()
    expect(store.error).toBe('Ocorreu um erro inesperado.')
  })

  // register() error handling
  it('register() sets error from {errors:[...]} format and does not navigate', async () => {
    axiosMock.onPost('/auth/register').reply(422, { errors: ['Email já em uso'] })
    const store = useAuthStore()
    await expect(store.register({ user: { name: 'A', email: 'a@b.com', password: 'p', password_confirmation: 'p' } })).rejects.toThrow()
    expect(store.error).toBe('Email já em uso')
    expect(store.isAuthenticated).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()
  })

  // logout() edge cases
  it('logout() navigates to /login even when no refresh token in localStorage', async () => {
    const store = useAuthStore()
    await store.logout()
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('logout() still clears session and navigates when logout API fails', async () => {
    localStorage.setItem('refresh_token', 'rt_stale')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onDelete('/auth/logout').reply(500)
    const store = useAuthStore()
    await store.logout()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  // initialize() edge cases
  it('initialize() clears session when refresh API fails and sets isInitialized', async () => {
    localStorage.setItem('refresh_token', 'rt_expired')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onPost('/auth/refresh').reply(401, { error: 'Token expirado' })
    const store = useAuthStore()
    await store.initialize()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(store.isInitialized).toBe(true)
  })

  it('initialize() handles corrupted JSON in localStorage user gracefully', async () => {
    localStorage.setItem('refresh_token', 'rt_valid')
    localStorage.setItem('user', 'NOT_VALID_JSON{{{')
    axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'at_new' })
    const store = useAuthStore()
    await store.initialize()
    expect(store.user).toBeNull()
    expect(store.isInitialized).toBe(true)
  })

  // setupLogoutListener()
  it('setupLogoutListener() clears session and navigates on auth:logout-required event', async () => {
    localStorage.setItem('refresh_token', 'rt_active')
    localStorage.setItem('user', JSON.stringify(mockUser))
    axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'at_new' })
    const store = useAuthStore()
    await store.initialize()
    store.setupLogoutListener()
    window.dispatchEvent(new Event('auth:logout-required'))
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('setupLogoutListener() clears session on storage event removing refresh_token', async () => {
    localStorage.setItem('refresh_token', 'rt_active')
    const store = useAuthStore()
    store.setupLogoutListener()
    window.dispatchEvent(new StorageEvent('storage', { key: 'refresh_token', newValue: null }))
    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  // login() redirect
  it('login() navigates to redirect query param when present', async () => {
    axiosMock.onPost('/auth/login').reply(200, authResponse)
    mockQuery.redirect = '/notes/new'
    const store = useAuthStore()
    await store.login({ user: { email: 'alice@example.com', password: 'password' } })
    expect(mockPush).toHaveBeenCalledWith('/notes/new')
  })
})
