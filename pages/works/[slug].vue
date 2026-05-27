<template>
  <div class="work-wrap">
    <nav class="breadcrumbs">
      <NuxtLink to="/works">Наши работы</NuxtLink>
      <span> / {{ work.title }}</span>
    </nav>

    <h1 class="work-h1">{{ work.title }}</h1>

    <div v-if="work.cover_url" class="work-cover">
      <img :src="cldImage(work.cover_url, { w: 1200 })" :alt="work.title" fetchpriority="high" decoding="async">
    </div>

    <div v-if="paragraphs.length" class="work-desc">
      <p v-for="(p, i) in paragraphs" :key="i">{{ p }}</p>
    </div>

    <div v-if="gallery.length" class="work-gallery">
      <button
        v-for="(url, i) in gallery"
        :key="i"
        type="button"
        class="gallery-item"
        @click="lightbox = url"
      >
        <img :src="cldImage(url, { w: 500 })" :alt="`${work.title} — фото ${i + 1}`" loading="lazy" decoding="async">
      </button>
    </div>

    <div class="work-back">
      <NuxtLink to="/works">← Все работы</NuxtLink>
    </div>

    <div v-if="lightbox" class="lightbox" @click.self="lightbox = null">
      <button type="button" class="lightbox-close" @click="lightbox = null" aria-label="Закрыть">×</button>
      <img :src="cldImage(lightbox, { w: 1600 })" :alt="work.title" class="lightbox-img" decoding="async">
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

const { data: work, error } = await useFetch(`/api/works/${slug}`, { key: `work-${slug}` })
if (error.value || !work.value) {
  throw createError({ statusCode: 404, statusMessage: 'Работа не найдена' })
}

const lightbox = ref(null)

const paragraphs = computed(() =>
  (work.value.description || '').split(/\n+/).map(s => s.trim()).filter(Boolean)
)
const gallery = computed(() => Array.isArray(work.value.photos) ? work.value.photos.filter(Boolean) : [])

onUnmounted(() => { if (typeof document !== 'undefined') document.body.style.overflow = '' })
watch(lightbox, (v) => {
  if (typeof document !== 'undefined') document.body.style.overflow = v ? 'hidden' : ''
})

usePageMeta({
  title: work.value.title,
  description: (work.value.description || '').slice(0, 200) || `${work.value.title} — работа студии аквадизайна Рипарий, Калининград.`,
  ogImage: work.value.cover_url || undefined
})
</script>

<style scoped>
.work-wrap {
  max-width: 900px;
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
.work-h1 {
  font-family: var(--font-serif);
  font-size: 2.2rem;
  margin-bottom: 24px;
}
.work-cover {
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 28px;
}
.work-cover img {
  width: 100%;
  display: block;
}
.work-desc {
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--cream-dim);
  margin-bottom: 36px;
}
.work-desc p {
  margin-bottom: 16px;
}
.work-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 40px;
}
.gallery-item {
  padding: 0;
  border: none;
  background: var(--ink-soft);
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  aspect-ratio: 4 / 3;
}
.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}
.gallery-item:hover img {
  transform: scale(1.04);
}
.work-back a {
  color: var(--gold);
  text-decoration: none;
}
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  touch-action: pinch-zoom;
}
.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 26px;
  cursor: pointer;
  line-height: 1;
}
@media (max-width: 767px) {
  .work-h1 { font-size: 1.7rem; }
  .work-gallery { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
