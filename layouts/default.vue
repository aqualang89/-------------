<template>
  <div>
    <!-- Верхнее меню -->
    <nav class="top-nav">
      <div class="nav-inner">
        <a href="/" class="nav-logo-text">Студия аквариумного дизайна</a>
        <div class="nav-links">
          <a href="/" class="nav-link">Главная</a>
          <a href="/services" class="nav-link">Услуги</a>
          <a href="/catalog" class="nav-link">Каталог</a>
          <a href="/calculator" class="nav-link">Калькулятор</a>
          <a href="/admin" class="nav-link">Админ</a>
          <a href="#контакты" class="nav-link">Контакты</a>
          <a href="#" class="nav-link nav-quiz-link" id="nav-quiz-btn">🐠 Викторина</a>
        </div>
        <button class="nav-burger" id="nav-burger" aria-label="Меню">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>

    <!-- Мобильное меню -->
    <div class="mobile-menu" id="mobile-menu">
      <a href="/" class="mobile-nav-link">Главная</a>
      <a href="/services" class="mobile-nav-link">Услуги</a>
      <a href="/catalog" class="mobile-nav-link">Каталог</a>
      <a href="/calculator" class="mobile-nav-link">Калькулятор</a>
      <a href="/admin" class="mobile-nav-link">Админ</a>
      <a href="#контакты" class="mobile-nav-link">Контакты</a>
      <a href="#" class="mobile-nav-link mobile-quiz-link" id="mobile-quiz-btn">🐠 Викторина</a>
    </div>

    <slot />
  </div>
</template>

<script setup>
useHead({
  script: [
    { src: '/js/chat.js', tagPosition: 'bodyClose' },
    { src: '/js/quiz.js', tagPosition: 'bodyClose' }
  ]
})
onMounted(() => {
  // Бургер-меню
  const burger = document.getElementById('nav-burger')
  const mobileMenu = document.getElementById('mobile-menu')

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open')
      burger.classList.toggle('open', open)
    })

    // Закрыть меню при клике на пункт
    mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open')
        burger.classList.remove('open')
      })
    })

    // Плавный скролл для мобильного меню (только якоря)
    mobileMenu.querySelectorAll('.mobile-nav-link[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const id = link.getAttribute('href').slice(1)
        const target = document.getElementById(id)
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  // Плавный скролл по клику на пункты десктопного меню (только якоря)
  document.querySelectorAll('a.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault()
      const id = this.getAttribute('href').slice(1)
      const target = document.getElementById(id)
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })

  // Викторина из навбара (десктоп)
  const navQuizBtn = document.getElementById('nav-quiz-btn')
  if (navQuizBtn) {
    navQuizBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (typeof restartQuiz === 'function' && typeof toggleQuiz === 'function') {
        restartQuiz()
        toggleQuiz(true)
      }
    })
  }

  // Викторина из мобильного меню
  const mobileQuizBtn = document.getElementById('mobile-quiz-btn')
  if (mobileQuizBtn && burger) {
    mobileQuizBtn.addEventListener('click', (e) => {
      e.preventDefault()
      mobileMenu.classList.remove('open')
      burger.classList.remove('open')
      if (typeof restartQuiz === 'function' && typeof toggleQuiz === 'function') {
        restartQuiz()
        toggleQuiz(true)
      }
    })
  }
})
</script>
