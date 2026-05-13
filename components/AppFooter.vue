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
        <p>г. Калининград, ул. Аксакова, 123</p>
        <p>цокольный этаж, левый торец</p>
        <p>ежедневно 11:00–19:00</p>
        <p><a href="tel:+79913825695">+7 (991) 382-56-95</a></p>
        <p><a href="mailto:kotdavinchi39@mail.ru">kotdavinchi39@mail.ru</a></p>
        <div class="footer-socials">
          <a href="https://vk.com/riparium_kld" target="_blank" rel="noopener" class="social-btn vk" title="ВКонтакте">VK</a>
          <a href="https://goo.su/dQSq9m" target="_blank" rel="noopener" class="social-btn ig" title="Instagram">IG</a>
          <a href="https://t.me/riparium_kld" target="_blank" rel="noopener" class="social-btn tg" title="Telegram">TG</a>
          <a href="https://goo.su/ayQXzz" target="_blank" rel="noopener" class="social-btn map" title="Как добраться">🧭</a>
        </div>
      </div>
    </div>

    <div class="app-footer-bottom">
      <p>© 2016 Рипарий. Студия аквадизайна.</p>
      <a href="https://aqualang.pro" target="_blank" rel="noopener" class="app-footer-poweredby">
        <span>Powered by</span>
        <span class="app-footer-poweredby-brand">Aqualang.pro</span>
      </a>
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
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 400;
  color: var(--cream);
  text-decoration: none;
  letter-spacing: 0.05em;
}

.app-footer-tagline {
  font-family: var(--font-sans);
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
  font-family: var(--font-sans);
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
  font-family: var(--font-sans);
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
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}

.app-footer-contacts a:hover {
  color: var(--gold);
}

.footer-socials {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.social-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--cream-dim);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}
.social-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(217, 180, 106, 0.08);
}

.app-footer-bottom {
  max-width: 1440px;
  margin: 40px auto 0;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.app-footer-bottom p {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--cream-faint);
  letter-spacing: 0.05em;
  margin: 0;
}

.app-footer-poweredby {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-decoration: none;
  color: var(--cream-faint);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: color 0.3s ease;
}
.app-footer-poweredby:hover {
  color: var(--gold);
}
.app-footer-poweredby-brand {
  font-family: var(--font-serif);
  font-size: 13px;
  font-style: italic;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  color: var(--cream-dim);
  transition: color 0.3s ease;
}
.app-footer-poweredby:hover .app-footer-poweredby-brand {
  color: var(--gold);
}

@media (max-width: 600px) {
  .app-footer-bottom {
    flex-direction: column;
    text-align: center;
  }
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
