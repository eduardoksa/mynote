<template>
  <div v-if="visible" :class="['alert', `alert--${type}`]" role="alert">
    {{ message }}
    <button class="alert__close" type="button" @click="visible = false" :aria-label="t('common.close')">×</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  type: 'success' | 'error'
  message: string
}>()

const visible = ref(true)
let timer: ReturnType<typeof setTimeout>

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    visible.value = false
  }, 5000)
}

watch(() => props.message, () => {
  visible.value = true
  schedule()
}, { immediate: true })

onUnmounted(() => clearTimeout(timer))
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-size: 0.9375rem;
  line-height: 1.5;
}
.alert--error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}
.alert--success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.alert__close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  color: inherit;
  opacity: 0.6;
  flex-shrink: 0;
  padding: 0;
}
.alert__close:hover { opacity: 1; }
</style>
