// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  compatibilityVersion: 4,
  ssr: true,
  css: ['~/assets/css/main.css'],
  experimental: {
    appManifest: false
  },
  app: {
    head: {
      title: 'Студия аквариумного дизайна',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { name: 'description', content: 'Дизайн, монтаж и обслуживание аквариумов в Калининграде' }
      ],
      script: [
        {
          innerHTML: `(function(){try{if(sessionStorage.getItem('leftHome')){document.documentElement.classList.add('intro-skip')}}catch(e){}})();`,
          tagPriority: 'critical'
        }
      ],
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap' }
      ]
    }
  },
  nitro: {
    vercel: {
      config: {
        maxDuration: 60
      }
    }
  }
})
