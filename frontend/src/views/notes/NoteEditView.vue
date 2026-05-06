<template>
  <div class="page">
    <AppHeader />
    <main class="main">
      <div class="page-header">
        <RouterLink to="/notes" class="back-link">{{ t('notes.edit.back') }}</RouterLink>
        <h1 class="page-title">{{ t('notes.edit.title') }}</h1>
      </div>

      <div v-if="isLoadingNote" class="center">
        <AppSpinner size="lg" />
      </div>
      <template v-else-if="loadError">
        <AppAlert type="error" :message="loadError" />
        <RouterLink to="/notes" class="back-link">{{ t('notes.edit.back_on_error') }}</RouterLink>
      </template>
      <template v-else>
        <AppAlert v-if="saveError" type="error" :message="saveError" />
        <NoteForm
          :initial-title="note?.title"
          :initial-content="note?.content ?? ''"
          :submit-label="t('notes.edit.submit')"
          :is-loading="isSaving"
          @submit="handleSubmit"
        />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import NoteForm from '@/components/notes/NoteForm.vue'
import { useNotesStore } from '@/stores/notes'
import type { Note } from '@/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const note = ref<Note | null>(null)
const isLoadingNote = ref(true)
const isSaving = ref(false)
const loadError = ref('')
const saveError = ref('')

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    note.value = await notesStore.getNote(id)
  } catch {
    loadError.value = t('notes.edit.not_found')
  } finally {
    isLoadingNote.value = false
  }
})

async function handleSubmit({ title, content }: { title: string; content: string }) {
  if (!note.value) return
  isSaving.value = true
  saveError.value = ''
  try {
    await notesStore.updateNote(note.value.id, title, content)
    await router.push('/notes')
  } catch {
    saveError.value = t('notes.edit.error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.page { min-height: 100vh; background: var(--color-bg); }
.main {
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem;
}
.page-header { margin-bottom: 1.5rem; }
.back-link { font-size: 0.875rem; color: var(--color-text-muted); text-decoration: none; }
.back-link:hover { color: var(--color-primary); }
.page-title { font-size: 1.5rem; font-weight: 700; margin-top: 0.5rem; }
.center {
  display: flex;
  justify-content: center;
  padding: 4rem 0;
}
</style>
