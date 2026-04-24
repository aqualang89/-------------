# State — Студия аквариумного дизайна

## Решения

### 2026-04-20 Новая палитра и типографика
**Решение:** фон #013220 (тёмный зелёный), текст #F0EDE5 (Cloud Dancer), шрифты Noto Serif (заголовки) + Manrope (текст)
**Почему:** премиальный уютный вид, мягкий контраст без резкости. Montserrat заменяем — не тот характер

### 2026-04-20 Three.js водная анимация на интро (десктоп)
**Решение:** заменить текущий 2D canvas на Three.js WebGL воду
**Референс:** hero на bfd.su — нужно изучить через Playwright
**Почему:** текущие SVG-круги от курсора выглядят слабо, хочется реалистичную воду
**На мобилке:** оставляем лёгкий вариант (CSS/SVG), Three.js только десктоп

## Блокеры

### 2026-04-20 Playwright MCP не был подключён
**Проблема:** не смогли посмотреть bfd.su hero через браузер
**Статус:** ✅ решено — MCP перенесён в Kimi
**Решение:** Playwright MCP работает через `~/.kimi/mcp.json`, сервер отвечает на команды

### 2026-04-22 Переезд с Claude Code на Kimi Code CLI
**Решение:** Полный перенос инфраструктуры из Claude в Kimi
**Что перенесено:**
- Глобальная память (24 файла)
- Проектные memory-файлы (7 проектов)
- 15 агентов
- 14 скиллов
- 4 MCP сервера (deepwiki, playwright, context7, figma)
- GitHub + Vercel workflow (автокоммит/пуш)
**Почему:** Макс работает с Kimi, нужна единая среда. Claude больше не используется.

### 2026-04-22 Договоренность про STATE.md
**Решение:** Командный подход к ведению STATE.md
**Как:**
1. Макс говорит "state" → сразу пишем
2. Kimi спрашивает после обсуждений → "Записать в STATE?"
3. Перед закрытием сессии → быстрый чек на решения
**Почему:** Claude постоянно забывал писать в STATE. Двойная проверка исключает забывчивость.

### 2026-04-24 Интро с водой — ГОТОВО (jquery.ripples)
**Решение:** jquery.ripples вместо PixiJS/Three.js
**Почему:** 6+ попыток с PixiJS displacement/flow-trail/spawn-ripple — не дали результата. jquery.ripples — готовое WebGL-решение с реальной физикой ripple.
**Параметры:**
- resolution: 512
- dropRadius: 20
- perturbance: 0.04
- interactive: true
**Загрузка:** последовательная через Promise (jQuery → ripples → init), не defer
**Мобилка:** guard `width <= 768 || 'ontouchstart'` → статичный фон, без ripples
**Вход на сайт:** клик только в центральной зоне 320×200px (невидимая, cursor: pointer)
**Фон:** `public/img/aquarium-bottom.jpg`
**Конфиг локально:** `docs/intro-water-setup.md` (не в git)
**Референс:** https://sirxemic.github.io/jquery.ripples/

### 2026-04-23 Миграция на Nuxt 3 завершена
**Решение:** Полный переезд с vanilla HTML на Nuxt 3 + SSR
**Что сделано:**
- Nuxt 3.16.0 + Vercel деплой
- pages/index.vue (главная), pages/calculator.vue (калькулятор)
- server/api/ — chat, chat-status, telegram (Nitro)
- server/utils/ — ai, store, telegram
- layouts/default.vue — навигация, чат, викторина
- assets/css/main.css — все стили
- public/ — картинки, товары.json, скрипты
- Удалены старые файлы: index.html, calculator.html, style.css, api/, lib/
**Фиксы:**
- Nuxt 3.21.2 багован на Vercel → понижение до 3.16.0
- `compatibilityDate` + `compatibilityVersion` для стабильного билда
- Старый `index.html` в корне блокировал Nuxt → удалён
- `.nuxt/` в git → добавлен в `.gitignore`
- Скрипты chat.js/quiz.js через `useHead` с `tagPosition: 'bodyClose'`
- Рыбка-маскот убрана по просьбе Макса
**SEO:** SSR включён, каждая страница теперь серверная (лучше для поисковиков)
**Следующий шаг:** Каталог из 1С (Excel-импорт в админку)

## Shipped
