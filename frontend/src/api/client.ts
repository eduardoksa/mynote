import axios from 'axios'
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'

// Access token lives in module memory — never in localStorage (XSS protection)
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach Bearer token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Queue-based refresh: concurrent 401s wait for one refresh, then all retry
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else {
      p.resolve(token!)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const isAuthEndpoint = (originalRequest.url ?? '').startsWith('/auth/')
    const alreadyRetried = originalRequest._retry === true

    if (!is401 || isAuthEndpoint || alreadyRetried) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            }
            resolve(apiClient(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await apiClient.post<{ access_token: string }>(
        '/auth/refresh',
        { refresh_token: refreshToken },
      )

      setAccessToken(data.access_token)
      processQueue(null, data.access_token)

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${data.access_token}`,
      }
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      setAccessToken(null)
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      // Avoids circular dependency between client.ts ↔ authStore
      window.dispatchEvent(new Event('auth:logout-required'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
