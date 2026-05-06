import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AuthLayout from '@/components/layout/AuthLayout.vue'

describe('AuthLayout', () => {
  it('renders slot content', () => {
    const wrapper = mount(AuthLayout, { slots: { default: '<p>Formulário de login</p>' } })
    expect(wrapper.text()).toContain('Formulário de login')
  })
})
