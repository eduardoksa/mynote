import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '@/components/common/AppInput.vue'

describe('AppInput', () => {
  it('renders the label when provided', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', label: 'Email' } })
    expect(wrapper.find('label').text()).toBe('Email')
  })

  it('label for matches input id', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', label: 'Email' } })
    const labelFor = wrapper.find('label').attributes('for')
    const inputId = wrapper.find('input').attributes('id')
    expect(labelFor).toBe(inputId)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(AppInput, { props: { modelValue: '' } })
    const input = wrapper.find('input')
    await input.setValue('novo valor')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['novo valor'])
  })

  it('displays modelValue in the input', () => {
    const wrapper = mount(AppInput, { props: { modelValue: 'hello' } })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('hello')
  })

  it('shows error message when error prop is set', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', error: 'Campo obrigatório' } })
    expect(wrapper.text()).toContain('Campo obrigatório')
  })

  it('adds error class to input when error prop is set', () => {
    const wrapper = mount(AppInput, { props: { modelValue: '', error: 'Erro' } })
    expect(wrapper.find('input').classes()).toContain('field__input--error')
  })
})
