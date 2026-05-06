import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '@/components/common/AppModal.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

const teleportStub = { template: '<div><slot /></div>' }

interface ModalProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  loading?: boolean
}

function mountModal(props: ModalProps) {
  return mount(AppModal, {
    props,
    global: { stubs: { Teleport: teleportStub } },
  })
}

describe('AppModal', () => {
  it('does not render content when open=false', () => {
    const wrapper = mountModal({ open: false, title: 'Excluir' })
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('renders title and description when open=true', () => {
    const wrapper = mountModal({ open: true, title: 'Excluir nota', description: 'Tem certeza?' })
    expect(wrapper.text()).toContain('Excluir nota')
    expect(wrapper.text()).toContain('Tem certeza?')
  })

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mountModal({ open: true, title: 'Excluir' })
    await wrapper.find('.btn--danger').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mountModal({ open: true, title: 'Excluir' })
    await wrapper.find('.btn--ghost').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits cancel when backdrop is clicked', async () => {
    const wrapper = mountModal({ open: true, title: 'Excluir' })
    await wrapper.find('.modal-backdrop').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('shows spinner in confirm button when loading=true', () => {
    const wrapper = mountModal({ open: true, title: 'Excluir', loading: true })
    expect(wrapper.findComponent(AppSpinner).exists()).toBe(true)
  })

  it('confirm button is disabled when loading=true', () => {
    const wrapper = mountModal({ open: true, title: 'Excluir', loading: true })
    expect(wrapper.find('.btn--danger').attributes('disabled')).toBeDefined()
  })
})
