<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="$emit('cancel')" @keydown.esc="$emit('cancel')">
      <div class="modal" role="dialog" :aria-label="title">
        <h2 class="modal__title">{{ title }}</h2>
        <p v-if="description" class="modal__description">{{ description }}</p>
        <div class="modal__actions">
          <AppButton variant="ghost" @click="$emit('cancel')">{{ t('common.cancel') }}</AppButton>
          <AppButton variant="danger" :loading="loading" @click="$emit('confirm')">
            {{ confirmLabel || t('common.confirm') }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'

const { t } = useI18n()

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  {
    confirmLabel: '',
    loading: false,
  },
)

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal {
  background: var(--color-surface);
  border-radius: var(--radius);
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}
.modal__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.modal__description {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
  margin-bottom: 1.5rem;
}
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
