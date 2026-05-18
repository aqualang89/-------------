<script setup>
useHead({
  noscript: [
    {
      innerHTML: '<div><img src="https://mc.yandex.ru/watch/109183656" style="position:absolute; left:-9999px;" alt="" /></div>'
    }
  ]
})

// Грузим Метрику только если пользователь явно согласился на аналитические cookies
// через cookie-баннер. До согласия — никаких сторонних трекеров.
function loadYandexMetrika () {
  if (typeof window === 'undefined') return

  const w = window
  const d = document
  const s = 'script'
  const src = 'https://mc.yandex.ru/metrika/tag.js?id=109183656'

  // защита от повторной инициализации (например, если consent-event прилетит дважды)
  if (w.__ym_loaded) return
  w.__ym_loaded = true

  w.ym = w.ym || function () { (w.ym.a = w.ym.a || []).push(arguments) }
  w.ym.l = new Date().getTime()

  for (let j = 0; j < d.scripts.length; j++) {
    if (d.scripts[j].src === src) return
  }

  const k = d.createElement(s)
  const a = d.getElementsByTagName(s)[0]
  k.async = 1
  k.src = src
  a.parentNode.insertBefore(k, a)

  w.ym(109183656, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    accurateTrackBounce: true,
    trackLinks: true
  })
}

onMounted(() => {
  if (typeof window === 'undefined') return
  // Если юзер раньше уже согласился — грузим без баннера.
  // Сам баннер реагирует на это в своём mounted и просто не появится.
  try {
    if (localStorage.getItem('cookie-consent') === 'accepted') {
      loadYandexMetrika()
    }
  } catch {}

  // Слушаем событие от cookie-баннера — если юзер нажал "Принять" впервые, грузим Метрику.
  window.addEventListener('cookie-consent-accepted', loadYandexMetrika)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
