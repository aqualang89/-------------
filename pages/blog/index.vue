<template>
  <div class="blog-wrap">
    <header class="blog-head">
      <h1>Блог</h1>
      <p class="blog-sub">Авторские статьи студии Рипарий: акваскейп, уход за аквариумом, разборы и заметки из практики.</p>
    </header>

    <div v-if="articles.length" class="blog-list">
      <NuxtLink v-for="a in articles" :key="a.id" :to="`/blog/${a.slug}`" class="post-card">
        <div class="post-img">
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
      <p>Скоро здесь появятся первые статьи. Загляни чуть позже 🌿</p>
    </div>
  </div>
</template>

<script setup>
const { data } = await useFetch('/api/articles', { key: 'articles-list' })
const articles = computed(() => data.value?.articles || [])

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
  aspect-ratio: 4 / 3;
  background: var(--ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
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
  .post-card {
    grid-template-columns: 1fr;
  }
  .post-body {
    padding: 0 18px 20px;
  }
}
</style>
