import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import { axiosMock } from '../../__mocks__/axiosMock'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/reset-password', component: { template: '<div />' } },
    { path: '/forgot-password', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
  ],
})

async function mountView(withToken = true) {
  const path = withToken ? '/reset-password?token=abc123' : '/reset-password'
  await router.push(path)
  return mount(ResetPasswordView, { global: { plugins: [router] } })
}

describe('ResetPasswordView', () => {
  beforeEach(() => axiosMock.reset())

  it('renders password and confirmation inputs when token is present', async () => {
    const wrapper = await mountView()
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
  })

  it('calls PATCH /auth/password-reset/:token on submit', async () => {
    axiosMock.onPatch('/auth/password-reset/abc123').reply(200, { message: 'Senha redefinida' })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('NovaSenha1!')
    await inputs[1].setValue('NovaSenha1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.patch).toHaveLength(1)
  })

  it('shows success message after reset', async () => {
    axiosMock.onPatch('/auth/password-reset/abc123').reply(200, { message: 'Senha redefinida com sucesso' })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('NovaSenha1!')
    await inputs[1].setValue('NovaSenha1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Senha redefinida com sucesso')
  })

  it('shows a link to /login after success', async () => {
    axiosMock.onPatch('/auth/password-reset/abc123').reply(200, { message: 'Senha redefinida' })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('NovaSenha1!')
    await inputs[1].setValue('NovaSenha1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/login')
  })

  it('shows an error alert when token is missing', async () => {
    const wrapper = await mountView(false)
    expect(wrapper.text()).toContain('Link inválido')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  // Validação local
  it('does not call API when passwords do not match', async () => {
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('senha123')
    await inputs[1].setValue('outrasenha')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.patch).toHaveLength(0)
    expect(wrapper.text()).toContain('As senhas não coincidem')
  })

  it('does not call API when password is shorter than 8 characters', async () => {
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('curta')
    await inputs[1].setValue('curta')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.patch).toHaveLength(0)
    expect(wrapper.text()).toContain('Senha deve ter no mínimo 8 caracteres')
  })

  it('shows error message when API returns failure', async () => {
    axiosMock.onPatch('/auth/password-reset/abc123').reply(422, { error: 'Token expirado' })
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('NovaSenha1!')
    await inputs[1].setValue('NovaSenha1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Link inválido ou expirado')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('does not call API when password lacks complexity (no special char)', async () => {
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('Senha12345')
    await inputs[1].setValue('Senha12345')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.patch).toHaveLength(0)
    expect(wrapper.text()).toContain('maiúscula')
  })

  it('does not call API when password exceeds 32 characters', async () => {
    const wrapper = await mountView()
    const inputs = wrapper.findAll('input[type="password"]')
    await inputs[0].setValue('Senha1234!'.padEnd(33, 'x'))
    await inputs[1].setValue('Senha1234!'.padEnd(33, 'x'))
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.patch).toHaveLength(0)
    expect(wrapper.text()).toContain('no máximo 32')
  })
})
