import Lenis from 'lenis'

// Плавный скролл на весь сайт (как на aqualang.pro). Горизонтальная галерея услуг
// подписывается на window.__lenis.on('scroll') и двигается в синхроне — без дёрганья.
// smoothTouch по умолчанию выключен: на мобиле скролл нативный, Lenis только эмитит события.
export default defineNuxtPlugin(() => {
  // autoRaf:false — raf-цикл крутим сами, чтобы держать СВОЮ ссылку на requestAnimationFrame.
  // Интро на главной (jquery.ripples) на ~100мс подменяет window.requestAnimationFrame
  // пустышкой — это рвало внутренний raf-цикл Lenis (после интро колесо переставало
  // работать). Своя ссылка на оригинал подмену переживает.
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, autoRaf: false })

  const raf = window.requestAnimationFrame.bind(window)
  function loop (time) {
    lenis.raf(time)
    raf(loop)
  }
  raf(loop)

  window.__lenis = lenis
})
