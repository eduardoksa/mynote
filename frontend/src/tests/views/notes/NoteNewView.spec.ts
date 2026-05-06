import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import NoteNewView from '@/views/notes/NoteNewView.vue'
import { useNotesStore } from '@/stores/notes'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/notes/new', component: { template: '<div />' } },
    { path: '/notes', component: { template: '<div />' } },
  ],
})

function mountView() {
  return mount(NoteNewView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          initialState: { auth: { user: { id: 1, name: 'Alice', email: 'a@b.com', created_at: '' } } },
        }),
      ],
    },
  })
}

describe('NoteNewView', () => {
  it('renders NoteForm with submitLabel "Criar nota"', () => {
    const wrapper = mountView()
    expect(wrapper.find('button[type="submit"]').text()).toContain('Criar nota')
  })

  it('calls notesStore.createNote and navigates to /notes on submit', async () => {
    await router.push('/notes/new')
    const wrapper = mountView()
    const store = useNotesStore()
    await wrapper.find('input').setValue('Meu título')
    await wrapper.find('textarea').setValue('Conteúdo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.createNote).toHaveBeenCalledWith('Meu título', 'Conteúdo')
    expect(router.currentRoute.value.path).toBe('/notes')
  })

  it('shows error alert and does not navigate when createNote fails', async () => {
    await router.push('/notes/new')
    const pinia = createTestingPinia({
      initialState: { auth: { user: { id: 1, name: 'Alice', email: 'a@b.com', created_at: '' } } },
    })
    const store = useNotesStore(pinia)
    vi.mocked(store.createNote).mockRejectedValue(new Error('API error'))
    const wrapper = mount(NoteNewView, { global: { plugins: [router, pinia] } })
    await wrapper.find('input').setValue('Título')
    await wrapper.find('textarea').setValue('Conteúdo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/notes/new')
    expect(wrapper.text()).toContain('Não foi possível criar a nota')
  })
})
