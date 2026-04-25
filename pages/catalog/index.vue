<template>
  <div class="catalog-wrap">
    <div class="catalog-header">
      <h1>Каталог</h1>
      <div class="catalog-filters">
        <input
          v-model="search"
          placeholder="Поиск по названию или артикулу..."
          class="search-input"
          @input="page = 1; fetchProducts()"
        >
        <select v-model="category" @change="page = 1; fetchProducts()">
          <option value="">Все категории</option>
          <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="pending" class="catalog-loading">Загрузка...</div>

    <div v-else-if="products.length" class="product-grid">
      <NuxtLink
        v-for="p in products"
        :key="p.id"
        :to="`/catalog/${p.slug}`"
        class="product-card"
      >
        <div class="card-img-wrap">
          <img v-if="mainPhoto(p)" :src="mainPhoto(p)" :alt="p.name">
          <div v-else class="card-no-photo">Нет фото</div>
        </div>
        <h3 class="card-title">{{ p.name }}</h3>
        <p class="card-price">
          {{ p.price.toLocaleString() }} ₽
          <span v-if="p.old_price" class="card-old-price">{{ p.old_price.toLocaleString() }} ₽</span>
        </p>
      </NuxtLink>
    </div>

    <div v-else class="catalog-empty">
      Ничего не найдено
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 1" @click="page--; fetchProducts()">←</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="page++; fetchProducts()">→</button>
    </div>
  </div>
</template>

<script setup>
const search = ref('')
const category = ref('')
const page = ref(1)
const products = ref([])
const categories = ref([])
const totalPages = ref(1)
const pending = ref(false)

useHead({ title: 'Каталог — Студия аквариумного дизайна' })

onMounted(() => {
  fetchCategories()
  fetchProducts()
})

async function fetchCategories() {
  const res = await fetch('/api/categories')
  categories.value = await res.json()
}

async function fetchProducts() {
  pending.value = true
  const q = new URLSearchParams()
  if (search.value) q.set('search', search.value)
  if (category.value) q.set('category', category.value)
  q.set('page', page.value)

  const res = await fetch(`/api/products?${q}`)
  const data = await res.json()
  products.value = data.products
  totalPages.value = data.totalPages
  pending.value = false
}

function mainPhoto(p) {
  const photo = p.product_photos?.find(ph => ph.is_main) || p.product_photos?.[0]
  return photo?.url
}
</script>

<style scoped>
.catalog-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  color: #F0EDE5;
}
.catalog-header {
  margin-bottom: 32px;
}
.catalog-header h1 {
  font-family: 'Noto Serif', serif;
  font-size: 2.2rem;
  margin-bottom: 20px;
}
.catalog-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 240px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #0a1f15;
  color: #F0EDE5;
  font-size: 1rem;
}
.catalog-filters select {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #0a1f15;
  color: #F0EDE5;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}
.product-card {
  background: #0a1f15;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: #F0EDE5;
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.card-img-wrap {
  height: 220px;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-no-photo {
  color: #555;
}
.card-title {
  padding: 16px 16px 8px;
  font-size: 1.1rem;
  font-weight: 600;
}
.card-price {
  padding: 0 16px 16px;
  font-size: 1.2rem;
  color: #6fcf97;
}
.card-old-price {
  text-decoration: line-through;
  color: #888;
  font-size: 0.95rem;
  margin-left: 8px;
}
.catalog-empty, .catalog-loading {
  text-align: center;
  padding: 60px;
  color: #888;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 40px;
}
.pagination button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #013220;
  color: #F0EDE5;
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
