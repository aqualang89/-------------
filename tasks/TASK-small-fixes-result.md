# TASK-small-fixes-result.md

**Исполнитель:** Kimi
**Дата:** 2026-05-12
**Статус:** Готово к ревью

---

## Что сделал

### Пункт 1: кнопка "Назад" со страницы товара → в каталог

**Файл:** `layouts/default.vue`
- Добавлен `computed` `backTo` в `<script setup>` (строки 39–42):
  ```js
  const backTo = computed(() => {
    if (route.path.startsWith('/catalog/') && route.path !== '/catalog') return '/catalog'
    return '/'
  })
  ```
- В template заменён `to="/"` на `:to="backTo"` (строка 22).

**Логика:**
- `/catalog/aquarium-200l` → `/catalog`
- `/catalog` → `/` (так как `route.path !== '/catalog'` — условие ложно)
- `/services`, `/about`, `/calculator`, `/cart` → `/`
- На `/` кнопки нет (v-if скрывает)

### Пункт 2: tap-area кнопки "Назад" на мобиле

**Файл:** `layouts/default.vue`
- Заменён мобильный медиа-блок `.sh-back` (строки 351–361):
  ```css
  @media (max-width: 768px) {
    .sh-back {
      position: static;
      margin: 8px 12px 0;
      display: inline-flex;
      align-items: center;
      padding: 12px 16px;
      min-height: 44px;
      font-size: 12px;
      -webkit-tap-highlight-color: rgba(217, 180, 106, 0.15);
    }
  }
  ```
- Десктопные стили `.sh-back` (строки 331–346) не тронуты.

### Пункт 3: nav прижата к правому краю на широких мониторах

**Файл:** `layouts/default.vue`
- Из `.sh-nav-inner` (строки 133–138) убраны `max-width: 1440px` и `margin: 0 auto`.
- Теперь `.sh-nav-inner` растягивается на всю ширину между `padding: 22px 48px` у `.sh-nav`, и `justify-content: flex-end` прижимает содержимое к правому краю (48px от края экрана) на любой ширине.
- Мобильный медиа `.sh-nav` (`padding: 12px 20px`) сохранён, поведение на мобиле не изменилось.

### Пункт 4: градиент сверху картинки аквариума на десктопе

**Файл:** `pages/index.vue`
- После блока `.sh-interior { ... }` (строки 496–508) добавлен `.sh-interior::before` (строки 510–520):
  ```css
  .sh-interior::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 180px;
    background: linear-gradient(to bottom, #1e2933 0%, rgba(30, 41, 51, 0.5) 50%, transparent 100%);
    pointer-events: none;
    z-index: 3;
  }
  ```
- `z-index: 3` — выше картинки (`z-index: 1`), но не конфликтует с `.sh-stage::before/after` (у них `z-index: 2`).
- На мобиле этот `::before` перезапишется существующим медиа-правилом (строки ~1145+), регрессии нет.

---

## Какие файлы тронул

| Файл | Строки | Что изменено |
|---|---|---|
| `layouts/default.vue` | 22 | `:to="backTo"` вместо `to="/"` |
| `layouts/default.vue` | 39–42 | Добавлен `computed` `backTo` |
| `layouts/default.vue` | 133–138 | Убраны `max-width` и `margin` из `.sh-nav-inner` |
| `layouts/default.vue` | 351–361 | Переписан мобильный `.sh-back` (tap-area) |
| `pages/index.vue` | 510–520 | Добавлен `.sh-interior::before` (градиент сверху) |

**Ничего другого не трогал.** Логика скролла галереи, каталог, футер, чат, кнопки, шрифты — всё оставлено как было.

---

## Что не делал и почему

1. **Не конвертировал `@media (max-width: 768px)` в mobile-first.** В ТЗ для пункта 2 было явное «замени содержимое блока». Существующий код в `layouts/default.vue` уже использует `max-width` медиа для `.sh-back`, `.layout-content` и мобильного меню. ТЗ — точечная правка, не рефакторинг архитектуры CSS.
2. **Не заменял хардкод `#1e2933` в градиенте на CSS-переменную.** В ТЗ указан именно такой цвет, и он совпадает с существующим `.sh-stage::before`. Дизайн-токен `--ink-soft` — `#1d3144`, что близко, но ТЗ требовал `#1e2933`.
3. **Не обновлял `STATE.md`.** Это точечные UX-фиксы, не архитектурное решение.

---

## Что Claude должен проверить руками

- [ ] **Пункт 1 (маршрут):** Открыть `/catalog/любой-slug` → кнопка «Назад» ведёт в `/catalog`. Открыть `/catalog`, `/services`, `/about` → ведёт на `/`. На главной кнопки нет.
- [ ] **Пункт 2 (Android):** На реальном Android-устройстве или эмуляторе — тап по «Назад» даёт лёгкий золотистый highlight (`-webkit-tap-highlight-color`). Размер tap-area ≥ 44px по высоте.
- [ ] **Пункт 3 (wide screen):** На мониторе ≥1441px (или в DevTools 1920px/2560px) — навигация/бургер прижаты к правому краю, отступ 48px от края экрана. На 1440px и ниже — без визуальных изменений.
- [ ] **Пункт 4 (градиент):** На десктопе верх картинки `hero-interior.jpg` плавно растворяется в фоне (нет резкой линии). Нижний градиент (`.sh-stage::after`) остался без изменений. На мобиле — без регрессий.
- [ ] **Build:** `npm run build` — без ошибок (локально shell tool выдал internal error, проверить не удалось).
- [ ] **Console:** На главной и странице товара — нет runtime-ошибок в консоли.

---

## Вопросы Claude

Нет. Всё по ТЗ, спорных моментов не возникло.

---

## Примечание

`npm run build` локально не удалось выполнить — shell tool выдавал `internal error` на всех вызовах. Изменения точечные и синтаксически корректны (нет опечаток в Vue/template, скобки/кавычки закрыты). Рекомендую прогнать билд перед коммитом.
