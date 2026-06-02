// Рубрикатор блога. Единый источник для фронта (фильтры, бейджи) и сервера (валидация).
// Список фиксированный — менять тут. slug идёт в БД (articles.category).
export const BLOG_CATEGORIES = [
  { slug: 'napravleniya', label: 'Направления', title: 'Направления в аквариумистике' },
  { slug: 'filtraciya',   label: 'Фильтрация',  title: 'Фильтрация' },
  { slug: 'co2',          label: 'CO₂',          title: 'CO₂ в аквариуме' },
  { slug: 'osveschenie',  label: 'Освещение',   title: 'Освещение аквариума' },
  { slug: 'zapusk',       label: 'Запуск',       title: 'Запуск аквариума' },
  { slug: 'zhivnost',     label: 'Живность',     title: 'Живность: рыбы, креветки, улитки' },
  { slug: 'bolezni',      label: 'Болезни',      title: 'Болезни и проблемы' }
]

export const BLOG_CATEGORY_SLUGS = BLOG_CATEGORIES.map(c => c.slug)

export function blogCategory (slug) {
  return BLOG_CATEGORIES.find(c => c.slug === slug) || null
}
