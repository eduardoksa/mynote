<template>
  <AuthLayout>
    <h2 class="title">{{ t('auth.reset_password.title') }}</h2>
    <template v-if="!token">
      <AppAlert type="error" :message="t('auth.reset_password.invalid_link')" />
      <div class="form__links">
        <RouterLink to="/forgot-password">{{ t('auth.reset_password.request_new') }}</RouterLink>
      </div>
    </template>
    <template v-else-if="successMessage">
      <AppAlert type="success" :message="successMessage" />
      <div class="form__links">
        <RouterLink to="/login">{{ t('auth.reset_password.go_to_login') }}</RouterLink>
      </div>
    </template>
    <template v-else>
      <AppAlert v-if="errorMessage" type="error" :message="errorMessage" />
      <form class="form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="fields.password"
          :label="t('auth.reset_password.password_label')"
          type="password"
          :placeholder="t('auth.reset_password.password_placeholder')"
          autocomplete="new-password"
          :max-length="32"
          :error="errors.password"
        />
        <AppInput
          v-model="fields.password_confirmation"
          :label="t('auth.reset_password.confirm_label')"
          type="password"
          :placeholder="t('auth.reset_password.confirm_placeholder')"
          autocomplete="new-password"
          :max-length="32"
          :error="errors.password_confirmation"
        />
        <AppButton type="submit" :loading="isLoading" class="form__submit">
          {{ t('auth.reset_password.submit') }}
        </AppButton>
      </form>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authApi } from '@/api/auth'
import { useForm } from '@/composables/useForm'

const { t } = useI18n()
const route = useRoute()
const token = route.query.token as string | undefined

const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const passwordRef = ref('')

const { fields, errors, validate } = useForm(
  { password: '', password_confirmation: '' },
  {
    password: [
      (v) => (v.length >= 8 ? true : t('auth.validation.password_min_length')),
      (v) => (v.length <= 32 ? true : t('auth.validation.password_max_length')),
      (v) => (/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(v) ? true : t('auth.validation.password_complexity')),
    ],
    password_confirmation: [
      (v) => (v === passwordRef.value ? true : t('auth.validation.password_mismatch')),
    ],
  },
)

watch(() => fields.password, (val) => { passwordRef.value = val })

async function handleSubmit() {
  if (!validate() || !token) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data } = await authApi.confirmPasswordReset(
      token,
      fields.password,
      fields.password_confirmation,
    )
    successMessage.value = data.message
  } catch {
    errorMessage.value = t('auth.reset_password.error')
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
