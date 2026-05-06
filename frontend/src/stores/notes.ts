import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notesApi } from '@/api/notes'
import i18n from '@/i18n'
import type { Note, Pagination } from '@/types'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>([])
  const pagination = ref<Pagination | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const searchQuery = ref('')

  async function fetchNotes(page = currentPage.value, search = searchQuery.value): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await notesApi.list(page, search)
      notes.value = data.notes
      pagination.value = data.pagination
      currentPage.value = page
      searchQuery.value = search
    } catch (err) {
      error.value = extractError(err)
    } finally {
      isLoading.value = false
    }
  }

  async function createNote(title: string, content: string): Promise<Note> {
    const { data } = await notesApi.create({ note: { title, content } })
    return data.note
  }

  async function updateNote(id: number, title: string, content: string): Promise<Note> {
    const { data } = await notesApi.update(id, { note: { title, content } })
    await fetchNotes()
    return data.note
  }

  async function deleteNote(id: number): Promise<void> {
    await notesApi.delete(id)
    notes.value = notes.value.filter((n) => n.id !== id)
    if (pagination.value) {
      pagination.value = {
        ...pagination.value,
        total_count: pagination.value.total_count - 1,
      }
    }
    if (notes.value.length === 0 && currentPage.value > 1) {
      await fetchNotes(currentPage.value - 1)
    }
  }

  async function getNote(id: number): Promise<Note> {
    const { data } = await notesApi.get(id)
    return data.note
  }

  function resetSearch(): void {
    searchQuery.value = ''
    currentPage.value = 1
  }

  return {
    notes,
    pagination,
    isLoading,
    error,
    currentPage,
    searchQuery,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    resetSearch,
  }
})

function extractError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { errors?: string[]; error?: string } } }).response
      ?.data
    if (data?.errors?.length) return data.errors.join(', ')
    if (data?.error) return data.error
  }
  return i18n.global.t('notes.unexpected_error')
}
