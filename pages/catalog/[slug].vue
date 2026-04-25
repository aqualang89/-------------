<template>
  <div class="product-wrap">
    <div v-if="pending" class="product-loading">Загрузка...</div>

    <div v-else-if="product" class="product-inner">
      <nav class="breadcrumbs">
        <NuxtLink to="/catalog">Каталог</NuxtLink>
        <span v-if="product.categories"> / {{ product.categories.name }}</span>
        <span> / {{ product.name }}</span>
      </nav>

      <div class="product-main">
        <div class="product-gallery">
          <div class="main-photo" @mousemove="onZoom" @mouseleave="offZoom">
            <img
              ref="mainImg"
              :src="currentPhoto || '/img/no-photo.png'"
              :alt="product.name"
              :style="zoomStyle"
            >
          </div>
          <div v-if="photos.length > 1" class="thumbs">
            <img
              v-for="(ph, i) in photos"
              :key="ph.id"
              :src="ph.url"
              :class="{ active: currentIndex === i }"
              @click="currentIndex = i"
            >
          </div>
        </div>

        <div class="product-info">
          <h1>{{ product.name }}</h1>
          <p class="product-article">Артикул: {{ product.article }}</p>
          <div class="product-price-wrap">
            <span class="product-price">{{ product.price.toLocaleString() }} ₽</span>
            <span v-if="product.old_price" class="product-old-price">{{ product.old_price.toLocaleString() }} ₽</span>
          </div>
          <div v-if="product.description" class="product-desc">
            <h3>Описание</h3>
            <p>{{ product.description }}</p>
          </div>
          <button class="product-cta" @click="scrollToContacts">
            Заказать консультацию
          </button>
        </div>
      </div>
    </div>

    <div v-else class="product-not-found">
      <h2>Товар не найден</h2>
      <NuxtLink to="/catalog">← В каталог</NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug
const product = ref(null)
const pending = ref(true)
const currentIndex = ref(0)
const zoomStyle = ref({})
const mainImg = ref(null)

useHead(() => ({
  title: product.value ? `${product.value.name} — Каталог` : 'Товар'
}))

onMounted(async () => {
  const res = await fetch(`/api/products/${slug}`)
  if (res.ok) {
    product.value = await res.json()
  }
  pending.value = false
})

const photos = computed(() => product.value?.product_photos || [])
const currentPhoto = computed(() => photos.value[currentIndex.value]?.url)

function onZoom(e) {
  if (!mainImg.value) return
  const rect = mainImg.value.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width * 100
  const y = (e.clientY - rect.top) / rect.height * 100
  zoomStyle.value = {
    transform: 'scale(2)',
    transformOrigin: `${x}% ${y}%`
  }
}

function offZoom() {
  zoomStyle.value = {}
}

function scrollToContacts() {
  window.location.href = '/#контакты'
}
</script>

<style scoped>
.product-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  color: #F0EDE5;
}
.breadcrumbs {
  margin-bottom: 24px;
  color: #888;
  font-size: 0.95rem;
}
.breadcrumbs a {
  color: #6fcf97;
  text-decoration: none;
}
.product-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}
@media (max-width: 768px) {
  .product-main {
    grid-template-columns: 1fr;
  }
}
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.main-photo {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #0a1f15;
  border-radius: 12px;
  overflow: hidden;
  cursor: crosshair;
}
.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.1s;
}
.thumbs {
  display: flex;
  gap: 12px;
}
.thumbs img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0.6;
  border: 2px solid transparent;
  transition: 0.2s;
}
.thumbs img.active, .thumbs img:hover {
  opacity: 1;
  border-color: #6fcf97;
}
.product-info h1 {
  font-family: 'Noto Serif', serif;
  font-size: 2rem;
  margin-bottom: 8px;
}
.product-article {
  color: #888;
  margin-bottom: 20px;
}
.product-price-wrap {
  margin-bottom: 24px;
}
.product-price {
  font-size: 1.8rem;
  color: #6fcf97;
  font-weight: 600;
}
.product-old-price {
  font-size: 1.2rem;
  color: #888;
  text-decoration: line-through;
  margin-left: 12px;
}
.product-desc h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #ccc;
}
.product-desc p {
  line-height: 1.6;
  color: #bbb;
}
.product-cta {
  margin-top: 32px;
  padding: 16px 32px;
  border-radius: 10px;
  border: none;
  background: #013220;
  color: #F0EDE5;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.product-cta:hover {
  background: #024d30;
}
.product-loading, .product-not-found {
  text-align: center;
  padding: 80px 20px;
}
.product-not-found a {
  color: #6fcf97;
  text-decoration: none;
}
</style>
