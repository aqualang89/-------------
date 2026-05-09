<template>
  <div class="catalog-wrap">
    <div class="catalog-header">
      <h1>Каталог</h1>
      <input
        v-model="searchInput"
        placeholder="Поиск по названию или артикулу..."
        class="search-input"
      >
      <div class="catalog-layout">
        <!-- Сайдбар категорий -->
        <aside class="catalog-sidebar">
          <div class="sidebar-header">
            <h3>Категории</h3>
            <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
              {{ sidebarOpen ? 'Скрыть' : 'Показать' }}
            </button>
          </div>
          <div v-show="sidebarOpen" class="category-tree">
            <div
              class="cat-item"
              :class="{ active: category === '' }"
              @click="category = ''; onCategoryChange()"
            >
              <span class="cat-spacer"></span>
              <span class="cat-name">Все категории</span>
            </div>
            <template v-for="c in visibleCategories" :key="c.id">
              <div
                class="cat-item"
                :class="{ active: category === c.slug }"
                :style="{ paddingLeft: (c.level - 1) * 16 + 8 + 'px' }"
              >
                <span
                  v-if="c.hasChildren"
                  class="cat-toggle"
                  @click.stop="toggleExpand(c.id)"
                >
                  {{ expanded.has(c.id) ? '−' : '+' }}
                </span>
                <span v-else class="cat-spacer"></span>
                <span class="cat-name" @click="category = c.slug; onCategoryChange()">
                  {{ c.name }}
                </span>
              </div>
            </template>
          </div>
        </aside>

        <!-- Контент -->
        <div class="catalog-main">
          <div class="catalog-toolbar">
            <div class="price-filter">
              <label>Макс. цена: <strong>{{ maxPriceInput.toLocaleString() }} ₽</strong></label>
              <input v-model.number="maxPriceInput" type="range" min="0" :max="MAX_PRICE" step="1000">
            </div>
            <p v-if="category" class="active-cat">
              {{ activeCategoryName }}
              <button class="btn-reset" @click="category = ''; onCategoryChange()">×</button>
            </p>
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
            <button :disabled="page === 1" @click="prevPage">←</button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button :disabled="page >= totalPages" @click="nextPage">→</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const searchInput = ref('')
const category = ref('')
const maxPriceInput = ref(9999999)
const page = ref(1)
const sidebarOpen = ref(true)
const isMobile = ref(false)

const search = ref('')
const maxPrice = ref(9999999)
const MAX_PRICE = ref(200000)

const { data: categoryTree } = await useFetch('/api/categories')

const expanded = ref(new Set())

const flatCategories = computed(() => {
  const result = []
  function walk(nodes, level = 1) {
    for (const node of nodes) {
      result.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        level,
        hasChildren: (node.children?.length || 0) > 0,
        parentId: node.parent_id
      })
      if (node.children?.length) walk(node.children, level + 1)
    }
  }
  walk(categoryTree.value || [])
  return result
})

const visibleCategories = computed(() => {
  return flatCategories.value.filter(c => {
    if (c.level === 1) return true
    const parent = flatCategories.value.find(p => p.id === c.parentId)
    return parent && expanded.value.has(parent.id)
  })
})

const activeCategoryName = computed(() => {
  const cat = flatCategories.value.find(c => c.slug === category.value)
  return cat ? cat.name : ''
})

function toggleExpand(id) {
  const next = new Set(expanded.value)
  if (next.has(id)) {
    next.delete(id)
    function hideChildren(parentId) {
      const children = flatCategories.value.filter(c => c.parentId === parentId)
      for (const child of children) {
        next.delete(child.id)
        hideChildren(child.id)
      }
    }
    hideChildren(id)
  } else {
    next.add(id)
  }
  expanded.value = next
}

const { data: productsData, pending } = await useFetch('/api/products', {
  query: computed(() => {
    const q = { page: page.value }
    if (search.value) q.search = search.value
    if (category.value) q.category = category.value
    if (maxPrice.value < MAX_PRICE.value) q.maxPrice = maxPrice.value
    return q
  })
})

const products = computed(() => productsData.value?.products || [])
const totalPages = computed(() => productsData.value?.totalPages || 1)

watch(productsData, (val) => {
  if (val?.maxPrice && val.maxPrice !== MAX_PRICE.value) {
    MAX_PRICE.value = val.maxPrice
    if (maxPriceInput.value > val.maxPrice || maxPriceInput.value === 9999999) {
      maxPriceInput.value = val.maxPrice
      maxPrice.value = val.maxPrice
    }
  }
}, { immediate: true })

useHead({ title: 'Каталог — Студия аквариумного дизайна' })

let searchTimer
watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { search.value = val; page.value = 1 }, 300)
})

let priceTimer
watch(maxPriceInput, (val) => {
  clearTimeout(priceTimer)
  priceTimer = setTimeout(() => { maxPrice.value = val; page.value = 1 }, 150)
})

function onCategoryChange() {
  page.value = 1
  if (isMobile.value) sidebarOpen.value = false
}

function prevPage() {
  if (page.value > 1) page.value--
}

function nextPage() {
  if (page.value < totalPages.value) page.value++
}

function mainPhoto(p) {
  const photo = p.product_photos?.find(ph => ph.is_main) || p.product_photos?.[0]
  return photo?.url
}

onMounted(() => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) sidebarOpen.value = false
  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth < 768
    if (nowMobile !== isMobile.value) {
      isMobile.value = nowMobile
      sidebarOpen.value = !nowMobile
    }
  })
})
</script>

<style scoped>
.catalog-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  color: var(--cream);
}
.catalog-header h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.2rem;
  margin-bottom: 20px;
}
.search-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
  font-size: 1rem;
  margin-bottom: 20px;
}
.catalog-layout {
  display: flex;
  gap: 24px;
}
.catalog-sidebar {
  width: 260px;
  flex-shrink: 0;
}
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.sidebar-header h3 {
  font-size: 1rem;
  font-weight: 600;
}
.sidebar-toggle {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  background: var(--gold);
  color: var(--ink-deep);
  font-size: 0.85rem;
  cursor: pointer;
}
.category-tree {
  background: var(--ink-mid);
  border: 1px solid var(--rule);
  border-radius: 8px;
  padding: 8px 0;
  max-height: 600px;
  overflow-y: auto;
}
.cat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.95rem;
}
.cat-item:hover {
  background: rgba(255,255,255,0.05);
}
.cat-item.active {
  background: rgba(217, 180, 106, 0.12);
  color: var(--gold);
}
.cat-toggle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}
.cat-toggle:hover {
  background: rgba(255,255,255,0.2);
}
.cat-spacer {
  width: 20px;
  flex-shrink: 0;
}
.cat-name {
  flex: 1;
}
.catalog-main {
  flex: 1;
  min-width: 0;
}
.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.price-filter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
}
.price-filter label {
  font-size: 0.9rem;
  color: var(--cream-dim);
}
.price-filter input[type="range"] {
  width: 100%;
  cursor: pointer;
}
.active-cat {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(217, 180, 106, 0.12);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--cream);
}
.btn-reset {
  background: none;
  border: none;
  color: #ff8a8a;
  font-size: 1.2rem;
  cursor: pointer;
  line-height: 1;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}
.product-card {
  background: var(--ink-mid);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: var(--cream);
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.card-img-wrap {
  height: 220px;
  background: var(--ink-soft);
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
  color: var(--cream-dim);
}
.card-title {
  padding: 16px 16px 8px;
  font-size: 1.1rem;
  font-weight: 600;
}
.card-price {
  padding: 0 16px 16px;
  font-size: 1.2rem;
  color: var(--gold);
}
.card-old-price {
  text-decoration: line-through;
  color: var(--cream-dim);
  font-size: 0.95rem;
  margin-left: 8px;
}
.catalog-empty, .catalog-loading {
  text-align: center;
  padding: 60px;
  color: var(--cream-dim);
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
  background: var(--gold);
  color: var(--ink-deep);
  cursor: pointer;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 767px) {
  .catalog-layout {
    flex-direction: column;
  }
  .catalog-sidebar {
    width: 100%;
  }

  .category-tree {
    max-height: 300px;
  }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
