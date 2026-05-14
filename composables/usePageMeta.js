export function usePageMeta({ title, description, ogImage = '/og-image.jpg' }) {
  useHead({
    title: `${title} — Рипарий`,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: 'ru_RU' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
      { name: 'theme-color', content: '#1e2933' }
    ],
    link: [
      // canonical на ASCII-punycode + www (primary в Vercel) — без редиректа, краулерам прямой URL.
      { rel: 'canonical', href: () => `https://www.xn--80apbe1aed.xn--p1ai${useRoute().path}` }
    ],
    htmlAttrs: {
      lang: 'ru'
    }
  })
}
