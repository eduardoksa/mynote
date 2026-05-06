import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: { template: '<div />' } },
    { path: '/register', component: { template: '<div />' } },
    { path: '/forgot-password', component: { template: '<div />' } },
    { path: '/notes', component: { template: '<div />' } },
  ],
})

function mountView(initialState = {}) {
  return mount(LoginView, {
    global: {
      plugins: [
        router,
        createTestingPinia({ initialState: { auth: { error: null, isLoading: false, ...initialState } } }),
      ],
    },
  })
}

describe('LoginView', () => {
  it('renders email and password inputs', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('input')).toHaveLength(2)
  })

  it('renders links to forgot-password and register', () => {
    const wrapper = mountView()
    const links = wrapper.findAll('a')
    const hrefs = links.map((l) => l.attributes('href'))
    expect(hrefs).toContain('/forgot-password')
    expect(hrefs).toContain('/register')
  })

  it('calls auth.login with the correct payload on submit', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('alice@example.com')
    await inputs[1].setValue('senha123')
    await wrapper.find('form').trigger('submit')
    expect(store.login).toHaveBeenCalledWith({ user: { email: 'alice@example.com', password: 'senha123' } })
  })

  it('does not call auth.login when fields are empty', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    await wrapper.find('form').trigger('submit')
    expect(store.login).not.toHaveBeenCalled()
  })

  it('shows AppAlert when auth.error is set', () => {
    const wrapper = mountView({ error: 'Credenciais inválidas' })
    expect(wrapper.text()).toContain('Credenciais inválidas')
  })

  it('submit button is disabled when auth.isLoading is true', () => {
    const wrapper = mountView({ isLoading: true })
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('shows inline error and does not call login when email format is invalid', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('notanemail')
    await inputs[1].setValue('senha123')
    await wrapper.find('form').trigger('submit')
    expect(store.login).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Email inválido')
  })
})
