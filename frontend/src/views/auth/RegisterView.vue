<template>
  <AuthLayout>
    <AppAlert v-if="auth.error" type="error" :message="auth.error" />
    <form class="form" @submit.prevent="handleSubmit">
      <AppInput
        v-model="fields.name"
        :label="t('auth.register.name_label')"
        :placeholder="t('auth.register.name_placeholder')"
        autocomplete="name"
        :max-length="100"
        :error="errors.name"
      />
      <AppInput
        v-model="fields.email"
        :label="t('auth.register.email_label')"
        type="email"
        :placeholder="t('auth.register.email_placeholder')"
        autocomplete="email"
        :max-length="254"
        :error="errors.email"
      />
      <AppInput
        v-model="fields.password"
        :label="t('auth.register.password_label')"
        type="password"
        :placeholder="t('auth.register.password_placeholder')"
        autocomplete="new-password"
        :max-length="32"
        :error="errors.password"
      />
      <AppInput
        v-model="fields.password_confirmation"
        :label="t('auth.register.confirm_label')"
        type="password"
        :placeholder="t('auth.register.confirm_placeholder')"
        autocomplete="new-password"
        :max-length="32"
        :error="errors.password_confirmation"
      />
      <AppButton type="submit" :loading="auth.isLoading" class="form__submit">
        {{ t('auth.register.submit') }}
      </AppButton>
    </form>
    <div class="form__links">
      <RouterLink to="/login">{{ t('auth.register.login_link') }}</RouterLink>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'

const { t } = useI18n()
const auth = useAuthStore()

const passwordRef = ref('')

const { fields, errors, validate } = useForm(
  { name: '', email: '', password: '', password_confirmation: '' },
  {
    name: [
      (v) => (v.trim().length > 0 ? true : t('auth.validation.name_required')),
      (v) => (v.trim().length >= 3 ? true : t('auth.validation.name_too_short')),
      (v) => (v.length <= 100 ? true : t('auth.validation.name_too_long')),
    ],
    email: [
      (v) => (v.trim().length > 0 ? true : t('auth.validation.email_required')),
      (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : t('auth.validation.email_invalid')),
    ],
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
  if (!validate()) return
  auth.error = null
  await auth.register({
    user: {
      name: fields.name,
      email: fields.email,
      password: fields.password,
      password_confirmation: fields.password_confirmation,
    },
  })
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; gap: 1.125rem; }
.form__submit { width: 100%; justify-content: center; margin-top: 0.25rem; }
.form__links { margin-top: 1.25rem; text-align: center; font-size: 0.875rem; }
</style>
