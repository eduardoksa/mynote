import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSpinner from '@/components/common/AppSpinner.vue'

describe('AppSpinner', () => {
  it('renders with the correct size class', () => {
    const wrapper = mount(AppSpinner, { props: { size: 'lg' } })
    expect(wrapper.classes()).toContain('spinner--lg')
  })

  it('has accessible role and aria-label', () => {
    const wrapper = mount(AppSpinner)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Carregando...')
  })

  it('renders without props without crashing', () => {
    const wrapper = mount(AppSpinner)
    expect(wrapper.exists()).toBe(true)
  })
})
