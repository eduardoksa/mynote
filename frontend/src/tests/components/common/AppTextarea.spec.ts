import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTextarea from '@/components/common/AppTextarea.vue'

describe('AppTextarea', () => {
  it('renders the label when provided', () => {
    const wrapper = mount(AppTextarea, { props: { modelValue: '', label: 'Conteúdo' } })
    expect(wrapper.find('label').text()).toBe('Conteúdo')
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppTextarea, { props: { modelValue: '' } })
    await wrapper.find('textarea').setValue('novo texto')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['novo texto'])
  })

  it('shows character counter when maxLength is set', () => {
    const wrapper = mount(AppTextarea, { props: { modelValue: 'hi', maxLength: 600 } })
    expect(wrapper.text()).toContain('2/600')
  })

  it('does not add warn class below 80% of maxLength', () => {
    const content = 'a'.repeat(479)
    const wrapper = mount(AppTextarea, { props: { modelValue: content, maxLength: 600 } })
    expect(wrapper.find('.field__counter').classes()).not.toContain('field__counter--warn')
  })

  it('adds warn class at 80% of maxLength', () => {
    const content = 'a'.repeat(480)
    const wrapper = mount(AppTextarea, { props: { modelValue: content, maxLength: 600 } })
    expect(wrapper.find('.field__counter').classes()).toContain('field__counter--warn')
  })
})
