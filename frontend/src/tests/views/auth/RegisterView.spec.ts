import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import RegisterView from '@/views/auth/RegisterView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/register', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
    { path: '/notes', component: { template: '<div />' } },
  ],
})

function mountView(authState = {}) {
  return mount(RegisterView, {
    global: {
      plugins: [
        router,
        createTestingPinia({ initialState: { auth: { error: null, isLoading: false, ...authState } } }),
      ],
    },
  })
}

describe('RegisterView', () => {
  it('renders four input fields', () => {
    const wrapper = mountView()
    expect(wrapper.findAll('input')).toHaveLength(4)
  })

  it('calls auth.register with the correct payload on valid submit', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('Senha123!')
    await inputs[3].setValue('Senha123!')
    await wrapper.find('form').trigger('submit')
    expect(store.register).toHaveBeenCalledWith({
      user: { name: 'Alice', email: 'alice@example.com', password: 'Senha123!', password_confirmation: 'Senha123!' },
    })
  })

  it('does not call auth.register when required fields are empty', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    await wrapper.find('form').trigger('submit')
    expect(store.register).not.toHaveBeenCalled()
  })

  it('renders a link to /login', () => {
    const wrapper = mountView()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/login')
  })

  it('shows error and does not call register when passwords do not match', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('Senha123!')
    await inputs[3].setValue('OutraSenha1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('As senhas não coincidem')
  })

  it('shows error and does not call register when password is shorter than 8 characters', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('curta')
    await inputs[3].setValue('curta')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Senha deve ter no mínimo 8 caracteres')
  })

  it('shows AppAlert when auth.error is set after a failed register attempt', () => {
    const wrapper = mountView({ error: 'Email já em uso' })
    expect(wrapper.text()).toContain('Email já em uso')
  })

  it('shows error and does not call register when password lacks complexity (no uppercase, no special char)', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('senha12345')
    await inputs[3].setValue('senha12345')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('maiúscula')
  })

  it('shows error and does not call register when password exceeds 32 characters', async () => {
    const wrapper = mountView()
    const store = useAuthStore()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Alice')
    await inputs[1].setValue('alice@example.com')
    await inputs[2].setValue('Senha1234!'.padEnd(33, 'x'))
    await inputs[3].setValue('Senha1234!'.padEnd(33, 'x'))
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.register).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('no máximo 32')
  })
})
