<template>
  <div class="layout-root">
    <nav class="sh-nav">
      <div class="sh-nav-inner">
        <div class="sh-nav-links">
          <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="sh-nav-link">{{ link.label }}</NuxtLink>
          <!-- <a href="#" class="sh-nav-link sh-nav-quiz" @click.prevent="openQuiz">Викторина</a> -->
        </div>

        <button class="sh-nav-burger" :class="{ open: menuOpen }" aria-label="Меню" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <div class="sh-mobile-menu" :class="{ open: menuOpen }">
      <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="sh-mobile-link" @click="menuOpen = false">{{ link.label }}</NuxtLink>
      <!-- <a href="#" class="sh-mobile-link sh-mobile-quiz" @click.prevent="openQuiz">Викторина</a> -->
    </div>

    <NuxtLink v-if="$route.path !== '/'" to="/" class="sh-back" @click.native="sessionStorage.removeItem('introShown')">
      ← Назад
    </NuxtLink>
    <div class="layout-content">
      <slot />
    </div>
    <AppFooter />
  </div>
</template>

<script setup>
const menuOpen = ref(false)

const regularLinks = [
  { to: '/', label: 'Главная' },
  { to: '/services', label: 'Услуги' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/calculator', label: 'Калькулятор' },
  { to: '/about', label: 'О нас' },
]

/* function openQuiz() {
  menuOpen.value = false
  if (typeof restartQuiz === 'function' && typeof toggleQuiz === 'function') {
    restartQuiz()
    toggleQuiz(true)
  }
} */

useHead({
  script: [
    { src: '/js/chat.js', tagPosition: 'bodyClose' }
    /* { src: '/js/quiz.js', tagPosition: 'bodyClose' } */
  ]
})
</script>

<style>
.sh-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 22px 48px;
  pointer-events: none;
}
.sh-nav-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 28px;
  pointer-events: auto;
}
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
.sh-nav-burger {
  display: none;
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
  transition: all 0.25s ease;
  transform-origin: center;
}
.sh-nav-burger.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
.sh-nav-burger.open span:nth-child(2) { opacity: 0; }
.sh-nav-burger.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

.sh-mobile-menu {
  display: none;
  position: fixed;
  top: 90px;
  left: 0;
  right: 0;
  background: rgba(14, 26, 36, 0.98);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(241, 230, 200, 0.08);
  flex-direction: column;
  padding: 16px 24px 24px;
  z-index: 999;
  transform: translateY(-10px);
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
}
.sh-mobile-menu.open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
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
.sh-mobile-quiz {
  color: #d9b46a !important;
}

.sh-back {
  position: fixed;
  top: 90px;
  left: 48px;
  z-index: 100;
  font-family: var(--font-mono);
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
  .sh-nav {
    padding: 12px 20px;
    height: 72px;
  }
  .sh-nav-inner {
    justify-content: flex-end;
  }
  .sh-nav-links {
    display: none;
  }
  .sh-nav-burger {
    display: flex;
  }
  .sh-mobile-menu {
    display: flex;
    top: 72px;
  }
  .sh-back {
    left: 20px;
    top: 90px;
  }
}

.layout-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.layout-content {
  flex: 1 0 auto;
}
</style>
