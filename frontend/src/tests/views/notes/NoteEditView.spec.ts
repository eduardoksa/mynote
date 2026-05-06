import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { vi } from 'vitest'
import NoteEditView from '@/views/notes/NoteEditView.vue'
import { useNotesStore } from '@/stores/notes'
import AppSpinner from '@/components/common/AppSpinner.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/notes/:id/edit', component: { template: '<div />' } },
    { path: '/notes', component: { template: '<div />' } },
  ],
})

const mockNote = { id: 5, title: 'Nota Existente', content: 'Conteúdo antigo', created_at: '2026-01-01', updated_at: '2026-01-01' }
const authUser = { id: 1, name: 'Alice', email: 'a@b.com', created_at: '' }

describe('NoteEditView', () => {
  it('shows spinner while loading the note', async () => {
    await router.push('/notes/5/edit')
    const pinia = createTestingPinia({ initialState: { auth: { user: authUser } } })
    const store = useNotesStore(pinia)
    vi.mocked(store.getNote).mockReturnValue(new Promise(() => {}))
    const wrapper = mount(NoteEditView, { global: { plugins: [router, pinia] } })
    expect(wrapper.findComponent(AppSpinner).exists()).toBe(true)
  })

  it('loads the note and passes data to NoteForm', async () => {
    await router.push('/notes/5/edit')
    const pinia = createTestingPinia({ initialState: { auth: { user: authUser } } })
    const store = useNotesStore(pinia)
    vi.mocked(store.getNote).mockResolvedValue(mockNote)
    const wrapper = mount(NoteEditView, { global: { plugins: [router, pinia] } })
    await flushPromises()
    const input = wrapper.find('input')
    expect((input.element as HTMLInputElement).value).toBe('Nota Existente')
  })

  it('calls updateNote and navigates to /notes on submit', async () => {
    await router.push('/notes/5/edit')
    const pinia = createTestingPinia({ initialState: { auth: { user: authUser } } })
    const store = useNotesStore(pinia)
    vi.mocked(store.getNote).mockResolvedValue(mockNote)
    const wrapper = mount(NoteEditView, { global: { plugins: [router, pinia] } })
    await flushPromises()
    await wrapper.find('input').setValue('Título atualizado')
    await wrapper.find('textarea').setValue('Conteúdo atualizado')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.updateNote).toHaveBeenCalledWith(5, 'Título atualizado', 'Conteúdo atualizado')
    expect(router.currentRoute.value.path).toBe('/notes')
  })

  it('shows loadError alert and hides spinner when getNote fails', async () => {
    await router.push('/notes/5/edit')
    const pinia = createTestingPinia({ initialState: { auth: { user: authUser } } })
    const store = useNotesStore(pinia)
    vi.mocked(store.getNote).mockRejectedValue(new Error('not found'))
    const wrapper = mount(NoteEditView, { global: { plugins: [router, pinia] } })
    await flushPromises()
    expect(wrapper.findComponent(AppSpinner).exists()).toBe(false)
    expect(wrapper.text()).toContain('Nota não encontrada.')
  })

  it('shows saveError alert and does not navigate when updateNote fails', async () => {
    await router.push('/notes/5/edit')
    const pinia = createTestingPinia({ initialState: { auth: { user: authUser } } })
    const store = useNotesStore(pinia)
    vi.mocked(store.getNote).mockResolvedValue(mockNote)
    vi.mocked(store.updateNote).mockRejectedValue(new Error('save failed'))
    const wrapper = mount(NoteEditView, { global: { plugins: [router, pinia] } })
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/notes/5/edit')
    expect(wrapper.text()).toContain('Não foi possível salvar')
  })
})
