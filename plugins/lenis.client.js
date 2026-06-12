import Lenis from 'lenis'

// Плавный скролл на весь сайт (как на aqualang.pro). Горизонтальная галерея услуг
// подписывается на window.__lenis.on('scroll') и двигается в синхроне — без дёрганья.
// smoothTouch по умолчанию выключен: на мобиле скролл нативный, Lenis только эмитит события.
export default defineNuxtPlugin(() => {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })

  function raf (time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)

  window.__lenis = lenis
})
