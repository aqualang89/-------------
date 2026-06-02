// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@sentry/nuxt/module'],
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, minimum-scale=1.0, viewport-fit=cover' },
        { name: 'description', content: 'Дизайн, монтаж и обслуживание аквариумов в Калининграде' },
        { name: 'theme-color', content: '#0e1a24' }
      ],
      style: [
        {
          innerHTML: `#intro-overlay{position:fixed;inset:0;background:#0e1a24 url('/img/aquarium-bottom.jpg') center/cover no-repeat;display:flex;align-items:center;justify-content:center;z-index:2000}html.intro-skip #intro-overlay{display:none!important}`,
          tagPriority: 'critical'
        }
      ],
      script: [
        {
          innerHTML: `(function(){try{if(sessionStorage.getItem('leftHome')){document.documentElement.classList.add('intro-skip')}}catch(e){}})();`,
          tagPriority: 'critical'
        }
      ],
      link: [
        // Google Fonts грузится async чтобы не блокировать рендеринг.
        // Если у юзера РФ-провайдер блокирует Google — сайт всё равно отрендерится с системными шрифтами.
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter:wght@300;400;500&display=swap&subset=cyrillic,latin',
          onload: "this.onload=null;this.rel='stylesheet'"
        },
        // Fallback для отключённого JS
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Inter:wght@300;400;500&display=swap&subset=cyrillic,latin',
          media: 'print',
          onload: "this.media='all'"
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48x48.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    }
  },
  nitro: {
    vercel: {
      config: {
        maxDuration: 60
      }
    },
    // Базовые security headers — добавляются ко всем ответам, включая HTML и API.
    // CSP не настраиваем здесь — он требует whitelist Cloudinary/Supabase/Telegram,
    // делать отдельно когда будет время аккуратно протестировать.
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
      }
    }
  }
})
