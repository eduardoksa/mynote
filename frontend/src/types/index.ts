export interface User {
  id: number
  name: string
  email: string
  created_at: string
}

export interface Note {
  id: number
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

export interface Pagination {
  current_page: number
  per_page: number
  total_count: number
  total_pages: number
  next_page: number | null
  prev_page: number | null
}

export interface NotesListResponse {
  notes: Note[]
  pagination: Pagination
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface RefreshResponse {
  access_token: string
}

export interface MessageResponse {
  message: string
}

export interface RegisterPayload {
  user: {
    name: string
    email: string
    password: string
    password_confirmation: string
  }
}

export interface LoginPayload {
  user: {
    email: string
    password: string
  }
}

export interface NotePayload {
  note: {
    title: string
    content: string
  }
}

export interface ApiErrorSingle {
  error: string
}

export interface ApiErrorList {
  errors: string[]
}

export type ApiError = ApiErrorSingle | ApiErrorList

export type ValidationRule<T> = (value: T) => string | true
export type FieldErrors = Record<string, string>
