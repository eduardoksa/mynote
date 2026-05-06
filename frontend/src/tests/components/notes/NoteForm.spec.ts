import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import NoteForm from '@/components/notes/NoteForm.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/notes', component: { template: '<div />' } },
    { path: '/', component: { template: '<div />' } },
  ],
})

function mountForm(props = {}) {
  return mount(NoteForm, { props, global: { plugins: [router] } })
}

describe('NoteForm', () => {
  it('renders the submitLabel prop', () => {
    const wrapper = mountForm({ submitLabel: 'Criar nota' })
    expect(wrapper.find('button[type="submit"]').text()).toContain('Criar nota')
  })

  it('emits submit with title and content on valid submit', async () => {
    const wrapper = mountForm()
    await wrapper.find('input').setValue('Meu título')
    await wrapper.find('textarea').setValue('Conteúdo aqui')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')?.[0]).toEqual([{ title: 'Meu título', content: 'Conteúdo aqui' }])
  })

  it('does not emit submit when title is empty', async () => {
    const wrapper = mountForm()
    await wrapper.find('textarea').setValue('Algum conteúdo')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('does not emit submit when title has only whitespace', async () => {
    const wrapper = mountForm()
    await wrapper.find('input').setValue('   ')
    await wrapper.find('textarea').setValue('Conteúdo')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('does not emit submit when title has only 1 character', async () => {
    const wrapper = mountForm()
    await wrapper.find('input').setValue('a')
    await wrapper.find('textarea').setValue('Conteúdo')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('no mínimo 2')
  })

  it('does not emit submit when content exceeds 600 chars', async () => {
    const wrapper = mountForm()
    await wrapper.find('input').setValue('Título')
    await wrapper.find('textarea').setValue('a'.repeat(601))
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('pre-fills fields from initialTitle and initialContent props', () => {
    const wrapper = mountForm({ initialTitle: 'Título existente', initialContent: 'Conteúdo existente' })
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Título existente')
    expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('Conteúdo existente')
  })

  it('updates fields when props change', async () => {
    const wrapper = mountForm({ initialTitle: '' })
    await wrapper.setProps({ initialTitle: 'Atualizado' })
    await nextTick()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Atualizado')
  })

  it('shows spinner in submit button when isLoading=true', () => {
    const wrapper = mountForm({ isLoading: true })
    expect(wrapper.find('button[type="submit"]').findComponent(AppSpinner).exists()).toBe(true)
  })
})
