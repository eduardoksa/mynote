<template>
  <AuthLayout>
    <AppAlert v-if="auth.error" type="error" :message="auth.error" />
    <form class="form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="fields.email"
        :label="t('auth.login.email_label')"
        type="email"
        :placeholder="t('auth.login.email_placeholder')"
        autocomplete="email"
        :max-length="254"
        :error="errors.email"
      />
      <AppInput
        v-model="fields.password"
        :label="t('auth.login.password_label')"
        type="password"
        :placeholder="t('auth.login.password_placeholder')"
        autocomplete="current-password"
        :max-length="32"
        :error="errors.password"
      />
      <AppButton type="submit" :loading="auth.isLoading" class="form__submit">
        {{ t('auth.login.submit') }}
      </AppButton>
    </form>
    <div class="form__links">
      <RouterLink to="/forgot-password">{{ t('auth.login.forgot_password') }}</RouterLink>
      <RouterLink to="/register">{{ t('auth.login.create_account') }}</RouterLink>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'

const { t } = useI18n()
const auth = useAuthStore()

const { fields, errors, validate } = useForm(
  { email: '', password: '' },
  {
    email: [
      (v) => (v.trim().length > 0 ? true : t('auth.validation.email_required')),
      (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : t('auth.validation.email_invalid')),
    ],
    password: [(v) => (v.length > 0 ? true : t('auth.validation.password_required'))],
  },
)

async function handleSubmit() {
  if (!validate()) return
  auth.error = null
  await auth.login({ user: { email: fields.email, password: fields.password } })
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 1.125rem; }
.form__submit { width: 100%; justify-content: center; margin-top: 0.25rem; }
.form__links {
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
  font-size: 0.875rem;
}
</style>
