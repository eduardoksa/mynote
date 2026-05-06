import { apiClient } from './client'
import type { Note, NotesListResponse, NotePayload } from '@/types'

export const notesApi = {
  list(page = 1, search = '') {
    return apiClient.get<NotesListResponse>('/notes', {
      params: {
        page,
        ...(search ? { q: search } : {}),
      },
    })
  },

  get(id: number) {
    return apiClient.get<{ note: Note }>(`/notes/${id}`)
  },

  create(payload: NotePayload) {
    return apiClient.post<{ note: Note }>('/notes', payload)
  },

  update(id: number, payload: NotePayload) {
    return apiClient.patch<{ note: Note }>(`/notes/${id}`, payload)
  },

  delete(id: number) {
    return apiClient.delete<void>(`/notes/${id}`)
  },
}
