# PROJECT_CONTEXT.md

## Проект
Название: Студия аквариумного дизайна
Тип: Сайт-витрина с каталогом товаров
Цель: Переезд с vanilla JS на Nuxt 3 + подключение каталога из 1С (15 000 наименований)

## Стек
- Runtime: Node.js
- Framework: Nuxt 3 (Vue 3 + SSR)
- Database: Supabase (PostgreSQL)
- Auth: Простой пароль для админки
- Deployment: Vercel
- CSS: Tailwind (опционально) или текущие кастомные стили
- Fonts: Noto Serif + Manrope

## Архитектура
- Nuxt 3 с SSR для SEO
- Динамические роуты каталога: /catalog/[category]/[slug]
- API routes для чата, телеграм-бота, загрузки каталога
- Supabase: таблицы products, categories
- Excel-импорт в админке → upsert в Supabase по артикулу
- Описания и фото товаров хранятся отдельно (не из 1С), обновляются вручную

## Модули
- intro: водный эффект на интро (jquery.ripples, готово)
  - Зависимости: jQuery 3.7.1 + jquery.ripples 0.5.3 (CDN)
  - Параметры: resolution 512, dropRadius 20, perturbance 0.04
  - Мобилка: статичный фон (guard на ontouchstart/width <= 768)
  - Вход: клик в центральную зону 320×200px
  - Конфиг: docs/intro-water-setup.md (локально, не в git)
- catalog: каталог с поиском, фильтрами, пагинацией
- calculator: калькулятор аквариума
- chat: чат-виджет с интеграцией Telegram
- admin: загрузка Excel из 1С, управление товарами
- seo: meta-теги, sitemap

## Структура папок
```
pages/
  index.vue              # Главная (интро + герой)
  calculator.vue         # Калькулятор
  catalog/
    index.vue            # Список категорий
    [category]/
      index.vue          # Товары категории
      [slug].vue         # Карточка товара
  admin.vue              # Админка загрузки
server/
  api/
    chat.post.js
    chat-status.post.js
    telegram.post.js
    catalog-upload.post.js
    catalog.get.js
components/
  IntroOverlay.vue
  ChatWidget.vue
  Header.vue
  Footer.vue
  ProductCard.vue
  ProductGrid.vue
layouts/
  default.vue
assets/
  css/main.css
public/
  img/
```

## Правила
- Никаких изменений архитектуры без согласования с Максом
- Код production-ready
- Функции модульные
- Новые зависимости только с явного одобрения

## Стандарты кода
- Язык: JavaScript (пока без TypeScript — проще для скорости)
- Стиль: Airbnb/Standard — как в текущем проекте
- Тесты: пока не нужны, ручное тестирование
