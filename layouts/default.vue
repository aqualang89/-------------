<template>
  <div>
    <!-- Верхнее меню -->
    <nav class="top-nav">
      <div class="nav-inner">
        <NuxtLink to="/" class="nav-logo-text">Студия аквариумного дизайна</NuxtLink>
        <div class="nav-links">
          <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="nav-link">{{ link.label }}</NuxtLink>
          <a v-for="link in anchorLinks" :key="link.to" :href="link.to" class="nav-link" @click.prevent="scrollTo(link.to)">{{ link.label }}</a>
          <a href="#" class="nav-link nav-quiz-link" @click.prevent="openQuiz">🐠 Викторина</a>
        </div>
        <button class="nav-burger" :class="{ open: menuOpen }" aria-label="Меню" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- Мобильное меню -->
    <div class="mobile-menu" :class="{ open: menuOpen }">
      <NuxtLink v-for="link in regularLinks" :key="link.to" :to="link.to" class="mobile-nav-link" @click="menuOpen = false">{{ link.label }}</NuxtLink>
      <a v-for="link in anchorLinks" :key="link.to" :href="link.to" class="mobile-nav-link" @click.prevent="scrollToMobile(link.to)">{{ link.label }}</a>
      <a href="#" class="mobile-nav-link mobile-quiz-link" @click.prevent="openQuiz">🐠 Викторина</a>
    </div>

    <slot />
  </div>
</template>

<script setup>
const menuOpen = ref(false)

const regularLinks = [
  { to: '/', label: 'Главная' },
  { to: '/services', label: 'Услуги' },
  { to: '/catalog', label: 'Каталог' },
  { to: '/calculator', label: 'Калькулятор' },
  { to: '/admin', label: 'Админ' },
]

const anchorLinks = [
  { to: '#контакты', label: 'Контакты' },
]

function scrollTo(href) {
  const id = href.slice(1)
  const target = document.getElementById(id)
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToMobile(href) {
  menuOpen.value = false
  scrollTo(href)
}

function openQuiz() {
  menuOpen.value = false
  if (typeof restartQuiz === 'function' && typeof toggleQuiz === 'function') {
    restartQuiz()
    toggleQuiz(true)
  }
}

useHead({
  script: [
    { src: '/js/chat.js', tagPosition: 'bodyClose' },
    { src: '/js/quiz.js', tagPosition: 'bodyClose' }
  ]
})
</script>
