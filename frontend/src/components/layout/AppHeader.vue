<template>
  <header class="header">
    <RouterLink to="/notes" class="header__logo">{{ t('app.brand') }}</RouterLink>
    <div v-if="auth.user" class="header__user">
      <span class="header__name">{{ auth.user.name }}</span>
      <AppButton variant="ghost" @click="auth.logout()">{{ t('app.logout') }}</AppButton>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 3.5rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header__logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: none;
}
.header__user {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header__name {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}
</style>
