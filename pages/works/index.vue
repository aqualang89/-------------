<template>
  <div class="works-wrap">
    <header class="works-head">
      <h1>Наши работы</h1>
      <p class="works-sub">Аквариумы и акваскейпы, которые мы собрали и обслуживаем. Кейсы студии Рипарий.</p>
    </header>

    <div v-if="works.length" class="works-grid">
      <NuxtLink v-for="w in works" :key="w.id" :to="`/works/${w.slug}`" class="work-card">
        <div class="work-img">
          <img v-if="w.cover_url" :src="cldImage(w.cover_url, { w: 600 })" :alt="w.title" loading="lazy" decoding="async">
          <div v-else class="work-no-photo">🐢</div>
        </div>
        <h3 class="work-title">{{ w.title }}</h3>
      </NuxtLink>
    </div>

    <div v-else class="works-empty">
      <p>Скоро здесь появятся наши работы. Загляни чуть позже 🌿</p>
    </div>
  </div>
</template>

<script setup>
const { data } = await useFetch('/api/works', { key: 'works-list' })
const works = computed(() => data.value?.works || [])

usePageMeta({
  title: 'Наши работы',
  description: 'Портфолио студии аквадизайна Рипарий в Калининграде: аквариумы, акваскейпы, оформление под ключ. Реальные кейсы наших работ.'
})
</script>

<style scoped>
.works-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 60px;
  color: var(--cream);
}
.works-head {
  margin-bottom: 40px;
}
.works-head h1 {
  font-family: var(--font-serif);
  font-size: 2.4rem;
  margin-bottom: 12px;
}
.works-sub {
  color: var(--cream-dim);
  max-width: 640px;
  line-height: 1.6;
}
.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 28px;
}
.work-card {
  background: var(--ink-mid);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  color: var(--cream);
  transition: transform 0.2s, box-shadow 0.2s;
}
.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
}
.work-img {
  aspect-ratio: 4 / 3;
  background: var(--ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.work-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.work-no-photo {
  font-size: 2.4rem;
  opacity: 0.5;
}
.work-title {
  padding: 18px 18px 22px;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  font-weight: 500;
}
.works-empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--cream-dim);
  font-size: 1.1rem;
}
@media (max-width: 767px) {
  .works-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .works-head h1 {
    font-size: 1.9rem;
  }
}
</style>
