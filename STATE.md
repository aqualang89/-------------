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

### 2026-04-22 Водный шейдер для интро
**Проблема:** Шейдеры воды — сложная задача, 3 попытки (Kimi + 2 от Perplexity) не дали результата как на bfd.su
**Что пробовали:**
- Кастомный GLSL шейдер на PixiJS v8 — артефакты, пятна
- Шейдер v2 и v3 от Perplexity — работают, но выглядят как "зелёная рябь", не как bfd.su
**Новый подход (2026-04-22):** DisplacementFilter + карта смещения `img/water-displace.png`
- Perplexity: abandon procedural, use DisplacementFilter with seamless displacement map
**Проблемы фикса:**
- `PIXI.Assets.load()` — не работает для простых png в v8
- `PIXI.Texture.from('path')` — возвращает `undefined`, т.к. загрузка асинхронна
- **Фикс:** загрузка через нативный `new Image()` + `await` → затем `Texture.from(img)`
**Текущий статус:** ⏸️ ОТЛОЖЕНО
**Итоги попыток:**
- Procedural GLSL (3 версии) — абстрактный шум, не вода
- DisplacementFilter + карта смещения — не работает в PixiJS v8 (тихий фейл, ошибок нет, эффекта нет)
- `PIXI.Assets.load`, `Texture.from`, нативный `Image()` — текстура загружается, но фильтр не применяется
- TilingSprite → Sprite, stage filters, scale до 80, alpha debug — ничего не помогло
**Гипотеза:** PixiJS v8 DisplacementFilter работает иначе, или требует специфической подготовки текстуры, или API фильтров изменился настолько, что нужен другой подход
**Когда вернёмся:** либо Three.js (MeshPhysicalMaterial + video texture), либо чистый WebGL2 shader, либо найдём рабочий пример PixiJS v8 displacement

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
