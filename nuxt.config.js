// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: true,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Студия аквариумного дизайна',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'Дизайн, монтаж и обслуживание аквариумов в Калининграде' }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Manrope:wght@400;500;600;700&display=swap' }
      ]
    }
  },
  nitro: {
    preset: 'vercel'
  }
})
