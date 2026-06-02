<template>
  <div class="blog-wrap">
    <header class="blog-head">
      <h1>{{ activeCat ? activeCat.title : 'Блог' }}</h1>
      <p class="blog-sub">Авторские статьи студии Рипарий: акваскейп, уход за аквариумом, разборы и заметки из практики.</p>
    </header>

    <nav v-if="visibleCategories.length" class="blog-filters" aria-label="Категории блога">
      <button class="filter-pill" :class="{ active: !activeCategory }" @click="selectCat(null)">Все статьи</button>
      <button
        v-for="c in visibleCategories"
        :key="c.slug"
        class="filter-pill"
        :class="{ active: activeCategory === c.slug }"
        @click="selectCat(c.slug)"
      >
        {{ c.label }}<span class="pill-cnt">{{ counts[c.slug] }}</span>
      </button>
    </nav>

    <div v-if="filtered.length" class="blog-list">
      <NuxtLink v-for="a in filtered" :key="a.id" :to="`/blog/${a.slug}`" class="post-card">
        <div class="post-img">
          <span v-if="a.category" class="post-cat-badge">{{ catLabel(a.category) }}</span>
          <img v-if="a.cover_url" :src="cldImage(a.cover_url, { w: 600 })" :alt="a.title" loading="lazy" decoding="async">
          <div v-else class="post-no-photo">🌿</div>
        </div>
        <div class="post-body">
          <span class="post-date">{{ fmtDate(a.published_at || a.created_at) }}</span>
          <h3 class="post-title">{{ a.title }}</h3>
          <p v-if="a.excerpt" class="post-excerpt">{{ a.excerpt }}</p>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="blog-empty">
      <p v-if="activeCategory">В этом разделе пока нет статей. <button class="link-btn" @click="selectCat(null)">Показать все</button></p>
      <p v-else>Скоро здесь появятся первые статьи. Загляни чуть позже 🌿</p>
    </div>
  </div>
</template>

<script setup>
import { BLOG_CATEGORIES, blogCategory } from '~/utils/blogCategories.js'

const route = useRoute()
const router = useRouter()
const { data } = await useFetch('/api/articles', { key: 'articles-list' })
const articles = computed(() => data.value?.articles || [])

const counts = computed(() => {
  const m = {}
  for (const a of articles.value) if (a.category) m[a.category] = (m[a.category] || 0) + 1
  return m
})
const visibleCategories = computed(() => BLOG_CATEGORIES.filter(c => counts.value[c.slug]))
const activeCategory = computed(() => {
  const q = route.query.category
  return BLOG_CATEGORIES.some(c => c.slug === q) ? q : null
})
const activeCat = computed(() => activeCategory.value ? blogCategory(activeCategory.value) : null)
const filtered = computed(() =>
  activeCategory.value ? articles.value.filter(a => a.category === activeCategory.value) : articles.value
)

function selectCat (slug) {
  router.push({ query: slug ? { category: slug } : {} })
}
function catLabel (slug) {
  return blogCategory(slug)?.label || ''
}
function fmtDate (d) {
  if (!d) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

usePageMeta({
  title: 'Блог',
  description: 'Авторские статьи студии аквадизайна Рипарий: акваскейп, уход за аквариумом, растения, оборудование, разборы из практики.'
})
</script>

<style scoped>
.blog-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 100px 20px 60px;
  color: var(--cream);
}
.blog-head {
  margin-bottom: 40px;
}
.blog-head h1 {
  font-family: var(--font-serif);
  font-size: 2.4rem;
  margin-bottom: 12px;
}
.blog-sub {
  color: var(--cream-dim);
  max-width: 640px;
  line-height: 1.6;
}
.blog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 36px;
}
.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: transparent;
  color: var(--cream-dim);
  font-family: var(--font-sans);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.filter-pill:hover {
  color: var(--cream);
  border-color: var(--gold-soft);
}
.filter-pill.active {
  background: var(--gold);
  border-color: var(--gold);
  color: var(--ink-deep);
  font-weight: 500;
}
.pill-cnt {
  font-size: 12px;
  opacity: 0.7;
}
.filter-pill.active .pill-cnt {
  opacity: 0.85;
}
.link-btn {
  background: none;
  border: none;
  color: var(--gold-soft);
  cursor: pointer;
  font: inherit;
  text-decoration: underline;
  padding: 0;
}
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.post-card {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 20px;
  background: var(--ink-mid);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  color: var(--cream);
  transition: transform 0.2s, box-shadow 0.2s;
}
.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}
.post-img {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.post-cat-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 4px 11px;
  border-radius: 999px;
  background: var(--gold);
  color: var(--ink-deep);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.post-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-no-photo {
  font-size: 2rem;
  opacity: 0.5;
}
.post-body {
  padding: 20px 22px 20px 0;
}
.post-date {
  font-family: var(--font-sans);
  font-size: 12px;
  color: var(--cream-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.post-title {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 500;
  margin: 8px 0 10px;
}
.post-excerpt {
  color: var(--cream-dim);
  line-height: 1.55;
}
.blog-empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--cream-dim);
  font-size: 1.1rem;
}
@media (max-width: 767px) {
  .blog-head h1 { font-size: 1.9rem; }
  .blog-filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    margin-left: -20px;
    margin-right: -20px;
    padding: 0 20px 4px;
  }
  .blog-filters::-webkit-scrollbar { display: none; }
  .post-card {
    grid-template-columns: 1fr;
  }
  .post-body {
    padding: 0 18px 20px;
  }
}
</style>
