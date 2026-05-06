import { apiClient } from './client'
import type {
  AuthResponse,
  RefreshResponse,
  MessageResponse,
  RegisterPayload,
  LoginPayload,
} from '@/types'

export const authApi = {
  register(payload: RegisterPayload) {
    return apiClient.post<AuthResponse>('/auth/register', payload)
  },

  login(payload: LoginPayload) {
    return apiClient.post<AuthResponse>('/auth/login', payload)
  },

  logout(refreshToken: string) {
    return apiClient.delete<void>('/auth/logout', {
      data: { refresh_token: refreshToken },
    })
  },

  refresh(refreshToken: string) {
    return apiClient.post<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
  },

  requestPasswordReset(email: string) {
    return apiClient.post<MessageResponse>('/auth/password-reset', { email })
  },

  confirmPasswordReset(token: string, password: string, passwordConfirmation: string) {
    return apiClient.patch<MessageResponse>(`/auth/password-reset/${token}`, {
      password,
      password_confirmation: passwordConfirmation,
    })
  },
}
