<template>
  <div class="field">
    <label v-if="label" :for="inputId" class="field__label">{{ label }}</label>
    <input
      :id="inputId"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :minlength="minLength"
      :maxlength="maxLength"
      :class="['field__input', { 'field__input--error': !!error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" class="field__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    type?: string
    error?: string
    placeholder?: string
    autocomplete?: string
    minLength?: number
    maxLength?: number
  }>(),
  {
    type: 'text',
    placeholder: '',
    autocomplete: 'off',
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputId = computed(() => `input-${Math.random().toString(36).slice(2, 7)}`)
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field__label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
.field__input {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s;
  width: 100%;
}
.field__input:focus {
  outline: none;
  border-color: var(--color-primary);
}
.field__input--error {
  border-color: var(--color-danger);
}
.field__error {
  font-size: 0.8125rem;
  color: var(--color-danger);
}
</style>
