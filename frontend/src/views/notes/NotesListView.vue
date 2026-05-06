<template>
  <div class="page">
    <AppHeader />
    <main class="main">
      <div class="toolbar">
        <AppInput
          v-model="searchInput"
          :placeholder="t('notes.list.search_placeholder')"
          autocomplete="off"
          class="toolbar__search"
        />
        <RouterLink to="/notes/new" class="btn btn--primary">{{ t('notes.list.new_button') }}</RouterLink>
      </div>

      <AppAlert v-if="notes.error" type="error" :message="notes.error" />
      <AppAlert v-if="deleteError" type="error" :message="deleteError" />

      <div v-if="notes.isLoading" class="center">
        <AppSpinner size="lg" />
      </div>

      <template v-else>
        <div v-if="notes.notes.length > 0" class="notes-grid">
          <NoteCard
            v-for="note in notes.notes"
            :key="note.id"
            :note="note"
            @edit="router.push(`/notes/${note.id}/edit`)"
            @delete="openDeleteModal(note)"
          />
        </div>
        <div v-else class="empty">
          <p>{{ searchInput ? t('notes.list.empty_search') : t('notes.list.empty_state') }}</p>
          <RouterLink v-if="!searchInput" to="/notes/new">{{ t('notes.list.create_first') }}</RouterLink>
        </div>
      </template>

      <Pagination :pagination="notes.pagination" @page-change="changePage" />
    </main>

    <AppModal
      :open="!!noteToDelete"
      :title="t('notes.list.delete_title')"
      :description="t('notes.list.delete_description', { title: noteToDelete?.title ?? '' })"
      :confirm-label="t('notes.list.delete_confirm')"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="noteToDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppModal from '@/components/common/AppModal.vue'
import NoteCard from '@/components/notes/NoteCard.vue'
import Pagination from '@/components/notes/Pagination.vue'
import { useNotesStore } from '@/stores/notes'
import { useDebounce } from '@/composables/useDebounce'
import type { Note } from '@/types'

const { t } = useI18n()
const router = useRouter()
const notes = useNotesStore()

const searchInput = ref(notes.searchQuery)
const debouncedSearch = useDebounce(searchInput, 400)

const noteToDelete = ref<Note | null>(null)
const isDeleting = ref(false)
const deleteError = ref('')

onMounted(() => notes.fetchNotes())

watch(debouncedSearch, (q) => {
  notes.fetchNotes(1, q)
})

function changePage(page: number) {
  notes.fetchNotes(page, notes.searchQuery)
}

function openDeleteModal(note: Note) {
  noteToDelete.value = note
}

async function confirmDelete() {
  if (!noteToDelete.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await notes.deleteNote(noteToDelete.value.id)
    noteToDelete.value = null
  } catch {
    deleteError.value = t('notes.list.delete_error')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); }
.main {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}
.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}
.toolbar__search { flex: 1; }
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.center {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}
.empty {
  text-align: center;
  padding: 4rem 0;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  border: 1.5px solid transparent;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn--primary { background: var(--color-primary); color: #fff; }
.btn--primary:hover { background: var(--color-primary-hover); }
</style>
