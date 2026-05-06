<template>
  <div class="page">
    <AppHeader />
    <main class="main">
      <div class="page-header">
        <RouterLink to="/notes" class="back-link">{{ t('notes.new.back') }}</RouterLink>
        <h1 class="page-title">{{ t('notes.new.title') }}</h1>
      </div>
      <AppAlert v-if="error" type="error" :message="error" />
      <NoteForm :submit-label="t('notes.new.submit')" :is-loading="isLoading" @submit="handleSubmit" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import NoteForm from '@/components/notes/NoteForm.vue'
import { useNotesStore } from '@/stores/notes'

const { t } = useI18n()
const router = useRouter()
const notesStore = useNotesStore()

const isLoading = ref(false)
const error = ref('')

async function handleSubmit({ title, content }: { title: string; content: string }) {
  isLoading.value = true
  error.value = ''
  try {
    await notesStore.createNote(title, content)
    await router.push('/notes')
  } catch {
    error.value = t('notes.new.error')
  } finally {
    isLoading.value = false
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
</style>
