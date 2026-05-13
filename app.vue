<script setup>
useHead({
  noscript: [
    {
      innerHTML: '<div><img src="https://mc.yandex.ru/watch/109183656" style="position:absolute; left:-9999px;" alt="" /></div>'
    }
  ]
})

onMounted(() => {
  if (typeof window === 'undefined') return

  const w = window
  const d = document
  const s = 'script'
  const src = 'https://mc.yandex.ru/metrika/tag.js?id=109183656'

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
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
