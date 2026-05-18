<template>
  <transition name="cookie-fade">
    <div v-if="visible" class="cookie-banner" role="dialog" aria-live="polite" aria-label="Использование cookies">
      <div class="cookie-banner-inner">
        <div class="cookie-banner-text">
          <strong>Cookies и аналитика.</strong>
          Сайт использует технические cookies для работы корзины и формы заказа, а также
          Яндекс.Метрику для обезличенной аналитики посещений и улучшения сайта. Подробнее
          в <NuxtLink to="/privacy" class="cookie-link">Политике обработки персональных данных</NuxtLink>.
        </div>
        <div class="cookie-banner-buttons">
          <button type="button" class="cookie-btn cookie-btn--reject" @click="reject">Отклонить</button>
          <button type="button" class="cookie-btn cookie-btn--accept" @click="accept">Принять</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
const visible = ref(false)
const STORAGE_KEY = 'cookie-consent'

onMounted(() => {
  // Показываем баннер только если выбор ещё не сделан
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (val !== 'accepted' && val !== 'rejected') visible.value = true
  } catch {
    visible.value = true
  }
})

function accept () {
  try { localStorage.setItem(STORAGE_KEY, 'accepted') } catch {}
  visible.value = false
  // Сообщаем app.vue — он подгрузит Я.Метрику в текущей сессии без перезагрузки.
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'))
  }
}

function reject () {
  try { localStorage.setItem(STORAGE_KEY, 'rejected') } catch {}
  visible.value = false
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9000;
  background: rgba(14, 26, 36, 0.97);
  border-top: 1px solid rgba(217, 180, 106, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 18px 20px 20px;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.4);
}

.cookie-banner-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.cookie-banner-text {
  flex: 1 1 320px;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(241, 230, 200, 0.9);
}

.cookie-banner-text strong {
  color: #d9b46a;
  font-weight: 500;
}

.cookie-link {
  color: #d9b46a;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.cookie-link:hover { color: #f1e6c8; }

.cookie-banner-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.cookie-btn {
  padding: 10px 22px;
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.02em;
  border-radius: 999px;
  border: 1px solid rgba(217, 180, 106, 0.5);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
}

.cookie-btn--reject {
  background: transparent;
  color: #f1e6c8;
}
.cookie-btn--reject:hover {
  background: rgba(241, 230, 200, 0.08);
  border-color: #d9b46a;
}

.cookie-btn--accept {
  background: #d9b46a;
  color: #0e1a24;
  border-color: #d9b46a;
}
.cookie-btn--accept:hover {
  background: #e9c478;
  transform: translateY(-1px);
}

.cookie-fade-enter-active,
.cookie-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.cookie-fade-enter-from,
.cookie-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 600px) {
  .cookie-banner { padding: 14px 14px 16px; }
  .cookie-banner-inner { gap: 14px; }
  .cookie-banner-text { font-size: 13px; flex-basis: 100%; }
  .cookie-banner-buttons { width: 100%; }
  .cookie-btn { flex: 1; padding: 11px 16px; }
}
</style>
