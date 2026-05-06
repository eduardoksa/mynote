import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '@/api/client'

export const axiosMock = new MockAdapter(apiClient, { onNoMatch: 'throwException' })
