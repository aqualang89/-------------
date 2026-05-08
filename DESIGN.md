# Design System — Scaper's House

## Бренд

- **Ниша:** студия аквариумного дизайна
- **Настроение:** премиум, уют, глубина, "вечерний" интерьер
- **Аудитория:** владельцы квартир и домов, ценящие натуральность и премиум
- **Референсы:** собственный скрин (hero-interior.png)

## Цветовая палитра

| Токен | Значение | Использование |
|-------|----------|---------------|
| `--ink-deep` | `#0e1a24` | Основной фон страницы |
| `--ink-mid` | `#152535` | Средний тон фона, градиент |
| `--ink-soft` | `#1d3144` | Подсветка, верхняя зона |
| `--ink-shadow` | `#070f17` | Глубокие тени, виньетка |
| `--gold` | `#d9b46a` | Акцент: подзаголовки, цифры, маркеры, иконки |
| `--gold-soft` | `#e8cf95` | Курсив-акцент в заголовке |
| `--cream` | `#f1e6c8` | Основной цвет типографики, лого |
| `--cream-dim` | `rgba(241,230,200,0.65)` | Параграфы, второстепенный текст |
| `--cream-faint` | `rgba(241,230,200,0.35)` | Мелкие метки, разделители, неактивные пункты |
| `--rule` | `rgba(241,230,200,0.10)` | Границы, разделители оглавления |

### Градиент фона

```css
background:
  radial-gradient(ellipse 80% 60% at 50% 0%, #1d3144 0%, transparent 60%),
  radial-gradient(ellipse 70% 50% at 50% 100%, #070f17 0%, transparent 70%),
  linear-gradient(180deg, #152535 0%, #0e1a24 50%, #0a141d 100%);
```

## Типографика

### Шрифты

| Назначение | Семейство | Начертания |
|---|---|---|
| Заголовки, лого, акценты | **Cormorant Garamond** | 300, 400 (regular + italic), 500 |
| Параграфы, навигация | **Inter** | 300, 400, 500 |
| Метки, оглавление | **JetBrains Mono** | 400, 500 |

### Шкала размеров

| Роль | Шрифт | Размер | Line-height | Letter-spacing |
|---|---|---|---|---|
| H1 (геро-заголовок) | Cormorant Garamond 400 | clamp(64px, 7vw, 104px) | 0.96 | -0.015em |
| H1 курсив акцент | Cormorant Garamond italic 400 | clamp(64px, 7vw, 104px) | 0.96 | — |
| Подзаголовок-метка | JetBrains Mono 500 | 11px | — | 0.3em (uppercase) |
| Параграф героя | Inter 300 | 15px | 1.6 | — |
| Навигация | Cormorant Garamond 500 | 13px | — | 0.22em (uppercase) |
| Оглавление | Cormorant Garamond 400 | 14px | — | 0.05em |
| Цифры оглавления | JetBrains Mono 400 | 11px | — | — |
| Кнопка CTA | Cormorant Garamond 500 | 14px | — | 0.2em (uppercase) |
| Метки в углах | JetBrains Mono 400 | 10-11px | — | 0.25-0.3em |

## Отступы и сетка

- Базовый юнит: `8px`
- Контейнер: `1440px` max-width, центровка
- Горизонтальные padding: `80px` (desktop), `48px` (tablet), `24px` (mobile)
- Hero: `100vh` минимум
- Геро-сетка: `1fr minmax(480px, 620px) 1fr`

## Компоненты

### Button (Outline / CTA)

```
padding: 16px 40px
border-radius: 999px (pill)
background: transparent
border: 1px solid var(--cream)
color: var(--cream)
font: Cormorant Garamond 500, 14px, uppercase, letter-spacing 0.2em
hover: background var(--cream), color var(--ink-deep)
transition: 300ms ease
```

### Nav Link

```
font: Cormorant Garamond 500, 13px, uppercase, letter-spacing 0.22em
color: var(--cream-dim)
hover: color var(--cream)
transition: 300ms ease
active/quiz: color var(--gold) + gold dot marker
```

### TOC Item

```
font: Cormorant Garamond 400, 14px
color: var(--cream-dim)
border-bottom: 1px solid var(--rule)
padding: 12px 0
hover: color var(--cream)
number: JetBrains Mono 400, 11px, color var(--gold)
```

## Запреты

- НЕ использовать градиенты на типографике
- НЕ использовать капслок для кнопок (только uppercase через CSS)
- НЕ использовать шрифты вне указанных
- НЕ использовать цвета вне палитры
- НЕ использовать тени сильнее 0 30px 40px (кроме drop-shadow аквариума)

## Адаптив

| Breakpoint | Ширина | Изменения |
|------------|--------|-----------|
| Desktop | ≥1440px | Полный макет |
| Tablet | 768–1439px | Пропорциональное сжатие, padding 48px |
| Mobile | < 768px | Одна колонка, H1 → 56px, оглавление под текстом |

## Специфика проекта

- Интро: jquery.ripples (сохраняется), играет 1 раз, флаг в localStorage
- Hero: вырезанное фото интерьера (hero-interior.png) + CSS-фон верха
- Анимации: пузыри в аквариуме (CSS), мерцание лампы (CSS), дыхание тени заголовка
- Фон: слоистый CSS-градиент + радиальные подсветки
