<template>
  <article class="article-wrap">
    <nav class="breadcrumbs">
      <NuxtLink to="/blog">Блог</NuxtLink>
      <span> / {{ article.title }}</span>
    </nav>

    <h1 class="article-h1">{{ article.title }}</h1>
    <span class="article-date">{{ fmtDate(article.published_at || article.created_at) }}</span>

    <div v-if="article.cover_url" class="article-cover">
      <img :src="cldImage(article.cover_url, { w: 1200 })" :alt="article.title" fetchpriority="high" decoding="async">
    </div>

    <div class="article-body">
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>

    <div class="article-back">
      <NuxtLink to="/blog">← Все статьи</NuxtLink>
    </div>
  </article>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

const { data: article, error } = await useFetch(`/api/articles/${slug}`, { key: `article-${slug}` })
if (error.value || !article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Статья не найдена' })
}

function fmtDate (d) {
  if (!d) return ''
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
}

const paragraphs = computed(() =>
  (article.value.content || '').split(/\n+/).map(s => s.trim()).filter(Boolean)
)

usePageMeta({
  title: article.value.title,
  description: article.value.excerpt || (article.value.content || '').slice(0, 200),
  ogImage: article.value.cover_url || undefined,
  jsonLd: [{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.value.title,
    image: article.value.cover_url ? [article.value.cover_url] : undefined,
    datePublished: article.value.published_at || article.value.created_at,
    author: { '@type': 'Organization', name: 'Рипарий' },
    publisher: { '@type': 'Organization', name: 'Рипарий' }
  }]
})
</script>

<style scoped>
.article-wrap {
  max-width: 760px;
  margin: 0 auto;
  padding: 100px 20px 60px;
  color: var(--cream);
}
.breadcrumbs {
  margin-bottom: 20px;
  color: var(--cream-dim);
  font-size: 0.95rem;
}
.breadcrumbs a {
  color: var(--gold);
  text-decoration: none;
}
.article-h1 {
  font-family: var(--font-serif);
  font-size: 2.3rem;
  line-height: 1.2;
  margin-bottom: 10px;
}
.article-date {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--cream-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 28px;
}
.article-cover {
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 32px;
}
.article-cover img {
  width: 100%;
  display: block;
}
.article-body {
  font-size: 1.12rem;
  line-height: 1.8;
  color: var(--cream);
}
.article-body p {
  margin-bottom: 20px;
}
.article-back {
  margin-top: 40px;
}
.article-back a {
  color: var(--gold);
  text-decoration: none;
}
@media (max-width: 767px) {
  .article-h1 { font-size: 1.8rem; }
  .article-body { font-size: 1.05rem; }
}
</style>
