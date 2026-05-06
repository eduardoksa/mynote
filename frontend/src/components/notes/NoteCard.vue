<template>
  <article class="card">
    <div class="card__body">
      <h3 class="card__title">{{ note.title }}</h3>
      <p v-if="note.content" class="card__excerpt">{{ excerpt }}</p>
      <p v-else class="card__empty">{{ t('notes.card.no_content') }}</p>
    </div>
    <footer class="card__footer">
      <time class="card__date">{{ formattedDate }}</time>
      <div class="card__actions">
        <button class="card__btn" type="button" :title="t('notes.card.edit')" @click="$emit('edit')">
          ✏️
        </button>
        <button class="card__btn card__btn--danger" type="button" :title="t('notes.card.delete')" @click="$emit('delete')">
          🗑️
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Note } from '@/types'

const { t, locale } = useI18n()

const props = defineProps<{ note: Note }>()

defineEmits<{
  edit: []
  delete: []
}>()

const excerpt = computed(() => {
  const text = props.note.content ?? ''
  return text.length > 120 ? text.slice(0, 120) + '…' : text
})

const formattedDate = computed(() => {
  return new Intl.DateTimeFormat(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(props.note.updated_at))
})
</script>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: box-shadow 0.15s;
}
.card:hover {
  box-shadow: var(--shadow);
}
.card__body { flex: 1; }
.card__title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.card__excerpt {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}
.card__empty {
  font-size: 0.875rem;
  color: var(--color-border);
  font-style: italic;
}
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}
.card__date {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
.card__actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.15s;
}
.card:hover .card__actions,
.card:focus-within .card__actions {
  opacity: 1;
}
.card__btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1;
  transition: background 0.1s;
}
.card__btn:hover { background: var(--color-bg); }
</style>
