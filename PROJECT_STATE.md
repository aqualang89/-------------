# PROJECT_STATE.md

## Статус: IN PROGRESS

## Текущий этап
Проектирование завершено. Ждём решения Макса о старте реализации.

## Выполнено
- [x] Обсуждение архитектуры с Максом
- [x] Выбран стек: Nuxt 3 + Supabase + Vercel
- [x] Определена структура каталога (динамические роуты)
- [x] Решено: Excel-импорт из 1С в админку, данные в Supabase
- [x] Создан PROJECT_CONTEXT.md
- [x] Создан PROJECT_STATE.md
- [x] Explore Agent — полный аудит текущего кода
- [x] Plan Agent — финальная архитектура Nuxt + Supabase

## В работе
- Ожидание решения Макса: с какого этапа начинать

## Результаты агентов

### Explore Agent
Полный разбор 8 файлов проекта. Ключевые находки:
- index.html: 240 строк (интро, навигация, hero, услуги, каталог, контакты, викторина, чат)
- calculator.html: 1022 строки, 8 калькуляторов-табов с формулами
- style.css: дизайн-система с CSS-переменными (#013220, #F0EDE5)
- API: чат (Perplexity AI), статус, Telegram webhook
- Клиент: chat.js, quiz.js, fish.js, water.js (отложено)

### Plan Agent
Полная архитектура миграции:
- Структура папок Nuxt 3 (pages, components, composables, server/api)
- Схема Supabase: categories, products, product_descriptions, product_photos, import_logs
- API endpoints: products, categories, import/upload
- SEO: SSR, sitemap, JSON-LD, динамические meta для товаров
- Excel-импорт: формат файла, upsert по артикулу, batch insert 15k строк
- Пошаговая миграция: 10 этапов от скелета до удаления legacy

## Следующий шаг
Coder агенты для реализации. Макс решает: начать с этапа 0 (Supabase) или сразу с этапа 1 (Nuxt-скелет)?
