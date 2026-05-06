import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { apiClient, setAccessToken, getAccessToken } from '@/api/client'
import { axiosMock } from '../__mocks__/axiosMock'

describe('apiClient interceptors', () => {
  beforeEach(() => {
    axiosMock.reset()
    setAccessToken(null)
    localStorage.clear()
  })

  // Request interceptor
  describe('request interceptor', () => {
    it('attaches Authorization header when access token is set', async () => {
      setAccessToken('test-token-123')
      axiosMock.onGet('/notes').reply(200, {})
      await apiClient.get('/notes')
      expect(axiosMock.history.get[0].headers?.Authorization).toBe('Bearer test-token-123')
    })

    it('does not attach Authorization header when no token is set', async () => {
      axiosMock.onGet('/notes').reply(200, {})
      await apiClient.get('/notes')
      expect(axiosMock.history.get[0].headers?.Authorization).toBeUndefined()
    })
  })

  // Response interceptor — 401 handling
  describe('response interceptor', () => {
    it('refreshes token on 401 and retries the original request', async () => {
      localStorage.setItem('refresh_token', 'rt_valid')
      setAccessToken('old_token')
      axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'new_token' })
      axiosMock.onGet('/notes').replyOnce(401).onGet('/notes').reply(200, { notes: [] })

      await apiClient.get('/notes')

      expect(getAccessToken()).toBe('new_token')
      expect(axiosMock.history.post).toHaveLength(1)
      expect(axiosMock.history.post[0].url).toContain('/auth/refresh')
      expect(axiosMock.history.get).toHaveLength(2)
    })

    it('fires auth:logout-required when no refresh token is available', async () => {
      axiosMock.onGet('/notes').reply(401)
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      await apiClient.get('/notes').catch(() => {})
      await flushPromises()

      const firedEvents = dispatchSpy.mock.calls.map((c) => (c[0] as Event).type)
      expect(firedEvents).toContain('auth:logout-required')
      dispatchSpy.mockRestore()
    })

    it('fires auth:logout-required and clears storage when refresh API fails', async () => {
      localStorage.setItem('refresh_token', 'rt_expired')
      localStorage.setItem('user', JSON.stringify({ id: 1 }))
      axiosMock.onGet('/notes').reply(401)
      axiosMock.onPost('/auth/refresh').reply(401, { error: 'Token inválido' })
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

      await apiClient.get('/notes').catch(() => {})
      await flushPromises()

      const firedEvents = dispatchSpy.mock.calls.map((c) => (c[0] as Event).type)
      expect(firedEvents).toContain('auth:logout-required')
      expect(localStorage.getItem('refresh_token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
      dispatchSpy.mockRestore()
    })

    it('does not re-enter refresh loop on 401 from /auth/refresh itself', async () => {
      localStorage.setItem('refresh_token', 'rt_abc')
      axiosMock.onPost('/auth/refresh').reply(401)

      await apiClient.post('/auth/refresh', { refresh_token: 'rt_abc' }).catch(() => {})

      expect(axiosMock.history.post).toHaveLength(1)
    })

    it('queues concurrent 401 requests and makes only one refresh call', async () => {
      localStorage.setItem('refresh_token', 'rt_valid')
      axiosMock.onPost('/auth/refresh').reply(200, { access_token: 'refreshed_token' })
      axiosMock.onGet('/notes').replyOnce(401).onGet('/notes').reply(200, { notes: [] })
      axiosMock.onGet('/notes/1').replyOnce(401).onGet('/notes/1').reply(200, { note: {} })

      const [res1, res2] = await Promise.all([
        apiClient.get('/notes'),
        apiClient.get('/notes/1'),
      ])

      expect(axiosMock.history.post).toHaveLength(1)
      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
    })
  })
})
