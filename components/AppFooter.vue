<template>
  <footer class="app-footer">
    <div class="app-footer-inner">
      <div class="app-footer-brand">
        <NuxtLink to="/" class="app-footer-logo">Рипарий</NuxtLink>
        <p class="app-footer-tagline">Студия аквадизайна</p>
      </div>

      <nav class="app-footer-nav">
        <NuxtLink to="/">Главная</NuxtLink>
        <NuxtLink to="/services">Услуги</NuxtLink>
        <NuxtLink to="/catalog">Каталог</NuxtLink>
        <NuxtLink to="/calculator">Калькулятор</NuxtLink>
        <NuxtLink to="/#контакты">Контакты</NuxtLink>
      </nav>

      <div class="app-footer-legal">
        <NuxtLink to="/privacy">Политика конфиденциальности</NuxtLink>
        <NuxtLink to="/consent">Согласие на обработку ПД</NuxtLink>
      </div>

      <div class="app-footer-contacts">
        <p>Калининград</p>
        <p><a href="mailto:info@riparium.ru">info@riparium.ru</a></p>
        <p><a href="tel:+70000000000">+7 (XXX) XXX-XX-XX</a></p>
      </div>
    </div>

    <div class="app-footer-bottom">
      <p>© 2025 Рипарий. Студия аквадизайна.</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: #0e1a24;
  border-top: 1px solid var(--rule);
  padding: 48px 80px 24px;
}

.app-footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  align-items: start;
}

.app-footer-brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-footer-logo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--cream);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.app-footer-tagline {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--cream-dim);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.app-footer-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-footer-nav a {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}

.app-footer-nav a:hover {
  color: var(--cream);
}

.app-footer-legal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-footer-legal a {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}

.app-footer-legal a:hover {
  color: var(--cream);
}

.app-footer-contacts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-footer-contacts p,
.app-footer-contacts a {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}

.app-footer-contacts a:hover {
  color: var(--gold);
}

.app-footer-bottom {
  max-width: 1440px;
  margin: 40px auto 0;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  text-align: center;
}

.app-footer-bottom p {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--cream-faint);
  letter-spacing: 0.05em;
}

@media (max-width: 900px) {
  .app-footer {
    padding: 40px 48px 20px;
  }
  .app-footer-inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .app-footer {
    padding: 32px 24px 20px;
  }
  .app-footer-inner {
    grid-template-columns: 1fr;
    gap: 32px;
    text-align: center;
  }
  .app-footer-brand {
    align-items: center;
  }
  .app-footer-nav,
  .app-footer-legal,
  .app-footer-contacts {
    align-items: center;
  }
}
</style>
