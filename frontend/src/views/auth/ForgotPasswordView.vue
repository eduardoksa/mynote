<template>
  <AuthLayout>
    <h2 class="title">{{ t('auth.forgot_password.title') }}</h2>
    <AppAlert v-if="successMessage" type="success" :message="successMessage" />
    <AppAlert v-if="errorMessage" type="error" :message="errorMessage" />
    <form v-if="!successMessage" class="form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="fields.email"
        :label="t('auth.forgot_password.email_label')"
        type="email"
        :placeholder="t('auth.forgot_password.email_placeholder')"
        autocomplete="email"
        :max-length="254"
        :error="errors.email"
      />
      <AppButton type="submit" :loading="isLoading" class="form__submit">
        {{ t('auth.forgot_password.submit') }}
      </AppButton>
    </form>
    <div class="form__links">
      <RouterLink to="/login">{{ t('auth.forgot_password.back_to_login') }}</RouterLink>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authApi } from '@/api/auth'
import { useForm } from '@/composables/useForm'

const { t } = useI18n()

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const { fields, errors, validate } = useForm(
  { email: '' },
  {
    email: [
      (v) => (v.trim().length > 0 ? true : t('auth.validation.email_required')),
      (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : t('auth.validation.email_invalid')),
    ],
  },
)

async function handleSubmit() {
  if (!validate()) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data } = await authApi.requestPasswordReset(fields.email)
    successMessage.value = data.message
  } catch {
    errorMessage.value = t('auth.forgot_password.error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1.25rem; text-align: center; }
.form { display: flex; flex-direction: column; gap: 1.125rem; }
.form__submit { width: 100%; justify-content: center; margin-top: 0.25rem; }
.form__links { margin-top: 1.25rem; font-size: 0.875rem; text-align: center; }
</style>
