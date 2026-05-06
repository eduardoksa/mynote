<template>
  <form class="note-form" @submit.prevent="handleSubmit">
    <AppInput
      v-model="fields.title"
      :label="t('notes.form.title_label')"
      :placeholder="t('notes.form.title_placeholder')"
      autocomplete="off"
      :min-length="2"
      :max-length="100"
      :error="errors.title"
    />
    <AppTextarea
      v-model="fields.content"
      :label="t('notes.form.content_label')"
      :placeholder="t('notes.form.content_placeholder')"
      :max-length="600"
      :error="errors.content"
    />
    <div class="note-form__actions">
      <RouterLink to="/notes" class="btn btn--ghost">{{ t('notes.form.cancel') }}</RouterLink>
      <AppButton type="submit" :loading="isLoading">{{ submitLabel || t('notes.form.save') }}</AppButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppInput from '@/components/common/AppInput.vue'
import AppTextarea from '@/components/common/AppTextarea.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    initialTitle?: string
    initialContent?: string
    isLoading?: boolean
    submitLabel?: string
  }>(),
  {
    initialTitle: '',
    initialContent: '',
    isLoading: false,
    submitLabel: '',
  },
)

const emit = defineEmits<{
  submit: [{ title: string; content: string }]
}>()

const { fields, errors, validate } = useForm(
  { title: props.initialTitle, content: props.initialContent },
  {
    title: [
      (v) => (v.trim().length > 0 ? true : t('notes.validation.title_required')),
      (v) => (v.trim().length >= 2 ? true : t('notes.validation.title_min')),
      (v) => (v.length <= 100 ? true : t('notes.validation.title_max')),
    ],
    content: [(v) => (v.length <= 600 ? true : t('notes.validation.content_max'))],
  },
)

watch(
  () => [props.initialTitle, props.initialContent],
  ([t, c]) => {
    fields.title = t
    fields.content = c
  },
)

function handleSubmit() {
  if (!validate()) return
  emit('submit', { title: fields.title.trim(), content: fields.content })
}
</script>

<style scoped>
.note-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.note-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.btn--ghost {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-text);
}
.btn--ghost:hover { background: var(--color-bg); }
</style>
