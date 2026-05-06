import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from '@/stores/notes'
import { axiosMock } from '../__mocks__/axiosMock'

const mockNote = { id: 1, title: 'Nota 1', content: 'Conteúdo', created_at: '2026-01-01', updated_at: '2026-01-01' }
const mockNote2 = { id: 2, title: 'Nota 2', content: 'Outro', created_at: '2026-01-01', updated_at: '2026-01-01' }
const mockPagination = { current_page: 1, per_page: 9, total_count: 2, total_pages: 1, next_page: null, prev_page: null }

describe('useNotesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    axiosMock.reset()
  })

  it('fetchNotes() populates notes and pagination', async () => {
    axiosMock.onGet('/notes').reply(200, { notes: [mockNote, mockNote2], pagination: mockPagination })
    const store = useNotesStore()
    await store.fetchNotes()
    expect(store.notes).toHaveLength(2)
    expect(store.notes[0]).toEqual(mockNote)
    expect(store.pagination).toEqual(mockPagination)
    expect(store.isLoading).toBe(false)
  })

  it('fetchNotes() passes page and search params', async () => {
    axiosMock.onGet('/notes', { params: { page: 2, q: 'busca' } }).reply(200, { notes: [], pagination: mockPagination })
    const store = useNotesStore()
    await store.fetchNotes(2, 'busca')
    expect(store.currentPage).toBe(2)
    expect(store.searchQuery).toBe('busca')
  })

  it('createNote() returns the created note', async () => {
    axiosMock.onPost('/notes').reply(201, { note: mockNote })
    const store = useNotesStore()
    const result = await store.createNote('Nota 1', 'Conteúdo')
    expect(result).toEqual(mockNote)
  })

  it('updateNote() returns the updated note', async () => {
    const updated = { ...mockNote, title: 'Atualizada' }
    axiosMock.onPatch('/notes/1').reply(200, { note: updated })
    axiosMock.onGet('/notes').reply(200, { notes: [updated], pagination: mockPagination })
    const store = useNotesStore()
    const result = await store.updateNote(1, 'Atualizada', 'Conteúdo')
    expect(result).toEqual(updated)
  })

  it('deleteNote() removes the note from local state and decrements total_count', async () => {
    axiosMock.onDelete('/notes/1').reply(204)
    const store = useNotesStore()
    store.notes = [mockNote, mockNote2]
    store.pagination = { ...mockPagination, total_count: 2 }
    await store.deleteNote(1)
    expect(store.notes).toHaveLength(1)
    expect(store.notes[0].id).toBe(2)
    expect(store.pagination!.total_count).toBe(1)
  })

  it('getNote() returns a single note by id', async () => {
    axiosMock.onGet('/notes/1').reply(200, { note: mockNote })
    const store = useNotesStore()
    const result = await store.getNote(1)
    expect(result).toEqual(mockNote)
  })

  it('resetSearch() clears searchQuery and resets currentPage to 1', () => {
    const store = useNotesStore()
    store.searchQuery = 'algo'
    store.currentPage = 3
    store.resetSearch()
    expect(store.searchQuery).toBe('')
    expect(store.currentPage).toBe(1)
  })

  // fetchNotes() error handling
  it('fetchNotes() sets error state when API fails', async () => {
    axiosMock.onGet('/notes').reply(500, { error: 'Erro interno' })
    const store = useNotesStore()
    await store.fetchNotes()
    expect(store.error).toBe('Erro interno')
    expect(store.isLoading).toBe(false)
    expect(store.notes).toHaveLength(0)
  })

  it('fetchNotes() clears error on subsequent successful call', async () => {
    axiosMock.onGet('/notes').replyOnce(500, { error: 'Erro interno' })
    const store = useNotesStore()
    await store.fetchNotes()
    expect(store.error).toBe('Erro interno')
    axiosMock.onGet('/notes').reply(200, { notes: [mockNote], pagination: mockPagination })
    await store.fetchNotes()
    expect(store.error).toBeNull()
  })

  // CRUD error handling (re-throw, store.error not set)
  it('createNote() rejects when API returns error', async () => {
    axiosMock.onPost('/notes').reply(422, { error: 'Título obrigatório' })
    const store = useNotesStore()
    await expect(store.createNote('', 'conteúdo')).rejects.toThrow()
  })

  it('updateNote() rejects when API returns error', async () => {
    axiosMock.onPatch('/notes/1').reply(500)
    const store = useNotesStore()
    await expect(store.updateNote(1, 'título', 'conteúdo')).rejects.toThrow()
  })

  it('deleteNote() rejects when API returns error and notes remain unchanged', async () => {
    axiosMock.onDelete('/notes/1').reply(500)
    const store = useNotesStore()
    store.notes = [mockNote, mockNote2]
    await expect(store.deleteNote(1)).rejects.toThrow()
    expect(store.notes).toHaveLength(2)
  })

  it('getNote() rejects when note is not found (404)', async () => {
    axiosMock.onGet('/notes/99').reply(404, { error: 'Nota não encontrada' })
    const store = useNotesStore()
    await expect(store.getNote(99)).rejects.toThrow()
  })

  // deleteNote() pagination edge cases
  it('deleteNote() fetches previous page when deleting last item on page > 1', async () => {
    axiosMock.onDelete('/notes/1').reply(204)
    axiosMock.onGet('/notes').reply(200, { notes: [mockNote2], pagination: { ...mockPagination, current_page: 1 } })
    const store = useNotesStore()
    store.notes = [mockNote]
    store.currentPage = 2
    store.pagination = { ...mockPagination, current_page: 2, total_count: 1 }
    await store.deleteNote(1)
    expect(store.currentPage).toBe(1)
    expect(store.notes[0]).toEqual(mockNote2)
  })

  it('deleteNote() stays on page 1 when deleting last item on page 1', async () => {
    axiosMock.onDelete('/notes/1').reply(204)
    const store = useNotesStore()
    store.notes = [mockNote]
    store.currentPage = 1
    store.pagination = { ...mockPagination, current_page: 1, total_count: 1 }
    await store.deleteNote(1)
    expect(store.notes).toHaveLength(0)
    expect(store.currentPage).toBe(1)
  })
})
