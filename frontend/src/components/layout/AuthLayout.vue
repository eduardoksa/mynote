<template>
  <div class="auth-layout">
    <div class="auth-card">
      <h1 class="auth-logo">MyNote</h1>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 1rem;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2rem;
  background: var(--color-surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.auth-logo {
  text-align: center;
  color: var(--color-primary);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 1.75rem;
}
</style>
