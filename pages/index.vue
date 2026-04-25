<template>
  <div>
    <!-- ЗАСТАВКА-ИНТРО -->
    <div id="intro-overlay">
      <div class="intro-center" title="Кликните, чтобы войти"></div>
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

      <section id="контакты" class="block section-animate">
        <h2>Контакты</h2>
        <p>Калининград, студия аквариумного дизайна.</p>
        <p>Телефон / Telegram: +7 (XXX) XXX‑XX‑XX</p>
      </section>
    </div>

  </div>
</template>

<script setup>
onMounted(async () => {
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

  try {
    await loadScript('/js/jquery.min.js')
    await loadScript('/js/jquery.ripples.min.js')
  } catch (err) {
    console.error('Failed to load ripples scripts:', err)
  }

  const overlay = document.getElementById('intro-overlay')

  if (overlay) {
    document.body.style.overflow = 'hidden'

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

    const hash = window.location.hash.slice(1)
    if (hash) closeIntro(hash)

    const introCenter = document.querySelector('.intro-center')
    if (introCenter) {
      introCenter.addEventListener('click', (e) => {
        e.stopPropagation()
        closeIntro()
      })
    }

    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
    if (!isMobile && typeof $ !== 'undefined' && $.fn.ripples) {
      try {
        $(overlay).ripples({
          resolution: 512,
          dropRadius: 20,
          perturbance: 0.04,
          interactive: true
        })
      } catch (err) {
        console.error('Ripples init failed:', err)
      }
    }
  }
})
</script>
