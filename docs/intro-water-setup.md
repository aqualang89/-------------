# Конфигурация интро с водой (jquery.ripples)

## Описание
Интро-заставка с интерактивным эффектом воды на фоне. При движении мыши по фону создаются круги на воде (ripple). Вход на сайт — только по клику в центральной зоне.

## Зависимости
- jQuery 3.7.1 (CDN)
- jquery.ripples 0.5.3 (CDN)

## Файлы

### pages/index.vue
Шаблон интро:
```html
<div id="intro-overlay">
  <div class="intro-center" title="Кликните, чтобы войти"></div>
</div>
```

Скрипт (в `onMounted`):
```javascript
// Гарантированная последовательная загрузка
function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = res
    s.onerror = rej
    document.head.appendChild(s)
  })
}

await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js')
await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js')

// Инициализация (только на десктопе)
const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window
if (!isMobile && typeof $ !== 'undefined' && $.fn.ripples) {
  $(overlay).ripples({
    resolution: 512,    // разрешение WebGL-текстуры
    dropRadius: 20,     // радиус капли
    perturbance: 0.04,  // сила искажения
    interactive: true   // реакция на мышь
  })
}

// Закрытие интро
function closeIntro() {
  overlay.classList.add('hidden')
  document.body.style.overflow = ''
  try { $(overlay).ripples('destroy') } catch (e) {}
  setTimeout(() => overlay.remove(), 700)
}

// Клик ТОЛЬКО на центральную зону
const introCenter = document.querySelector('.intro-center')
if (introCenter) {
  introCenter.addEventListener('click', (e) => {
    e.stopPropagation()
    closeIntro()
  })
}
```

### assets/css/main.css
```css
#intro-overlay {
  position: fixed;
  inset: 0;
  background: url('/img/aquarium-bottom.jpg') center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  transition: opacity 0.6s ease, transform 0.6s ease;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
}

#intro-overlay.hidden {
  opacity: 0;
  transform: scale(1.03);
  pointer-events: none;
}

/* Центральная кликабельная зона */
.intro-center {
  position: relative;
  z-index: 2;
  width: 320px;
  height: 200px;
  cursor: pointer;
  border-radius: 20px;
  transition: background 0.2s ease;
}

.intro-center:hover {
  background: rgba(255,255,255,0.04);
}
```

## Параметры ripples

| Параметр | Значение | Описание |
|----------|----------|----------|
| `resolution` | 512 | Разрешение WebGL-текстуры (больше = плавнее, но медленнее) |
| `dropRadius` | 20 | Радиус капли в пикселях |
| `perturbance` | 0.04 | Сила искажения (0 = нет эффекта) |
| `interactive` | true | Реакция на движение мыши |

## Мобильная версия
На устройствах с `width <= 768` или `'ontouchstart' in window` эффект воды отключается — показывается статичный фон. Вход на сайт по тапу в центральной зоне работает.

## Ассеты
- `public/img/aquarium-bottom.jpg` — фон интро (должен быть в public для статического сервинга)

## Известные проблемы и решения
1. **Ripples не загружается** — проверить CDN-ссылки, убедиться что jQuery загружен ДО ripples
2. **На Vercel не работает** — убедиться что `aquarium-bottom.jpg` в `public/img/`, не в корне `img/`
3. **Медленно на слабом железе** — уменьшить `resolution` до 256

## Альтернативы (если ripples перестанет работать)
- **PixiJS + DisplacementFilter** — более сложный, но гибкий подход (см. историю в git)
- **WebGL ripple shader** — максимальный контроль, но требует написания шейдеров
- **CSS-анимация** — просто пульсация фона, без интерактива
