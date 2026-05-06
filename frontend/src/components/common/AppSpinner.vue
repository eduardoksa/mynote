<template>
  <span class="spinner" :class="`spinner--${size}`" aria-label="Carregando..." role="status" />
</template>

<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<style scoped>
.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  animation: spin 0.7s linear infinite;
}
.spinner--sm { width: 1rem; height: 1rem; }
.spinner--md { width: 1.5rem; height: 1.5rem; }
.spinner--lg { width: 2.5rem; height: 2.5rem; border-width: 3px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
