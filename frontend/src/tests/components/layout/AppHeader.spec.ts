import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/notes', component: { template: '<div />' } }] })

const mockUser = { id: 1, name: 'Alice', email: 'alice@example.com', created_at: '2026-01-01' }

function mountHeader(user = mockUser) {
  return mount(AppHeader, {
    global: {
      plugins: [
        createTestingPinia({ initialState: { auth: { user } } }),
        router,
      ],
    },
  })
}

describe('AppHeader', () => {
  it('renders the user name when user is set', () => {
    const wrapper = mountHeader()
    expect(wrapper.text()).toContain('Alice')
  })

  it('calls auth.logout when Sair button is clicked', async () => {
    const wrapper = mountHeader()
    const store = useAuthStore()
    await wrapper.find('.btn--ghost').trigger('click')
    expect(store.logout).toHaveBeenCalled()
  })
})
