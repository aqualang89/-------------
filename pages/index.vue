<template>
  <div>
    <!-- ИНТРО -->
    <div id="intro-overlay">
      <!-- CSS-ripples для мобилы (вместо WebGL) -->
      <div class="intro-ripples" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="intro-ripple" :style="rippleDelay(n)"></div>
      </div>
      <div class="intro-center" title="Кликните, чтобы войти"></div>
    </div>

    <!-- HERO -->
    <div class="sh-stage">
      <NuxtLink to="/" class="sh-hero-logo" aria-label="Главная">
        <img src="/img/logo-main.png" alt="Рипарий — студия аквадизайна" loading="eager" />
      </NuxtLink>
      <div class="sh-interior"></div>
      <div class="sh-lamp-glow" aria-hidden="true"></div>

      <!-- Пузыри -->
      <div class="sh-bubbles" aria-hidden="true">
        <div v-for="n in 6" :key="n" class="sh-bubble" :style="bubbleStyle(n)"></div>
      </div>

      <!-- Оглавление (привязано к правому краю экрана = к лампе) -->
      <aside class="sh-toc" aria-label="Содержание">
        <div class="sh-toc-title">Содержание</div>
        <ol class="sh-toc-list">
          <li><NuxtLink to="/services/nature" class="sh-toc-link">Nature Aquarium</NuxtLink><span class="sh-toc-num">01</span></li>
          <li><NuxtLink to="/services/iwagumi" class="sh-toc-link">Iwagumi</NuxtLink><span class="sh-toc-num">02</span></li>
          <li><NuxtLink to="/services/dutch" class="sh-toc-link">Голландский аквариум</NuxtLink><span class="sh-toc-num">03</span></li>
          <li><NuxtLink to="/services/biotope" class="sh-toc-link">Биотоп</NuxtLink><span class="sh-toc-num">04</span></li>
          <li><NuxtLink to="/services/paludarium" class="sh-toc-link">Палюдариум</NuxtLink><span class="sh-toc-num">05</span></li>
        </ol>
      </aside>

      <!-- Hero контент -->
      <section class="sh-hero">
        <h1 class="sh-hero-title" data-reveal-up>
          Подводные <em>пейзажи,</em><br />
          собранные вручную.
        </h1>

        <div class="sh-hero-bottom" data-reveal>
          <p class="sh-hero-lede">
            Дизайн, монтаж и обслуживание аквариумов с натуральной флорой. Каждая работа — отдельная экосистема, выстроенная под пространство и характер владельца.
          </p>
          <button class="sh-cta" type="button" @click="scrollToContacts">
            Заказать консультацию
          </button>
        </div>
      </section>
    </div>

    <!-- Разделитель -->
    <div class="sh-divider" data-reveal>
      <span class="sh-divider-line"></span>
      <span class="sh-divider-text">Здесь начинается ваше хобби</span>
      <span class="sh-divider-line"></span>
    </div>

    <!-- Карточки услуг -->
    <div class="sh-horizontal-section" ref="hSection">
      <div class="sh-horizontal-sticky" ref="hSticky">
        <div class="sh-horizontal-track" ref="hTrack">
        <div class="sh-hcard">
          <div class="sh-hcard-text">
            <span class="sh-hcard-num">01</span>
            <h2 class="sh-hcard-title">Nature Aquarium</h2>
            <p class="sh-hcard-desc">Живой ландшафт под водой: камни, коряги, мхи и растения создают естественный мир для обитателей.</p>
            <NuxtLink to="/services/nature" class="sh-hcard-link">Подробнее →</NuxtLink>
          </div>
          <div class="sh-hcard-img">
            <img src="/img/services/nature.jpg" alt="Nature Aquarium" loading="lazy" />
          </div>
        </div>
        <div class="sh-hcard">
          <div class="sh-hcard-text">
            <span class="sh-hcard-num">02</span>
            <h2 class="sh-hcard-title">Iwagumi</h2>
            <p class="sh-hcard-desc">Строгая геометрия камней и минимум растений. Японская школа, где каждый камень имеет своё имя и роль.</p>
            <NuxtLink to="/services/iwagumi" class="sh-hcard-link">Подробнее →</NuxtLink>
          </div>
          <div class="sh-hcard-img">
            <img src="/img/services/iwagumi.jpg" alt="Iwagumi" loading="lazy" />
          </div>
        </div>
        <div class="sh-hcard">
          <div class="sh-hcard-text">
            <span class="sh-hcard-num">03</span>
            <h2 class="sh-hcard-title">Голландский аквариум</h2>
            <p class="sh-hcard-desc">Сад под водой. Густые посадки растений разной высоты формируют живые аллеи и улицы.</p>
            <NuxtLink to="/services/dutch" class="sh-hcard-link">Подробнее →</NuxtLink>
          </div>
          <div class="sh-hcard-img">
            <img src="/img/services/dutch.jpg" alt="Голландский аквариум" loading="lazy" />
          </div>
        </div>
        <div class="sh-hcard">
          <div class="sh-hcard-text">
            <span class="sh-hcard-num">04</span>
            <h2 class="sh-hcard-title">Биотоп</h2>
            <p class="sh-hcard-desc">Точная копия реального уголка природы. Всё — от воды до грунта — как в оригинале.</p>
            <NuxtLink to="/services/biotope" class="sh-hcard-link">Подробнее →</NuxtLink>
          </div>
          <div class="sh-hcard-img">
            <img src="/img/services/biotope.jpg" alt="Биотоп" loading="lazy" />
          </div>
        </div>
        <div class="sh-hcard">
          <div class="sh-hcard-text">
            <span class="sh-hcard-num">05</span>
            <h2 class="sh-hcard-title">Палюдариум</h2>
            <p class="sh-hcard-desc">Аквариум и террариум в одном пространстве. Вода, камни, растения и наземная часть под стеклом.</p>
            <NuxtLink to="/services/paludarium" class="sh-hcard-link">Подробнее →</NuxtLink>
          </div>
          <div class="sh-hcard-img">
            <img src="/img/services/paludarium.jpg" alt="Палюдариум" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- КОНТАКТЫ -->
    <section id="контакты" class="sh-contacts">
      <div class="sh-contacts-inner">
        <div class="sh-contacts-info" data-reveal>
          <h2>Контакты</h2>
          <div class="sh-contacts-list">
            <div class="sh-contact-item">
              <span class="sh-contact-label">Адрес</span>
              <p class="sh-contact-value">г. Калининград, ул. Аксакова, 123<br>цокольный этаж, левый торец</p>
            </div>
            <div class="sh-contact-item">
              <span class="sh-contact-label">Телефон</span>
              <p class="sh-contact-value"><a href="tel:89527847031">8 (952) 784-70-31</a></p>
              <p class="sh-contact-value"><a href="tel:89814623733">8 (981) 462-37-33</a></p>
            </div>
            <div class="sh-contact-item">
              <span class="sh-contact-label">Email</span>
              <p class="sh-contact-value"><a href="mailto:kotdavinchi39@mail.ru">kotdavinchi39@mail.ru</a></p>
            </div>
            <div class="sh-contact-item">
              <span class="sh-contact-label">Соцсети</span>
              <div class="contact-socials">
                <a href="https://vk.com/scapershouse" target="_blank" rel="noopener" class="social-btn vk">VK</a>
                <a href="https://goo.su/dQSq9m" target="_blank" rel="noopener" class="social-btn ig">Instagram</a>
                <a href="https://t.me/riparium_kld" target="_blank" rel="noopener" class="social-btn tg">Telegram</a>
                <a href="https://goo.su/ayQXzz" target="_blank" rel="noopener" class="social-btn map">🧭 Карта</a>
              </div>
            </div>
            <div class="sh-contact-item">
              <span class="sh-contact-label">Часы работы</span>
              <p class="sh-contact-value">ежедневно 11:00–19:00</p>
            </div>
          </div>
        </div>

        <form class="sh-contact-form" @submit.prevent="submitForm" data-reveal-right>
          <h3>Обратная связь</h3>
          <div class="sh-form-row">
            <input v-model="form.name" type="text" placeholder="Имя" required />
            <input v-model="form.phone" type="tel" placeholder="Телефон" required />
          </div>
          <input v-model="form.email" type="email" placeholder="Email" required />
          <textarea v-model="form.message" rows="4" placeholder="Сообщение" required></textarea>

          <label class="sh-form-consent">
            <input v-model="form.consent" type="checkbox" required />
            <span>Я согласен на <NuxtLink to="/consent">обработку персональных данных</NuxtLink> и принимаю <NuxtLink to="/privacy">политику конфиденциальности</NuxtLink></span>
          </label>

          <button type="submit" class="sh-cta sh-cta-submit">Отправить</button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeRouteLeave } from 'vue-router'
useScrollReveal()

// Template refs for horizontal scroll
const hSection = ref(null)
const hSticky = ref(null)
const hTrack = ref(null)

// Horizontal scroll state
let hScrollRaf = null
let hScrollHandler = null
let hResizeHandler = null

function initHorizontalScroll() {
  const section = hSection.value
  const track = hTrack.value
  if (!section || !track) return
  let maxTranslate = track.scrollWidth - window.innerWidth
  function updateLayout() {
    maxTranslate = track.scrollWidth - window.innerWidth
    section.style.height = `${maxTranslate + window.innerHeight}px`
    applyScroll()
  }
  function applyScroll() {
    if (!document.body.contains(section)) return
    const rect = section.getBoundingClientRect()
    const scrolled = Math.max(0, -rect.top)
    if (maxTranslate <= 0) return
    const progress = Math.min(1, scrolled / maxTranslate)
    track.style.transform = `translateX(${-progress * maxTranslate}px)`
  }
  function onScroll() {
    if (hScrollRaf) cancelAnimationFrame(hScrollRaf)
    hScrollRaf = requestAnimationFrame(applyScroll)
  }
  hScrollHandler = onScroll
  hResizeHandler = updateLayout
  window.addEventListener('scroll', hScrollHandler, { passive: true })
  window.addEventListener('resize', hResizeHandler)
  updateLayout()
}

function cleanupHorizontalScroll() {
  if (hScrollRaf) cancelAnimationFrame(hScrollRaf)
  if (hScrollHandler) window.removeEventListener('scroll', hScrollHandler, { passive: true })
  if (hResizeHandler) window.removeEventListener('resize', hResizeHandler)
  hScrollRaf = null
  hScrollHandler = null
  hResizeHandler = null
}

onMounted(() => { initHorizontalScroll() })
onUnmounted(() => { cleanupHorizontalScroll() })
onActivated(() => { initHorizontalScroll() })
onDeactivated(() => { cleanupHorizontalScroll() })

// Флаг: пользователь уходил с главной через SPA-навигацию
onBeforeRouteLeave(() => {
  try { sessionStorage.setItem('leftHome', '1') } catch (e) {}
})

const form = reactive({
  name: '',
  phone: '',
  email: '',
  message: '',
  consent: false
})

async function submitForm() {
  if (!form.consent) {
    alert('Необходимо согласие на обработку персональных данных')
    return
  }
  try {
    const res = await $fetch('/api/contact', {
      method: 'POST',
      body: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        message: form.message
      }
    })
    if (res.ok) {
      alert('Спасибо! Заявка отправлена.')
      form.name = ''
      form.phone = ''
      form.email = ''
      form.message = ''
      form.consent = false
    }
  } catch (err) {
    alert('Ошибка отправки. Попробуйте позже.')
    console.error(err)
  }
}



function scrollToContacts() {
  const el = document.getElementById('контакты')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function rippleDelay(n) {
  const positions = [
    { left: '20%', top: '30%' },
    { left: '60%', top: '20%' },
    { left: '40%', top: '50%' },
    { left: '75%', top: '40%' },
    { left: '30%', top: '65%' },
    { left: '55%', top: '75%' }
  ]
  const pos = positions[(n - 1) % positions.length]
  const delay = (n - 1) * 0.7
  const size = 50 + (n % 3) * 25
  return {
    left: pos.left,
    top: pos.top,
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's'
  }
}

function bubbleStyle(n) {
  const left = 35 + (n - 1) * 6 + Math.random() * 4
  const delay = n * 1.5
  const duration = 8 + Math.random() * 4
  const size = 3 + Math.random() * 3
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

onMounted(async () => {
  let rippleInterval = null
  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return }
      const s = document.createElement('script')
      s.src = src
      s.onload = res
      s.onerror = rej
      document.head.appendChild(s)
    })
  }

  const overlay = document.getElementById('intro-overlay')
  if (!overlay) return

  // === ЛОГИКА ИНТРО ===
  // Показываем интро только если:
  //   1. Первый визит в сессии, ИЛИ
  //   2. Пользователь сделал reload (F5)
  // Не показываем если:
  //   1. Пользователь уходил с главной и вернулся (SPA back nav)
  //   2. Явный back_forward

  // 1. Проверяем SPA back navigation (самый надёжный способ)
  let leftHome = false
  try {
    leftHome = !!sessionStorage.getItem('leftHome')
    if (leftHome) sessionStorage.removeItem('leftHome')
  } catch (e) {}

  if (leftHome) {
    overlay.remove()
    document.body.style.overflow = ''
    console.log('intro debug: SPA back nav — skipped')
    return
  }

  // 2. Проверяем reload
  let isReload = false
  try {
    const entries = performance.getEntriesByType('navigation')
    if (entries.length) isReload = entries[0].type === 'reload'
  } catch (e) {}
  if (!isReload) {
    try { isReload = performance.navigation.type === 1 } catch (e) {}
  }

  // 3. Проверяем явный back_forward
  let isBackForward = false
  try {
    const entries = performance.getEntriesByType('navigation')
    if (entries.length) isBackForward = entries[0].type === 'back_forward'
  } catch (e) {}
  if (!isBackForward) {
    try { isBackForward = performance.navigation.type === 2 } catch (e) {}
  }

  console.log('intro debug:', { isReload, isBackForward, referrer: document.referrer })

  if (isBackForward) {
    overlay.remove()
    document.body.style.overflow = ''
    return
  }

  // 4. Если уже видели в этой сессии и не reload — не показываем
  if (!isReload) {
    let hasSeen = false
    try { hasSeen = !!sessionStorage.getItem('introSeen') } catch (e) {}
    if (hasSeen) {
      overlay.remove()
      document.body.style.overflow = ''
      return
    }
  }

  const hash = window.location.hash.slice(1)
  if (hash) {
    overlay.remove()
    document.body.style.overflow = ''
    setTimeout(() => {
      const target = document.getElementById(hash)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
    return
  }

  overlay.classList.add('intro-active')
  try {
    sessionStorage.setItem('introSeen', '1')
  } catch (e) {}
  document.body.style.overflow = 'hidden'

  try {
    await loadScript('/js/jquery.min.js')
    await loadScript('/js/jquery.ripples.min.js')
  } catch (err) {
    console.error('Failed to load ripples scripts:', err)
  }

  function closeIntro(scrollTo) {
    overlay.classList.add('hidden')
    document.body.style.overflow = ''
    try { $(overlay).ripples('destroy') } catch (e) {}
    setTimeout(() => {
      overlay.remove()
      if (scrollTo) {
        const target = document.getElementById(scrollTo)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 700)
  }

  let introClickHandler = null
  const introCenter = document.querySelector('.intro-center')
  if (introCenter) {
    introClickHandler = (e) => {
      e.stopPropagation()
      closeIntro()
    }
    introCenter.addEventListener('click', introClickHandler)
  }

  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
  if (!isMobile && typeof $ !== 'undefined' && $.fn.ripples) {
    try {
      const origRAF = window.requestAnimationFrame
      $(overlay).ripples({ resolution: 512, dropRadius: 20, perturbance: 0.04, interactive: true })
      window.requestAnimationFrame = () => {}
      setTimeout(() => { window.requestAnimationFrame = origRAF }, 100)
      const ripples = $(overlay).data('ripples')
      if (ripples) {
        const origStep = ripples.step.bind(ripples)
        rippleInterval = setInterval(() => {
          if (ripples.visible && ripples.running) origStep()
        }, 1000 / 60)
      }
    } catch (err) {
      console.error('Ripples init failed:', err)
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (introClickHandler && introCenter) introCenter.removeEventListener('click', introClickHandler)
    if (rippleInterval) clearInterval(rippleInterval)
  })
})
</script>

<style scoped>
.sh-stage {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #1e2933;
}
.sh-hero-logo {
  position: absolute;
  top: 22px;
  left: 48px;
  z-index: 10;
  line-height: 0;
  display: block;
}
.sh-hero-logo img {
  height: 156px;
  width: auto;
  display: block;
}

.sh-interior {
  position: absolute;
  top: 12vh;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('/hero-interior.jpg');
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 1;
}

.sh-stage::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 35vh;
  background: linear-gradient(to bottom, #1e2933 0%, rgba(30, 41, 51, 0.6) 50%, transparent 100%);
  z-index: 2;
  pointer-events: none;
}
.sh-stage::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 18vh;
  background: linear-gradient(to bottom, transparent 0%, rgba(46, 35, 29, 0.2) 55%, #1e2933 100%);
  z-index: 2;
  pointer-events: none;
}

/* Пузыри */
.sh-bubbles {
  position: absolute;
  bottom: 15%;
  left: 0;
  right: 0;
  height: 40%;
  pointer-events: none;
  z-index: 2;
}

.sh-bubble {
  position: absolute;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: sh-rise linear infinite;
}

@keyframes sh-rise {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  10% { opacity: 0.4; }
  100% { transform: translateY(-350px) scale(0.4); opacity: 0; }
}

/* Hero контент */
.sh-hero {
  position: relative;
  z-index: 3;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 80px;
  min-height: 100vh;
}

.sh-hero-title {
  font-family: var(--font-serif);
  font-weight: 400;
  font-size: clamp(40px, 4.2vw, 76px);
  line-height: 1.08;
  letter-spacing: -0.01em;
  color: var(--cream);
  text-align: center;
  margin: 0;
  padding-top: 40px;
}
@media (max-width: 768px) {
  .sh-hero-title {
    padding-top: 110px;
  }
}

.sh-hero-title em {
  font-style: italic;
  font-weight: 400;
  color: var(--gold-soft);
}

.sh-hero-bottom {
  position: absolute;
  bottom: 48vh;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  width: 100%;
  max-width: 540px;
}

.sh-hero-lede {
  max-width: 460px;
  margin: 0 auto 20px;
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 15px;
  line-height: 1.6;
  color: var(--cream-dim);
  text-align: center;
}

.sh-cta {
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
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}

.sh-cta:hover {
  background: var(--cream);
  color: var(--ink-deep);
}

/* Оглавление */
.sh-toc {
  position: absolute;
  top: 80px;
  right: 60px;
  width: 200px;
  z-index: 10;
}

.sh-toc-title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--cream-faint);
  margin-bottom: 20px;
  text-align: right;
}

.sh-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sh-toc-list li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 0;
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--cream-dim);
  transition: color 0.3s ease;
  cursor: pointer;
}

.sh-toc-list li:hover { color: var(--cream); }

.sh-toc-num {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--gold);
  font-weight: 500;
}

/* Контакты */
.sh-contacts {
  background: #1e2933;
  color: var(--cream);
  padding: 40px 48px 80px;
}

.sh-contacts-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: start;
}

.sh-contacts-info h2 {
  font-family: var(--font-serif);
  font-size: 36px;
  margin-bottom: 32px;
  color: var(--cream);
}

.sh-contacts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sh-contact-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sh-contact-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-faint);
}

.sh-contact-value {
  font-family: var(--font-sans);
  font-weight: 300;
  font-size: 16px;
  color: var(--cream-dim);
  margin: 0;
}

.sh-contact-value a {
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}

.sh-contact-value a:hover {
  color: var(--gold);
}

.sh-contact-value em {
  color: var(--cream-faint);
  font-style: italic;
}

.contact-socials {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.contact-socials .social-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--rule);
  border-radius: 6px;
  color: var(--cream-dim);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}
.contact-socials .social-btn:hover {
  border-color: var(--gold);
  color: var(--gold);
  background: rgba(217, 180, 106, 0.08);
}

.sh-contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(14, 26, 36, 0.5);
  border: 1px solid var(--rule);
  border-radius: 12px;
  padding: 32px;
}

.sh-contact-form h3 {
  font-family: var(--font-serif);
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--cream);
}

.sh-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.sh-contact-form input,
.sh-contact-form textarea {
  background: #0e1a24;
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 10px 14px;
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--cream);
  outline: none;
  transition: border-color 0.3s ease;
  width: 100%;
}

.sh-contact-form input::placeholder,
.sh-contact-form textarea::placeholder {
  color: var(--cream-faint);
}

.sh-contact-form input:focus,
.sh-contact-form textarea:focus {
  border-color: var(--gold);
}

.sh-contact-form textarea {
  resize: vertical;
  min-height: 100px;
}

.sh-form-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--cream-dim);
  line-height: 1.5;
  cursor: pointer;
}

.sh-form-consent input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--gold);
  flex-shrink: 0;
}

.sh-form-consent a {
  color: var(--gold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sh-cta-submit {
  align-self: flex-start;
}

@media (max-width: 900px) {
  .sh-contacts {
    padding: 60px 24px;
  }
  .sh-contacts-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .sh-form-row {
    grid-template-columns: 1fr;
  }
  .sh-cta-submit {
    align-self: stretch;
  }
}

/* Разделитель */
.sh-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 48px;
  background: #1e2933;
}
.sh-divider-line {
  flex: 1;
  max-width: 120px;
  height: 1px;
  background: var(--rule);
}
.sh-divider-text {
  font-family: var(--font-serif);
  font-size: clamp(42px, 5vw, 64px);
  font-style: italic;
  color: var(--cream-dim);
  white-space: nowrap;
  letter-spacing: 0.05em;
}

/* Горизонтальная секция */
.sh-horizontal-section {
  position: relative;
  background: #1e2933;
}
.sh-horizontal-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.sh-horizontal-track {
  display: flex;
  gap: 8vw;
  padding: 0 5vw;
  will-change: transform;
}
.sh-hcard {
  flex-shrink: 0;
  width: 85vw;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: center;
}
@media (min-width: 769px) {
  .sh-hcard-img {
    order: -1;
  }
}
.sh-hcard-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.sh-hcard-num {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.2em;
}
.sh-hcard-title {
  font-family: var(--font-serif);
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 400;
  color: var(--cream);
  line-height: 1.1;
  margin: 0;
}
.sh-hcard-desc {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 300;
  line-height: 1.7;
  color: var(--cream-dim);
  max-width: 400px;
  margin: 0;
}
.sh-hcard-link {
  display: inline-block;
  margin-top: 8px;
  font-family: var(--font-serif);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gold);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-hcard-link:hover {
  color: var(--cream);
}
.sh-hcard-img {
  display: flex;
  justify-content: center;
  align-items: center;
}
.sh-hcard-img {
  overflow: hidden;
  border-radius: 4px;
}
.sh-hcard-img img {
  width: 100%;
  max-width: 480px;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 4px;
  display: block;
  transition: transform 0.5s ease;
}
.sh-hcard:hover .sh-hcard-img img {
  transform: scale(1.7);
}

/* CSS-ripples на интро (мобила) */
.intro-ripples {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.intro-ripple {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(241, 230, 200, 0.12);
  animation: intro-ripple-expand 2.8s ease-out infinite;
  transform: translate(-50%, -50%) scale(0);
}
@keyframes intro-ripple-expand {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.5;
  }
  100% {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}
@media (min-width: 769px) {
  .intro-ripples {
    display: none;
  }
}

/* TOC ссылки */
.sh-toc-link {
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-toc-link:hover {
  color: var(--cream);
}

/* Свечение лампы */
.sh-lamp-glow {
  position: absolute;
  top: 5%;
  right: 10%;
  width: 45vw;
  height: 45vw;
  max-width: 600px;
  max-height: 600px;
  background: radial-gradient(circle, rgba(217, 180, 106, 0.14) 0%, transparent 60%);
  animation: lamp-pulse 5s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 2;
}
@keyframes lamp-pulse {
  0% { opacity: 0.25; transform: scale(0.9); }
  100% { opacity: 0.6; transform: scale(1.15); }
}

/* Адаптив */
@media (max-width: 1100px) {
  .sh-hero {
    padding: 0 48px;
  }
  .sh-hero-title {
    padding-top: 80px;
  }
  .sh-toc {
    position: static;
    width: 100%;
    max-width: 480px;
    margin: 48px auto 0;
  }
  .sh-toc-title, .sh-toc-list li { text-align: left; }
  .sh-hero-bottom {
    position: static;
    transform: none;
    left: auto;
    margin-top: 32px;
  }
}

@media (max-width: 768px) {
  .sh-stage {
    display: flex;
    flex-direction: column;
    min-height: auto;
  }
  .sh-stage::before,
  .sh-stage::after {
    display: none;
  }
  .sh-hero-logo {
    position: absolute;
    top: 16px;
    left: 20px;
  }
  .sh-hero-logo img {
    height: 80px;
  }
  .sh-hero {
    display: contents;
  }
  .sh-hero-title {
    font-size: 36px;
    padding: 90px 20px 0;
    line-height: 1.15;
    order: 1;
  }
  .sh-hero-bottom {
    position: static;
    transform: none;
    left: auto;
    margin-top: 24px;
    max-width: 100%;
    padding: 0 20px;
    order: 2;
  }
  .sh-interior {
    position: relative;
    order: 3;
    top: auto;
    bottom: auto;
    left: auto;
    right: auto;
    height: 40vh;
    min-height: 260px;
    opacity: 1;
    margin: 24px 0 0;
  }
  /* Градиенты сверху и снизу аквариума (от края до края экрана) */
  .sh-interior::before,
  .sh-interior::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 60px;
    pointer-events: none;
    z-index: 1;
  }
  .sh-interior::before {
    top: 0;
    background: linear-gradient(to bottom, #1e2933 0%, transparent 100%);
  }
  .sh-interior::after {
    bottom: 0;
    background: linear-gradient(to top, #1e2933 0%, transparent 100%);
  }
  .sh-hero-lede {
    font-size: 14px;
    max-width: 100%;
  }
  .sh-lamp-glow {
    display: none;
  }
  .sh-bubbles {
    display: none;
  }
  .sh-toc {
    position: static;
    width: 100%;
    max-width: 100%;
    margin: 32px 0 0;
    right: auto;
    padding: 0 20px;
    order: 4;
  }
  .sh-hcard {
    width: 85vw;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .sh-hcard-img img {
    max-width: 100%;
  }
  .sh-divider {
    padding: 48px 20px;
    gap: 12px;
  }
  .sh-divider-text {
    font-size: 24px;
    white-space: normal;
    text-align: center;
  }
  .sh-contacts {
    padding: 40px 20px 60px;
  }
  .sh-contacts-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .sh-contact-form {
    padding: 24px;
  }
  .sh-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
