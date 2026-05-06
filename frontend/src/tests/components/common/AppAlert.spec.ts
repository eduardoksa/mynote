import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AppAlert from '@/components/common/AppAlert.vue'

describe('AppAlert', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders the message', () => {
    const wrapper = mount(AppAlert, { props: { type: 'success', message: 'Operação concluída' } })
    expect(wrapper.text()).toContain('Operação concluída')
  })

  it('applies the correct type class', () => {
    const wrapper = mount(AppAlert, { props: { type: 'error', message: 'Erro' } })
    expect(wrapper.find('[role="alert"]').classes()).toContain('alert--error')
  })

  it('auto-hides after 5000ms', async () => {
    const wrapper = mount(AppAlert, { props: { type: 'success', message: 'Ok' } })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    vi.advanceTimersByTime(5000)
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('hides immediately when close button is clicked', async () => {
    const wrapper = mount(AppAlert, { props: { type: 'success', message: 'Ok' } })
    await wrapper.find('.alert__close').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('resets the timer when message prop changes', async () => {
    const wrapper = mount(AppAlert, { props: { type: 'success', message: 'Primeiro' } })
    vi.advanceTimersByTime(4000)
    await wrapper.setProps({ message: 'Segundo' })
    vi.advanceTimersByTime(4999)
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
