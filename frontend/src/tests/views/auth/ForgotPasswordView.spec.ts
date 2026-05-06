import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import { axiosMock } from '../../__mocks__/axiosMock'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/forgot-password', component: { template: '<div />' } },
    { path: '/login', component: { template: '<div />' } },
  ],
})

function mountView() {
  return mount(ForgotPasswordView, { global: { plugins: [router] } })
}

describe('ForgotPasswordView', () => {
  beforeEach(() => axiosMock.reset())

  it('renders email input and submit button', () => {
    const wrapper = mountView()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('calls POST /auth/password-reset with the email on submit', async () => {
    axiosMock.onPost('/auth/password-reset').reply(200, { message: 'Verifique seu email' })
    const wrapper = mountView()
    await wrapper.find('input[type="email"]').setValue('alice@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(axiosMock.history.post).toHaveLength(1)
    expect(JSON.parse(axiosMock.history.post[0].data)).toEqual({ email: 'alice@example.com' })
  })

  it('shows success message after submit', async () => {
    axiosMock.onPost('/auth/password-reset').reply(200, { message: 'Verifique seu email' })
    const wrapper = mountView()
    await wrapper.find('input[type="email"]').setValue('alice@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Verifique seu email')
  })

  it('hides the form after successful submit', async () => {
    axiosMock.onPost('/auth/password-reset').reply(200, { message: 'Verifique seu email' })
    const wrapper = mountView()
    await wrapper.find('input[type="email"]').setValue('alice@example.com')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('renders a link back to /login', () => {
    const wrapper = mountView()
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/login')
  })
})
