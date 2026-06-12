<template>
  <div class="layout-root">
    <nav class="sh-nav" :class="{ 'sh-nav--compact': compact, 'sh-nav--menu-open': menuOpen }">
      <div class="sh-nav-inner">
        <NuxtLink v-if="$route.path !== '/'" :to="backTo" class="sh-back" @click="clearIntro">← Назад</NuxtLink>

        <NuxtLink to="/" class="sh-nav-logo" aria-label="Рипарий — на главную" @click="clearIntro">
          <img src="/img/logo-main.png" alt="Рипарий — студия аквадизайна" />
        </NuxtLink>

        <div class="sh-nav-links">
          <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="sh-nav-link">{{ link.label }}</NuxtLink>
          <!-- <a href="#" class="sh-nav-link sh-nav-quiz" @click.prevent="openQuiz">Викторина</a> -->
        </div>

        <div class="sh-nav-actions">
          <CartIcon class="sh-nav-cart-icon" />
          <button class="sh-nav-burger" :class="{ open: menuOpen }" aria-label="Меню" @click="menuOpen = !menuOpen">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <div class="sh-mobile-menu" :class="{ open: menuOpen }">
      <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="sh-mobile-link" @click="menuOpen = false">{{ link.label }}</NuxtLink>
      <NuxtLink to="/cart" class="sh-mobile-link sh-mobile-link-cart" @click="menuOpen = false">
        <span>Корзина</span>
        <span v-if="cartCount > 0" class="sh-mobile-cart-badge">{{ cartCount }}</span>
      </NuxtLink>
      <!-- <a href="#" class="sh-mobile-link sh-mobile-quiz" @click.prevent="openQuiz">Викторина</a> -->
    </div>

    <div class="layout-content">
      <slot />
    </div>
    <AppFooter />
    <CookieBanner />
  </div>
</template>

<script setup>
import { watch } from 'vue'

const menuOpen = ref(false)
const compact = ref(false)
const route = useRoute()
const { totalCount: cartCount } = useCart()

const backTo = computed(() => {
  if (route.path.startsWith('/catalog/') && route.path !== '/catalog') return '/catalog'
  return '/'
})

function clearIntro () {
  try { sessionStorage.removeItem('introShown') } catch (e) {}
}

const regularLinks = [
  { to: '/', label: 'Главная' },
  { to: '/services', label: 'Услуги' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/works', label: 'Работы' },
  { to: '/blog', label: 'Блог' },
  { to: '/calculator', label: 'Калькулятор' },
  { to: '/about', label: 'О нас' },
]

/* Close menu on route change */
watch(() => route.path, () => {
  menuOpen.value = false
})

/* Пока открыто мобильное меню — фиксируем страницу под ним.
   overflow:hidden на body iOS Safari игнорит для touch — поэтому position:fixed
   с сохранением и возвратом позиции скролла (надёжно во всех браузерах). */
let lockedScrollY = 0
function lockScroll () {
  lockedScrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${lockedScrollY}px`
  document.body.style.width = '100%'
}
function unlockScroll () {
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  window.scrollTo(0, lockedScrollY)
}
watch(menuOpen, (open) => {
  if (!import.meta.client) return
  if (open) lockScroll()
  else unlockScroll()
})

/* Scroll-based compact nav (desktop only) */
let scrollTick = false
function onScroll () {
  if (window.innerWidth < 768) {
    compact.value = false
    return
  }
  if (!scrollTick) {
    requestAnimationFrame(() => {
      compact.value = window.scrollY > 80
      scrollTick = false
    })
    scrollTick = true
  }
}

/* Resize handler with debounce */
let resizeTimer = null
function onResize () {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (window.innerWidth < 768) {
      compact.value = false
    } else {
      compact.value = window.scrollY > 80
    }
  }, 100)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  clearTimeout(resizeTimer)
  if (import.meta.client && menuOpen.value) unlockScroll()
})

/* function openQuiz() {
  menuOpen.value = false
  if (typeof restartQuiz === 'function' && typeof toggleQuiz === 'function') {
    restartQuiz()
    toggleQuiz(true)
  }
} */

// Версия в URL форсит браузер перечитать chat.js когда мы его меняем.
// Увеличивай число при каждом значимом изменении public/js/chat.js
useHead({
  script: [
    { src: '/js/chat.js?v=20260603-fish', tagPosition: 'bodyClose' }
    /* { src: '/js/quiz.js', tagPosition: 'bodyClose' } */
  ]
})
</script>

<style>
/* ─── NAV: always fixed, transparent at top ─── */
.sh-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1002;
  padding: 22px 48px;
  pointer-events: none;
  background: transparent;
  backdrop-filter: none;
  transition: background 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              backdrop-filter 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              padding 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.sh-nav--compact {
  background: rgba(14, 26, 36, 0.92);
  backdrop-filter: blur(10px);
  padding: 14px 48px;
}
/* Открыто мобильное меню — шапка непрозрачная, чтобы hero не просвечивал сквозь неё */
.sh-nav--menu-open {
  background: rgba(14, 26, 36, 0.98);
  backdrop-filter: blur(12px);
}
.sh-nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 28px;
  /* Сам бар прозрачен для мыши — кликабельны только его дети (лого/меню/действия).
     Иначе пустое пространство бара перехватывает курсор у того, что под хедером
     (например кнопка «Назад» впритык снизу — ловила hover только нижней кромкой). */
  pointer-events: none;
}
.sh-nav-logo,
.sh-nav-links,
.sh-nav-actions,
.sh-back {
  pointer-events: auto;
}

/* Лого слева — небольшое, кликабельно на главную, на всех страницах */
.sh-nav-logo {
  flex-shrink: 0;
  line-height: 0;
  display: block;
}
.sh-nav-logo img {
  height: 44px;
  width: auto;
  display: block;
}

/* Правая группа: корзина + бургер */
.sh-nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.sh-nav-cart-icon {
  flex-shrink: 0;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* На мобиле иконку корзины скрываем — там бургер, корзина внутри меню с бейджем */
@media (max-width: 768px) {
  .sh-nav-cart-icon {
    display: none;
  }
}

/* Пункт «Корзина» в мобильном меню с цифрой количества */
.sh-mobile-link-cart {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.sh-mobile-cart-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  background: #d9b46a;
  color: #0e1a24;
  font-size: 12px;
  font-weight: 700;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ─── Desktop links ─── */
.sh-nav-links {
  display: flex;
  gap: 28px;
  align-items: center;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.sh-nav-link {
  color: rgba(241, 230, 200, 0.65);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-nav-link:hover {
  color: #f1e6c8;
}
.sh-nav-quiz {
  color: #d9b46a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sh-nav-quiz::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d9b46a;
}

.sh-nav-cart {
  margin-right: 8px;
}

/* ─── Burger ─── */
.sh-nav-burger {
  display: none;            /* виден только когда меню сворачивается (<1024) */
  flex-direction: column;
  justify-content: space-between;
  width: 26px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.sh-nav-burger span {
  display: block;
  height: 2px;
  background: #f1e6c8;
  border-radius: 2px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center;
}
.sh-nav-burger.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
.sh-nav-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.sh-nav-burger.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

/* ─── Mobile menu (shared base) ─── */
.sh-mobile-menu {
  display: none;
  position: fixed;
  background: rgba(14, 26, 36, 0.98);
  backdrop-filter: blur(12px);
  flex-direction: column;
  padding: 16px 24px 24px;
  z-index: 1001;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.sh-mobile-menu.open {
  display: flex;
  opacity: 1;
  pointer-events: all;
}

/* ─── Меню сворачивается в бургер на планшете и уже (<1024) ─── */
@media (max-width: 1023px) {
  .sh-nav {
    padding: 12px 20px;
    height: 72px;
  }
  .sh-nav--compact {
    padding: 12px 20px;
    height: 72px;
  }
  .sh-nav-logo img {
    height: 40px;
  }
  .sh-nav-links {
    display: none;
  }
  .sh-nav-burger {
    display: flex;
  }
  .sh-mobile-menu {
    top: 72px;
    left: 0;
    right: 0;
    border-bottom: 1px solid rgba(241, 230, 200, 0.08);
    transform: translateY(-10px);
  }
  .sh-mobile-menu.open {
    transform: translateY(0);
  }
  .sh-mobile-link {
    color: rgba(241, 230, 200, 0.8);
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: 16px;
    font-weight: 400;
    padding: 12px 0;
    border-bottom: 1px solid rgba(241, 230, 200, 0.07);
    display: block;
    transition: color 0.15s;
  }
  .sh-mobile-link:hover {
    color: #f1e6c8;
  }
  .sh-mobile-link:last-child {
    border-bottom: none;
  }
}

/* На широких экранах (>=1024) меню в строку, выпадашка не нужна */
@media (min-width: 1024px) {
  .sh-mobile-menu {
    display: none !important;
  }
}

.sh-mobile-quiz {
  color: #d9b46a !important;
}

.sh-back {
  position: fixed;
  top: 90px;
  left: 48px;
  z-index: 100;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--cream-dim);
  text-decoration: none;
  transition: color 0.3s ease;
}
.sh-back:hover {
  color: var(--gold);
}

@media (max-width: 768px) {
  .sh-back {
    position: static;       /* в потоке flex-бара хедера, слева от лого */
    order: -1;
    margin: 0;
    padding: 8px 10px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    -webkit-tap-highlight-color: rgba(217, 180, 106, 0.15);
  }
  /* лого + «Назад» прижаты влево, бургер уходит вправо */
  .sh-nav-logo {
    margin-right: auto;
  }
}

/* ─── Layout ─── */
.layout-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.layout-content {
  flex: 1 0 auto;
  padding-top: 80px;
}
@media (max-width: 768px) {
  .layout-content {
    padding-top: 72px;
  }
}
</style>
