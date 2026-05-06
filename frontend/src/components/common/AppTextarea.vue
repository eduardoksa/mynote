<template>
  <div class="field">
    <label v-if="label" :for="textareaId" class="field__label">{{ label }}</label>
    <textarea
      :id="textareaId"
      :value="modelValue"
      :placeholder="placeholder"
      :maxlength="maxLength"
      :rows="rows"
      :class="['field__textarea', { 'field__textarea--error': !!error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <div class="field__footer">
      <span v-if="error" class="field__error">{{ error }}</span>
      <span v-if="maxLength" :class="['field__counter', { 'field__counter--warn': isNearLimit }]">
        {{ modelValue.length }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    error?: string
    placeholder?: string
    maxLength?: number
    rows?: number
  }>(),
  {
    placeholder: '',
    rows: 5,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaId = computed(() => `textarea-${Math.random().toString(36).slice(2, 7)}`)
const isNearLimit = computed(
  () => !!props.maxLength && props.modelValue.length / props.maxLength >= 0.8,
)
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: 0.375rem; }
.field__label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
.field__textarea {
  padding: 0.625rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 0.9375rem;
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  width: 100%;
  transition: border-color 0.15s;
}
.field__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}
.field__textarea--error {
  border-color: var(--color-danger);
}
.field__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 1.25rem;
}
.field__error { font-size: 0.8125rem; color: var(--color-danger); }
.field__counter { font-size: 0.8125rem; color: var(--color-text-muted); margin-left: auto; }
.field__counter--warn { color: var(--color-danger); }
</style>
