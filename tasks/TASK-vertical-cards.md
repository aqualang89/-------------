# TASK-vertical-cards: вертикальные карточки в горизонтальной галерее

**Автор:** Claude
**Исполнитель:** Kimi
**Дата постановки:** 2026-05-12
**Приоритет:** обычный

---

## Цель

Переделать форму карточек услуг на главной (`.sh-hcard` в галерее `.sh-horizontal-section`) — сейчас они "лежат на боку" (широкие, фото справа + текст слева), нужно "поставить вертикально" (узкие, **фото сверху + текст снизу**), стиль ближе к aqualang.pro — высокие премиальные плитки.

**Горизонтальный скролл сохраняется и на десктопе, и на мобиле.** Меняется только форма и внутренняя компоновка карточек.

## Контекст / зачем

Макс показал референс aqualang.pro — там карточки секций ("Сайты под ключ", "ИИ-чаты и боты") сделаны как **высокие вертикальные плитки на всю высоту экрана**. Сейчас у нас карточки `.sh-hcard` имеют `width: 85vw` и grid `1fr 1fr` (текст слева, картинка справа) — это горизонтально-широкая форма. На мобиле эта форма деградирует криво.

Цель — премиальная вертикальная плитка с большим фото сверху и текстовой частью снизу, на всех экранах.

## Что прочитать перед стартом

- `AGENTS.md` (этот проект) — командные правила, mobile-first жёсткий
- `STATE.md` — последние решения, особенно 2026-05-09 "Горизонтальный скролл" и 2026-05-10 "Mobile-first чеклист"
- `DESIGN.md` — цветовые токены (`--cream`, `--gold`, `--ink-deep` и т.д.), шрифты, breakpoints
- `MOBILE_CHECKLIST.md` — обязательный чек
- `pages/index.vue`:
  - HTML галереи: строки **62–122** (`.sh-horizontal-section` → `.sh-horizontal-sticky` → `.sh-horizontal-track` → 5×`.sh-hcard`)
  - JS скролла: строки **185–236** (`initHorizontalScroll`, `cleanupHorizontalScroll`, lifecycle)
  - CSS галереи: строки **890–985** (`.sh-horizontal-*`, `.sh-hcard*`)
  - Мобильный медиа: строки **1100–1187** (внутри `@media (max-width: 768px)` — там старые правила `.sh-hcard` строки **1157–1164**)

## Что менять

### Файл `pages/index.vue` — только секция `<style>`, блок галереи

#### 1. Переписать `.sh-hcard` и связанные селекторы (строки ~909–985) **по mobile-first**

Базовые стили (мобайл):
- `.sh-hcard` — узкая высокая плитка (по референсу aqualang.pro — карточка почти на всю высоту экрана):
  - `flex-shrink: 0`
  - `width: 78vw` (на мобиле почти на весь экран, но видно "хвост" соседней справа)
  - `max-width: 380px`
  - `height: 88dvh` (высокая — почти на весь экран; через `dvh` не `vh`)
  - `min-height: 540px`
  - `display: flex; flex-direction: column`
  - `background: rgba(255,255,255,0.02)` или тонкий фон-сетка (как на aqualang.pro — `background-image: linear-gradient(...) + linear-gradient(...)` для диагональной сеточки. Если сложно — оставь тонкий тёмный фон `rgba(255,255,255,0.025)`)
  - `border: 1px solid rgba(241,230,200,0.08)`
  - `border-radius: 12px`
  - `overflow: hidden`
  - `padding: 0` (внутренние блоки сами регулируют отступы)
- `.sh-hcard-img`:
  - `width: 100%`
  - `flex: 0 0 58%` (фото занимает ~58% высоты карточки)
  - `position: relative`
  - `overflow: hidden`
- `.sh-hcard-img img`:
  - `width: 100%`
  - `height: 100%`
  - `object-fit: cover`
  - `max-width: none` (убрать старое `max-width: 480px` и `aspect-ratio` — теперь высоту задаёт родитель)
- `.sh-hcard-text`:
  - `flex: 1 1 auto`
  - `display: flex; flex-direction: column`
  - `gap: 12px`
  - `padding: 20px 24px 24px`
  - `justify-content: flex-start` (текст идёт сверху-вниз)
- `.sh-hcard-num`:
  - оставить mono, золотой, но добавить вид `01 / NATURE` — формат **в HTML менять не нужно**, оставить как есть (`01`, `02` и т.д.). Просто стиль.
  - `font-size: 12px`
  - `letter-spacing: 0.25em`
- `.sh-hcard-title`:
  - `font-size: clamp(24px, 4.5vw, 34px)` (на мобиле помельче, на десктопе крупнее — но не как сейчас 52px, потому что карточка узкая)
  - `line-height: 1.15`
  - остальное как есть (Cormorant Garamond, cream)
- `.sh-hcard-desc`:
  - `font-size: 14px`
  - `line-height: 1.55`
  - `max-width: 100%` (убрать `max-width: 400px` — карточка сама узкая)
  - **Описание НЕ обрезать** — оно короткое (1-2 строки), пусть отображается целиком
- `.sh-hcard-link`:
  - оставить как есть (gold, uppercase, hover на cream), но `margin-top: auto` чтобы прижать ко дну текстового блока

Tablet (`@media (min-width: 768px)`):
- `.sh-hcard`:
  - `width: 54vw`
  - `max-width: 500px`
  - `height: 88dvh`
  - `min-height: 620px`
- `.sh-hcard-title`:
  - `font-size: clamp(30px, 4vw, 40px)`

Desktop (`@media (min-width: 1024px)`):
- `.sh-hcard`:
  - `width: 38vw`
  - `max-width: 560px`
  - `height: 88vh`
  - `min-height: 680px`
- `.sh-hcard-text`:
  - `padding: 24px 32px 32px`
- `.sh-hcard-title`:
  - `font-size: clamp(34px, 3vw, 44px)`
- `.sh-hcard-img`:
  - `flex: 0 0 60%`

#### 2. Скорректировать соседние правила

- В `.sh-horizontal-track` (строки ~903–908):
  - `gap: 24px` (мобайл), `@media (min-width: 768px) gap: 32px`, `@media (min-width: 1024px) gap: 48px`
  - `padding: 0 14vw 0 14vw` (мобайл, чтобы первая карточка центровалась; на десктопе оставь `0 5vw 0 5vw` через медиа)
  - Не трогать `display: flex` и `will-change: transform`
- В `.sh-horizontal-sticky`:
  - `height: 100dvh` вместо `100vh` (мобильная iOS-safe)
- Удалить из основного блока `.sh-hcard` старые правила, которые конфликтуют с новыми (grid-template-columns, gap, align-items — они теперь не нужны, заменяются на flex column).
- Удалить `@media (min-width: 769px) { .sh-hcard-img { order: -1 } }` — больше не нужно.

#### 3. Мобильный медиа (строки ~1157–1164)

- Удалить старый блок `.sh-hcard { width: 85vw; grid-template-columns: 1fr; gap: 24px }` — он переписывал layout под мобилу. Теперь mobile-first, базовые стили уже мобильные.
- Удалить `.sh-hcard-img img { max-width: 100% }` оттуда же — оно теперь в базе.

### Hover-эффект (опционально, если просто)

- Оставь существующий `.sh-hcard:hover .sh-hcard-img img { scale 1.07; transition 0.5s }` — это уже норм.

### JS — не трогать вообще

- `initHorizontalScroll` сам пересчитает `maxTranslate = scrollWidth - innerWidth` под новые ширины. Менять не нужно.
- Lifecycle hooks (`onMounted/onActivated/onDeactivated/onUnmounted`) оставить как есть.

## Чего НЕ трогать

- HTML структуру карточек (5×`.sh-hcard` с `.sh-hcard-text` + `.sh-hcard-img`)
- JS скролла полностью (`initHorizontalScroll`, refs, listeners, lifecycle)
- Hero-секцию (`.sh-hero`, `.sh-stage`, `.sh-interior` и связанные)
- Навигацию, контакты, форму, footer
- Интро (jquery.ripples) и CSS-ripples мобильные
- Все стили вне блока `.sh-horizontal-*` / `.sh-hcard*`
- `MOBILE_CHECKLIST.md`, `DESIGN.md`, `AGENTS.md` — это не код-задача

## Acceptance criteria

- [ ] На мобиле (iPhone SE 375px): карточка узкая высокая, фото сверху, текст снизу, видно "хвост" следующей карточки справа, горизонтальный скролл работает
- [ ] На планшете (iPad 768px): то же, карточка шире, виден чуть больший хвост
- [ ] На десктопе (1024px+): 2–3 карточки в кадре одновременно, высокие, скролл горизонтальный плавный
- [ ] Фото в карточке заполняет верхние ~58–60% высоты (`object-fit: cover`), не сжато и не растянуто
- [ ] Текст (номер → заголовок → описание → ссылка) идёт сверху вниз, "Подробнее →" внизу карточки
- [ ] Описание отображается целиком (короткое, обрезать не надо)
- [ ] CSS написан mobile-first (база → 768 → 1024), не desktop-first
- [ ] Нет хардкода цветов и шрифтов, всё через `var(--*)`
- [ ] Нет регрессий в hero, контактах, других секциях
- [ ] Нет горизонтального overflow страницы (страница не двигается вправо пальцем/мышью на боковом тяге)
- [ ] `MOBILE_CHECKLIST.md` пройден на iPhone SE / iPad / Desktop
- [ ] `npm run build` без ошибок (если запустишь — это плюс, не обязательно)

## Edge cases / грабли

- **dvh vs vh:** обязательно `dvh` для мобильных высот — `100vh` на iOS Safari врёт.
- **Дубликаты правил `.sh-hcard-img`:** в текущем CSS два блока `.sh-hcard-img { ... }` подряд (строки 967 и 972). Когда переписываешь — оставь один, дубликат удали.
- **Старый медиа `(min-width: 769px)` для `order: -1` на `.sh-hcard-img`** — этот хак для prev-горизонтального layout, удалить полностью.
- **`gap: 8vw` в `.sh-horizontal-track`** — на мобиле 8vw это много, карточки разъезжаются. Уменьшил в задаче до 24px на мобиле.
- **Не сломай sticky:** `.sh-horizontal-sticky { position: sticky; top: 0; height: 100dvh; overflow: hidden; display: flex; align-items: center }` должен остаться. Иначе скролл-эффект развалится.

## Формат отчёта

Запиши в `tasks/TASK-vertical-cards-result.md` разделы:
- **Что сделал** (по пунктам, кратко)
- **Какие файлы тронул** (с диапазонами строк)
- **Что не сделал и почему** (если что-то спорное оставил)
- **Что Claude должен проверить руками** (визуальная сверка на разных экранах, проверка scroll inertia на тач-устройстве)
- **Вопросы Claude** (если есть)
