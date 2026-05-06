import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '@/components/common/AppButton.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

describe('AppButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Salvar' } })
    expect(wrapper.text()).toContain('Salvar')
  })

  it('applies the variant class', () => {
    const wrapper = mount(AppButton, { props: { variant: 'danger' } })
    expect(wrapper.classes()).toContain('btn--danger')
  })

  it('shows AppSpinner when loading=true', () => {
    const wrapper = mount(AppButton, { props: { loading: true } })
    expect(wrapper.findComponent(AppSpinner).exists()).toBe(true)
  })

  it('is disabled when loading=true', () => {
    const wrapper = mount(AppButton, { props: { loading: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('is disabled when disabled=true', () => {
    const wrapper = mount(AppButton, { props: { disabled: true } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('applies the type attribute', () => {
    const wrapper = mount(AppButton, { props: { type: 'submit' } })
    expect(wrapper.attributes('type')).toBe('submit')
  })
})
