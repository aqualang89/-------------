<template>
  <div class="sh-error">
    <div class="sh-error-inner">
      <span class="sh-error-num">404</span>
      <h1 class="sh-error-title">Страница не найдена</h1>
      <p class="sh-error-lead">
        Запрашиваемая страница не существует или была перемещена.
      </p>
      <NuxtLink to="/" class="sh-error-btn" @click.native="clearIntro">
        Вернуться на главную
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
useHead({ title: 'Страница не найдена — Рипарий' })

function clearIntro() {
  if (process.client) {
    sessionStorage.removeItem('introShown')
  }
}
</script>

<style>
.sh-error {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1e2933;
  color: var(--cream);
  text-align: center;
  padding: 48px;
}
.sh-error-inner {
  max-width: 480px;
}
.sh-error-num {
  font-family: var(--font-mono);
  font-size: 72px;
  font-weight: 500;
  color: var(--gold);
  line-height: 1;
  display: block;
  margin-bottom: 16px;
}
.sh-error-title {
  font-family: var(--font-serif);
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 400;
  margin: 0 0 16px;
}
.sh-error-lead {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  color: var(--cream-dim);
  line-height: 1.6;
  margin: 0 0 32px;
}
.sh-error-btn {
  display: inline-block;
  padding: 16px 40px;
  background: transparent;
  border: 1px solid var(--cream);
  border-radius: 999px;
  color: var(--cream);
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}
.sh-error-btn:hover {
  background: var(--cream);
  color: var(--ink-deep);
}
</style>
