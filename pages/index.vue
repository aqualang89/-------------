<template>
  <div>
    <!-- ЗАСТАВКА-ИНТРО -->
    <div id="intro-overlay">
      <div id="water-container"></div>
      <div class="intro-center">
        <img src="/img/logo-shrimp.png" alt="Студия аквариумного дизайна" class="intro-logo">
        <button class="intro-enter" type="button">ВОЙТИ НА САЙТ</button>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="page-wrap">
      <header class="hero">
        <div class="hero-inner">
          <img src="/img/logo-shrimp.png" alt="Студия аквариумного дизайна" class="hero-logo">
          <h1 class="hero-title">СТУДИЯ АКВАРИУМНОГО ДИЗАЙНА</h1>
          <p class="hero-subtitle">Дизайн • Монтаж • Обслуживание аквариумов</p>
          <button onclick="document.getElementById('контакты').scrollIntoView()" class="hero-button">
            Заказать консультацию
          </button>
        </div>
      </header>

      <section id="услуги" class="block section-animate">
        <h2>Наши услуги</h2>
        <div class="cards">
          <div class="card">
            <h3>Дизайн‑проект</h3>
            <p>Индивидуальный проект под ваше пространство.</p>
            <span>от 5 000 ₽</span>
          </div>
          <div class="card">
            <h3>Монтаж и запуск</h3>
            <p>Полный монтаж «под ключ» с оборудованием.</p>
            <span>от 30 000 ₽</span>
          </div>
          <div class="card">
            <h3>Обслуживание</h3>
            <p>Чистка, подмена воды, контроль параметров.</p>
            <span>от 3 000 ₽ в месяц</span>
          </div>
        </div>
      </section>

      <section id="каталог" class="block section-animate">
        <h2>Каталог</h2>
        <label>Максимальная цена:
          <input type="range" id="фильтр-цена" min="0" max="100000" value="100000">
          <span id="цена-значение">до 100 000 ₽</span>
        </label>
        <div id="товары" class="cards"></div>
      </section>

      <section id="контакты" class="block section-animate">
        <h2>Контакты</h2>
        <p>Калининград, студия аквариумного дизайна.</p>
        <p>Телефон / Telegram: +7 (XXX) XXX‑XX‑XX</p>
      </section>
    </div>

  </div>
</template>

<script setup>
onMounted(() => {
  useHead({
    script: [
      { src: '/js/water.js', defer: true }
    ]
  })

  // Динамическая загрузка чата и викторины после монтирования
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = reject
      document.body.appendChild(s)
    })
  }

  loadScript('/js/chat.js').catch(err => console.error('Chat load failed:', err))
  loadScript('/js/quiz.js').catch(err => console.error('Quiz load failed:', err))

  let cachedТовары = null

  // Загрузка товаров из JSON
  async function загрузитьТовары() {
    const resp = await fetch('/товары.json')
    cachedТовары = await resp.json()
    отрисоватьТовары(cachedТовары)
  }

  function отрисоватьТовары(список) {
    const контейнер = document.getElementById('товары')
    if (!контейнер) return
    контейнер.innerHTML = ''
    список.forEach(t => {
      const div = document.createElement('div')
      div.className = 'card'
      const название = document.createElement('h3')
      название.textContent = t.название
      const описание = document.createElement('p')
      описание.textContent = t.описание
      const цена = document.createElement('span')
      цена.textContent = `${t.цена.toLocaleString()} ₽`
      div.appendChild(название)
      div.appendChild(описание)
      div.appendChild(цена)
      контейнер.appendChild(div)
    })
  }

  function применитьФильтр() {
    const max = parseInt(document.getElementById('фильтр-цена').value)
    const ценаЗначение = document.getElementById('цена-значение')
    if (ценаЗначение) {
      ценаЗначение.textContent = `до ${max.toLocaleString()} ₽`
    }
    if (!cachedТовары) return
    отрисоватьТовары(cachedТовары.filter(t => t.цена <= max))
  }

  const фильтрЦена = document.getElementById('фильтр-цена')
  if (фильтрЦена) {
    фильтрЦена.addEventListener('input', применитьФильтр)
    загрузитьТовары().catch(err => console.error('Товары не загрузились:', err))
  }

  // Логика заставки-интро + PixiJS вода
  const overlay = document.getElementById('intro-overlay')
  const enterBtn = document.querySelector('.intro-enter')

  if (overlay) {
    document.body.style.overflow = 'hidden'

    function closeIntro(scrollTo) {
      overlay.classList.add('hidden')
      document.body.style.overflow = ''
      if (window.waterCleanup) window.waterCleanup()
      setTimeout(() => {
        overlay.remove()
        if (scrollTo) {
          const target = document.getElementById(scrollTo)
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 700)
    }

    const hash = window.location.hash.slice(1)
    if (hash) closeIntro(hash)

    if (enterBtn) {
      enterBtn.addEventListener('click', () => closeIntro())
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('#water-container')) closeIntro()
    })

    const introLogo = document.querySelector('.intro-logo')
    if (introLogo) introLogo.addEventListener('click', () => closeIntro())
  }
})
</script>
