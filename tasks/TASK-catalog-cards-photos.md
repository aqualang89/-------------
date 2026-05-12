# TASK-catalog-cards-photos: 4 правки — админка, каталог, галерея

**Автор:** Claude
**Исполнитель:** Kimi
**Дата постановки:** 2026-05-12
**Приоритет:** обычный

⚠️ Точечные правки. **Ничего лишнего не трогать** — Макс об этом просит каждый раз.

---

## Цель

Четыре задачи:
1. **Админка → раздел "Товары" → поиск и категории:** сейчас поиск — гигантская вертикальная колонка, выглядит ужасно. Сделать поиск в одну строку (как в каталоге сайта). Добавить кнопку "Скрыть/Показать" категории (как уже есть в каталоге сайта).
2. **Категория "Морская аквариумистика" — скрыть полностью** из каталога и админки, а также не импортировать её при загрузке Excel.
3. **Карточки галереи на главной (`.sh-hcard`)** переделать в premium-стиль: фото на всю карточку как фон, текст поверх с тёмным градиентом снизу. Hover-зум убрать совсем.
4. **Загрузка фото в админке падает с "Ошибка загрузки фото"** (alert) — без деталей. Улучшить error handling: показывать реальный текст ошибки с сервера, чтобы Макс увидел причину (Cloudinary env / превышен размер / 403 / etc).

## Что прочитать перед стартом

- `AGENTS.md`, `STATE.md`, `DESIGN.md`, `MOBILE_CHECKLIST.md`
- `pages/admin.vue`:
  - строки 56–135 — секция "Товары" с поиском, фильтром по категориям, гридом товаров
  - строки 615–645 — `uploadPhoto(e, productId)` — функция загрузки фото
  - найди стили `.filters`, `.admin-cat-tree`, `.cat-item` через grep
- `pages/catalog/index.vue`:
  - строки 13–18 — `sidebar-toggle` кнопка скрыть/показать — взять оттуда логику
  - строки 100–104 — `sidebarOpen = ref(true)` — взять оттуда state
- `pages/index.vue`:
  - блок `.sh-hcard*` (строки 909+) — переделка premium card
  - `<template>` блок карточек (строки 62–122) — там 5×`.sh-hcard` структура
- `server/api/categories.get.js` — фильтр категорий (для пункта 2)
- `server/api/products.get.js` — фильтр товаров по hidden категориям (для пункта 2)
- `server/api/catalog-upload.post.js` — Excel-импорт (для пункта 2 — skip морской)
- `server/api/upload-image.post.js` — где реальная серверная ошибка возникает (для пункта 4)

## Что менять

### Пункт 1: Админка — поиск в одну строку + кнопка скрыть категории

Файл: `pages/admin.vue`

**1.1. HTML структура секции "Товары" (строки 58–91):**

Текущее:
```vue
<section class="admin-section">
  <h2>Товары</h2>
  <div class="filters">
    <input v-model="search" placeholder="Поиск..." @input="fetchProducts">
    <div class="admin-cat-tree">
      ...категории...
    </div>
  </div>
```

Заменить на (по аналогии с `pages/catalog/index.vue`):
```vue
<section class="admin-section">
  <h2>Товары</h2>
  <input
    v-model="search"
    placeholder="Поиск по названию или артикулу..."
    class="search-input"
    @input="fetchProducts"
  >
  <div class="admin-cats-wrap">
    <div class="admin-cats-header">
      <h3>Категории</h3>
      <button class="sidebar-toggle" @click="adminCatsOpen = !adminCatsOpen">
        {{ adminCatsOpen ? 'Скрыть' : 'Показать' }}
      </button>
    </div>
    <div v-show="adminCatsOpen" class="admin-cat-tree">
      <div class="cat-item" :class="{ active: filterCategory === '' }" @click="filterCategory = ''; fetchProducts()">
        <span class="cat-spacer"></span>
        <span class="cat-name">Все категории</span>
      </div>
      <template v-for="c in adminVisibleCats" :key="c.id">
        <!-- ...существующий блок без изменений... -->
      </template>
    </div>
  </div>
```

В `<script setup>` добавь:
```js
const adminCatsOpen = ref(true)
```

**1.2. CSS (внутри `<style scoped>` или общего блока):**
- Найди стили `.filters` (там скорее всего `display: grid` или `flex-direction: column` — это и есть причина вертикальной "колонки" поиска). Убрать/переписать.
- Добавь стили для `.admin-cats-wrap` и `.admin-cats-header`:
```css
.admin-section .search-input {
  width: 100%;
  max-width: 480px;
  padding: 10px 14px;
  margin: 12px 0 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(241,230,200,0.12);
  border-radius: 8px;
  color: var(--cream);
  font-family: var(--font-sans);
  font-size: 14px;
}
.admin-section .search-input::placeholder {
  color: var(--cream-faint);
}
.admin-cats-wrap {
  margin-bottom: 20px;
}
.admin-cats-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.admin-cats-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--cream-dim);
  font-family: var(--font-sans);
  font-weight: 500;
}
.sidebar-toggle {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid rgba(241,230,200,0.15);
  border-radius: 6px;
  color: var(--cream-dim);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font-sans);
}
.sidebar-toggle:hover {
  border-color: var(--gold);
  color: var(--gold);
}
```

### Пункт 2: Скрыть категорию "Морская аквариумистика"

Категория должна:
- Не отображаться в каталоге сайта (`pages/catalog/index.vue`)
- Не отображаться в админке (`pages/admin.vue` фильтр + каскадные селекты)
- Пропускаться при импорте Excel (`server/api/catalog-upload.post.js`)
- Товары этой категории не показываться на сайте

**Стратегия:** хардкодом игнорировать по slug. Это самое простое и не требует миграции БД. Slug у категории скорее всего `morskaya-akvariumistika` или похожее. Сначала проверь через grep:
```bash
grep -ri "морск\|morsk" server/ pages/ seed-catalog.mjs --include="*.{js,mjs,vue,ts}"
```

После проверки:

**2.1. `server/api/categories.get.js`:**
Перед возвратом дерева — отфильтровать топ-уровневые узлы где `name` начинается со слова "Морск" (case-insensitive) или slug соответствует. Точное имя в БД — найди через grep / посмотри в эталонном дереве в `seed-catalog.mjs`.

```js
// constants
const HIDDEN_CATEGORY_SLUGS = ['morskaya-akvariumistika'] // подставь реальный slug
const HIDDEN_CATEGORY_NAME_PATTERNS = [/^морск/i]
// фильтрация
const visibleTree = tree.filter(node =>
  !HIDDEN_CATEGORY_SLUGS.includes(node.slug) &&
  !HIDDEN_CATEGORY_NAME_PATTERNS.some(p => p.test(node.name))
)
```

**2.2. `server/api/products.get.js`:**
Добавь WHERE-фильтр для скрытия товаров привязанных к скрытым категориям. Можно через подзапрос или JOIN:
```js
// получить ID скрытых категорий
const { data: hiddenCats } = await supabase
  .from('categories')
  .select('id')
  .or('slug.eq.morskaya-akvariumistika,name.ilike.морск%')
const hiddenIds = (hiddenCats || []).map(c => c.id)

// в запрос продуктов добавить .not('category_id', 'in', `(${hiddenIds.join(',')})`)
```

Если supabase syntax не позволяет — фильтруй на JS после получения.

**2.3. `server/api/catalog-upload.post.js`:**
В цикле обработки строк Excel — пропускать строки которые попадают в категорию "Морская*":
```js
if (/^морск/i.test(categoryName)) {
  skipped++
  continue
}
```

Точное место — найди где парсится цепочка категорий и принимается решение какую категорию назначить.

### Пункт 3: Премиум-карточки галереи (фото на всю + текст поверх + убрать zoom)

Файл: `pages/index.vue`

**3.1. HTML структура карточек НЕ меняется** (5×`.sh-hcard` с детьми остаётся как есть — для SEO и lazy-load `<img>`).

**3.2. CSS карточек переписать (строки ~909–987):**

Базовый стиль:
```css
.sh-hcard {
  flex-shrink: 0;
  width: 78vw;
  max-width: 380px;
  height: 88dvh;
  min-height: 540px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 12px;
  overflow: hidden;
  background: #0e1a24;
}
.sh-hcard-img {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.sh-hcard-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* zoom больше не нужен — Макс попросил убрать */
}
.sh-hcard::after {
  /* градиент-затемнение снизу для читаемости текста */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.88) 0%,
    rgba(0, 0, 0, 0.55) 30%,
    rgba(0, 0, 0, 0.15) 55%,
    transparent 75%
  );
  z-index: 1;
  pointer-events: none;
}
.sh-hcard-text {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px;
}
.sh-hcard-num {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.3em;
}
.sh-hcard-title {
  font-family: var(--font-serif);
  font-size: clamp(28px, 5vw, 38px);
  font-weight: 400;
  color: var(--cream);
  line-height: 1.1;
  margin: 0;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}
.sh-hcard-desc {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 300;
  line-height: 1.5;
  color: rgba(241, 230, 200, 0.85);
  margin: 0;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.5);
}
.sh-hcard-link {
  display: inline-block;
  margin-top: 6px;
  font-family: var(--font-serif);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  text-decoration: none;
  transition: color 0.3s ease, transform 0.3s ease;
}
.sh-hcard-link:hover {
  color: var(--cream);
}
```

Tablet (`@media (min-width: 768px)`):
```css
.sh-hcard {
  width: 54vw;
  max-width: 500px;
  min-height: 620px;
}
.sh-hcard-text {
  padding: 28px;
}
.sh-hcard-title {
  font-size: clamp(32px, 4vw, 44px);
}
```

Desktop (`@media (min-width: 1024px)`):
```css
.sh-hcard {
  width: 38vw;
  max-width: 560px;
  height: 88vh;
  min-height: 680px;
}
.sh-hcard-text {
  padding: 32px 36px 36px;
}
.sh-hcard-title {
  font-size: clamp(36px, 3.2vw, 48px);
}
```

**3.3. Удалить старые правила:**
- `.sh-hcard-img { width: 100%; flex: 0 0 58%; ... }` — больше не нужно
- `.sh-hcard:hover .sh-hcard-img img { transform: scale(1.07) }` — Макс попросил убрать zoom
- Любые `transition: transform` на `.sh-hcard-img img` — больше не нужно
- `.sh-hcard { background: rgba(255,255,255,0.025); border: ... }` — фон карточки теперь сама фотография, лёгкий border можно оставить или убрать (предлагаю убрать — premium look)

**Важно:** убедись что `<img>` тег с `loading="lazy"` остаётся и работает. SEO и performance — критично.

### Пункт 4: Реальная ошибка при загрузке фото в админке

Файл: `pages/admin.vue`, функция `uploadPhoto` (строки ~615–645).

Текущий код:
```js
if (!res.ok) {
  alert('Ошибка загрузки фото')
  return
}
```

Заменить на:
```js
if (!res.ok) {
  let errorText = `Ошибка загрузки фото (HTTP ${res.status})`
  try {
    const errBody = await res.json()
    if (errBody?.statusMessage || errBody?.message) {
      errorText += ': ' + (errBody.statusMessage || errBody.message)
    }
  } catch (e) {
    try {
      const errText = await res.text()
      if (errText) errorText += ': ' + errText.slice(0, 200)
    } catch (e2) {}
  }
  alert(errorText)
  return
}
```

То же самое для второго `fetch` (`/api/product-photos`) — улучшить error handling если он есть.

Опционально: в `server/api/upload-image.post.js` добавить более детальные ошибки. Сейчас при превышении лимита Vercel вернёт 413 (Payload Too Large) — это поможет диагностике.

В самом начале handler'а можно добавить проверку:
```js
if (file.data.length > 4 * 1024 * 1024) {
  throw createError({
    statusCode: 413,
    message: `Файл слишком большой (${(file.data.length / 1024 / 1024).toFixed(1)}MB). Максимум 4MB.`
  })
}
```

И в catch блоке возвращать реальную ошибку Cloudinary:
```js
} catch (err) {
  console.error('Cloudinary upload error:', err)
  throw createError({
    statusCode: 500,
    statusMessage: 'Cloudinary: ' + (err?.message || 'неизвестная ошибка')
  })
}
```

## Чего НЕ трогать

- HTML структуру карточек галереи (5×`.sh-hcard` с `.sh-hcard-text` + `.sh-hcard-img`) — только CSS
- Логику горизонтального скролла галереи (`initHorizontalScroll`, refs)
- `/api/upload-image` стрим-логику (только error handling улучшить)
- Всё остальное в админке (импорт Excel UI, заказы, каскадные селекты по другим категориям)
- Каталог сайта (`pages/catalog/index.vue`) — только фильтр категорий через API
- Hero, аквариум, навигацию, кнопку "Назад", чат-виджет
- Документацию (STATE.md, DESIGN.md, AGENTS.md, MOBILE_CHECKLIST.md)
- Корзину, заказы, страницу товара

## Acceptance criteria

- [ ] В админке "Товары" поиск — обычное поле в одну строку (не вертикальная колонка)
- [ ] В админке есть кнопка "Скрыть"/"Показать" категории, скрывает блок категорий
- [ ] Категория с именем начинающимся на "Морск" не отображается ни в сайдбаре каталога сайта, ни в фильтре админки, ни в каскадных селектах продукта
- [ ] Товары привязанные к категории "Морск*" не показываются на сайте
- [ ] При повторной загрузке Excel с морскими товарами — они пропускаются (увеличивается счётчик skipped)
- [ ] Карточки галереи на главной выглядят premium: фото на всю карточку как фон, тёмный градиент снизу, текст (номер + заголовок + описание + ссылка) поверх в нижней части
- [ ] Hover-зум на фото убран
- [ ] На разных экранах (375/768/1024) карточки выглядят корректно
- [ ] При ошибке загрузки фото в админке alert показывает реальный код и текст ошибки (например "HTTP 500: Cloudinary: invalid api_key")
- [ ] `npm run build` без ошибок
- [ ] Нет ошибок в консоли браузера на главной, каталоге, админке

## Edge cases / грабли

- **Точное название/slug категории "Морская"** — найди через `grep -ri "морск\|morsk" .` или посмотри в `seed-catalog.mjs` эталонное дерево. Не угадывай.
- **Existing товары в БД** — даже если хардкодом скрываем категорию, в БД могут остаться товары. Они просто не будут отображаться (что и нужно). Удалять их не надо.
- **Кешированные `useFetch`** — после изменения API категорий проверь что Nuxt не отдаёт кеш. Можно добавить `key` или `watchEffect` (но скорее всего сработает hard refresh).
- **Cloudinary error при отсутствии config** — если env не настроены, `cloudinary.uploader.upload_stream` падает с конкретной ошибкой. Это и хотим видеть в alert'е.
- **`text-shadow` на заголовке** — не перегружай (0 2px 12px max), иначе будет некрасиво на светлых фото. Если на тёмных фото и так читается — убери тень.

## Формат отчёта

`tasks/TASK-catalog-cards-photos-result.md` — стандартный формат:
- **Что сделал** по 4 пунктам
- **Какие файлы тронул** с диапазонами строк
- **Что НЕ делал** (если что-то спорное оставил)
- **Что Claude должен проверить:**
  - Загрузить фото в админке → увидеть реальный текст ошибки в alert'е
  - Открыть каталог → нет категории "Морская*"
  - Открыть админку → поиск нормальный, кнопка скрыть категории работает
  - Открыть главную → карточки с фото на фон + градиентом
- **Вопросы Claude** если возникнут
