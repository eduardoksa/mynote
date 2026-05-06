import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import i18n from '@/i18n'
import type { User, RegisterPayload, LoginPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isInitialized = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  async function initialize(): Promise<void> {
    const storedRefreshToken = localStorage.getItem('refresh_token')
    if (storedRefreshToken) {
      try {
        const { data } = await authApi.refresh(storedRefreshToken)
        accessToken.value = data.access_token
        setAccessToken(data.access_token)
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          user.value = JSON.parse(storedUser) as User
        }
      } catch {
        clearSession()
      }
    }
    isInitialized.value = true
  }

  async function register(payload: RegisterPayload): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await authApi.register(payload)
      persistSession(data.user, data.access_token, data.refresh_token)
      await router.push('/notes')
    } catch (err) {
      error.value = extractError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await authApi.login(payload)
      persistSession(data.user, data.access_token, data.refresh_token)
      const redirect = (router.currentRoute.value.query.redirect as string) || '/notes'
      await router.push(redirect)
    } catch (err) {
      error.value = extractError(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // Falha na revogação não impede o logout local
      }
    }
    clearSession()
    await router.push('/login')
  }

  function persistSession(u: User, accessTk: string, refreshTk: string): void {
    user.value = u
    accessToken.value = accessTk
    setAccessToken(accessTk)
    localStorage.setItem('refresh_token', refreshTk)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function clearSession(): void {
    user.value = null
    accessToken.value = null
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  function setupLogoutListener(): void {
    window.addEventListener('auth:logout-required', () => {
      clearSession()
      router.push('/login')
    })

    // Sincroniza logout entre abas
    window.addEventListener('storage', (e) => {
      if (e.key === 'refresh_token' && e.newValue === null) {
        clearSession()
        router.push('/login')
      }
    })
  }

  return {
    user,
    isInitialized,
    isLoading,
    error,
    isAuthenticated,
    initialize,
    register,
    login,
    logout,
    setupLogoutListener,
  }
})

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { errors?: string[]; error?: string } } }).response
      ?.data
    if (data?.errors?.length) return data.errors.join(', ')
    if (data?.error) return data.error
  }
  return i18n.global.t('auth.unexpected_error')
}
