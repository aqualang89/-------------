<template>
  <div class="layout-root">
    <nav class="sh-nav" :class="{ 'sh-nav--compact': compact }">
      <div class="sh-nav-inner">
        <div class="sh-nav-links">
          <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="sh-nav-link">{{ link.label }}</NuxtLink>
          <!-- <a href="#" class="sh-nav-link sh-nav-quiz" @click.prevent="openQuiz">Викторина</a> -->
        </div>

        <CartIcon class="sh-nav-cart-icon" />

        <button class="sh-nav-burger" :class="{ open: menuOpen }" aria-label="Меню" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
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

    <NuxtLink v-if="$route.path !== '/'" :to="backTo" class="sh-back" @click="clearIntro">
      ← Назад
    </NuxtLink>
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
    { src: '/js/chat.js?v=20260603-btn', tagPosition: 'bodyClose' }
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
.sh-nav-inner {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 28px;
  pointer-events: auto;
}

.sh-nav-cart-icon {
  padding-top: 6px;
  flex-shrink: 0;
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

/* compact (скролл > 80px на десктопе): корзина прячется вместе со ссылками,
   остаётся только бургер */
.sh-nav--compact .sh-nav-cart-icon {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  filter: blur(4px);
  pointer-events: none;
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
  padding-top: 10px;
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

/* compact: hide links */
.sh-nav--compact .sh-nav-links {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  filter: blur(4px);
  pointer-events: none;
  position: absolute;
}

/* ─── Burger ─── */
.sh-nav-burger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 26px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8) rotate(-10deg);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s,
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.05s;
}
.sh-nav--compact .sh-nav-burger {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1) rotate(0deg);
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

/* Desktop compact menu */
@media (min-width: 769px) {
  .sh-nav--compact ~ .sh-mobile-menu {
    top: 58px;
    right: 36px;
    width: 220px;
    border-radius: 10px;
    border: 1px solid rgba(241, 230, 200, 0.08);
    transform: translateY(-12px) scale(0.96);
    filter: blur(2px);
    transform-origin: top right;
  }
  .sh-nav--compact ~ .sh-mobile-menu.open {
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  .sh-mobile-link {
    color: rgba(241, 230, 200, 0.8);
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    padding: 10px 0;
    border-bottom: 1px solid rgba(241, 230, 200, 0.06);
    display: block;
    transition: color 0.2s ease, padding-left 0.2s ease;
  }
  .sh-mobile-link:hover {
    color: #f1e6c8;
    padding-left: 6px;
  }
  .sh-mobile-link:last-child {
    border-bottom: none;
  }
}

/* Mobile menu */
@media (max-width: 768px) {
  .sh-nav {
    padding: 12px 20px;
    height: 72px;
  }
  .sh-nav--compact {
    padding: 12px 20px;
    height: 72px;
  }
  .sh-nav-inner {
    justify-content: flex-end;
    align-items: center;
  }
  .sh-nav-links {
    display: none;
  }
  .sh-nav-burger {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1) rotate(0deg);
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
    position: static;
    margin: 8px 12px 0;
    display: inline-flex;
    align-items: center;
    padding: 12px 16px;
    min-height: 44px;
    font-size: 12px;
    -webkit-tap-highlight-color: rgba(217, 180, 106, 0.15);
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
