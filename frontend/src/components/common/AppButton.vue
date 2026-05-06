<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`]"
  >
    <AppSpinner v-if="loading" size="sm" class="btn__spinner" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import AppSpinner from './AppSpinner.vue'

withDefaults(
  defineProps<{
    variant?: 'primary' | 'ghost' | 'danger'
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    type: 'button',
    loading: false,
    disabled: false,
  },
)
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.btn--primary:not(:disabled):hover {
  background: var(--color-primary-hover);
}
.btn--ghost {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}
.btn--ghost:not(:disabled):hover {
  background: var(--color-bg);
}
.btn--danger {
  background: var(--color-danger);
  color: #fff;
}
.btn--danger:not(:disabled):hover {
  background: #b91c1c;
}
.btn__spinner {
  flex-shrink: 0;
}
</style>
