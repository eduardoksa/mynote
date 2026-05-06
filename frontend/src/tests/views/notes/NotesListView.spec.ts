import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createRouter, createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import NotesListView from '@/views/notes/NotesListView.vue'
import { useNotesStore } from '@/stores/notes'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/notes', component: { template: '<div />' } },
    { path: '/notes/new', component: { template: '<div />' } },
    { path: '/notes/:id/edit', component: { template: '<div />' } },
  ],
})

const mockNote = { id: 1, title: 'Nota 1', content: 'Conteúdo 1', created_at: '2026-01-01', updated_at: '2026-01-01' }
const mockNote2 = { id: 2, title: 'Nota 2', content: 'Conteúdo 2', created_at: '2026-01-01', updated_at: '2026-01-01' }
const mockPagination = { current_page: 1, per_page: 9, total_count: 2, total_pages: 1, next_page: null, prev_page: null }

function mountView(notesState = {}) {
  return mount(NotesListView, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          initialState: {
            auth: { user: { id: 1, name: 'Alice', email: 'a@b.com', created_at: '' } },
            notes: { notes: [], pagination: null, isLoading: false, error: null, ...notesState },
          },
        }),
      ],
    },
  })
}

describe('NotesListView', () => {
  beforeEach(async () => {
    await router.push('/notes')
  })

  it('calls fetchNotes on mount', () => {
    mountView()
    const store = useNotesStore()
    expect(store.fetchNotes).toHaveBeenCalled()
  })

  it('renders a NoteCard for each note', () => {
    const wrapper = mountView({ notes: [mockNote, mockNote2] })
    expect(wrapper.findAll('.card')).toHaveLength(2)
  })

  it('shows empty state when there are no notes', () => {
    const wrapper = mountView({ notes: [] })
    expect(wrapper.text()).toContain('Você ainda não tem notas')
  })

  it('navigates to edit route when NoteCard emits edit', async () => {
    const wrapper = mountView({ notes: [mockNote] })
    await wrapper.findAll('[title="Editar"]')[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/notes/1/edit')
  })

  it('opens delete modal when NoteCard emits delete', async () => {
    const wrapper = mountView({ notes: [mockNote] })
    await wrapper.find('[title="Excluir"]').trigger('click')
    await nextTick()
    const modal = wrapper.findComponent({ name: 'AppModal' })
    expect(modal.props('open')).toBe(true)
    expect(modal.props('title')).toContain('Excluir')
  })

  it('calls deleteNote and closes modal on confirm', async () => {
    const wrapper = mountView({ notes: [mockNote] })
    const store = useNotesStore()
    await wrapper.find('[title="Excluir"]').trigger('click')
    await nextTick()
    const modal = wrapper.findComponent({ name: 'AppModal' })
    await modal.vm.$emit('confirm')
    await flushPromises()
    expect(store.deleteNote).toHaveBeenCalledWith(1)
    expect(modal.props('open')).toBe(false)
  })

  it('calls fetchNotes with page number on page-change from Pagination', async () => {
    const pagination = { ...mockPagination, total_pages: 3, next_page: 2, total_count: 25 }
    const wrapper = mountView({ notes: [mockNote, mockNote2], pagination })
    const store = useNotesStore()
    vi.mocked(store.fetchNotes).mockClear()
    const buttons = wrapper.findAll('.pagination button')
    await buttons[1].trigger('click')
    expect(store.fetchNotes).toHaveBeenCalledWith(2, expect.anything())
  })

  it('calls fetchNotes with search term after debounce delay', async () => {
    vi.useFakeTimers()
    const wrapper = mountView()
    const store = useNotesStore()
    vi.mocked(store.fetchNotes).mockClear()
    const searchInput = wrapper.find('input')
    await searchInput.setValue('busca')
    vi.advanceTimersByTime(399)
    await nextTick()
    expect(store.fetchNotes).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(store.fetchNotes).toHaveBeenCalledWith(1, 'busca')
    vi.useRealTimers()
  })

  it('shows AppAlert when notes.error is set', () => {
    const wrapper = mountView({ error: 'Falha ao carregar notas' })
    expect(wrapper.text()).toContain('Falha ao carregar notas')
  })

  it('closes modal and does not call deleteNote when cancel is emitted', async () => {
    const wrapper = mountView({ notes: [mockNote] })
    const store = useNotesStore()
    await wrapper.find('[title="Excluir"]').trigger('click')
    await nextTick()
    const modal = wrapper.findComponent({ name: 'AppModal' })
    await modal.vm.$emit('cancel')
    await flushPromises()
    expect(store.deleteNote).not.toHaveBeenCalled()
    expect(modal.props('open')).toBe(false)
  })

  it('modal stays open and shows error when deleteNote fails', async () => {
    const wrapper = mountView({ notes: [mockNote] })
    const store = useNotesStore()
    vi.mocked(store.deleteNote).mockRejectedValue(new Error('falha'))
    await wrapper.find('[title="Excluir"]').trigger('click')
    await nextTick()
    const modal = wrapper.findComponent({ name: 'AppModal' })
    await modal.vm.$emit('confirm')
    await flushPromises()
    expect(modal.props('open')).toBe(true)
    expect(wrapper.text()).toContain('Não foi possível excluir a nota')
  })
})
