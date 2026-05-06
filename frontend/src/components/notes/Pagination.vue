<template>
  <nav v-if="pagination && pagination.total_pages > 1" class="pagination" :aria-label="t('pagination.label')">
    <AppButton
      variant="ghost"
      :disabled="!pagination.prev_page"
      @click="$emit('page-change', pagination!.current_page - 1)"
    >
      {{ t('pagination.previous') }}
    </AppButton>
    <span class="pagination__info">
      {{ t('pagination.info', { current: pagination.current_page, total: pagination.total_pages }) }}
      <span class="pagination__total">({{ t('pagination.count', pagination.total_count) }})</span>
    </span>
    <AppButton
      variant="ghost"
      :disabled="!pagination.next_page"
      @click="$emit('page-change', pagination!.current_page + 1)"
    >
      {{ t('pagination.next') }}
    </AppButton>
  </nav>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'
import type { Pagination } from '@/types'

const { t } = useI18n()

defineProps<{
  pagination: Pagination | null
}>()

defineEmits<{
  'page-change': [page: number]
}>()
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0;
}
.pagination__info {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  text-align: center;
}
.pagination__total {
  font-size: 0.8125rem;
}
</style>
