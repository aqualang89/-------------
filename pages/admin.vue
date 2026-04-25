<template>
  <div class="admin-wrap">
    <!-- Авторизация -->
    <div v-if="!isAuth" class="admin-login">
      <h2>Вход в админку</h2>
      <input
        v-model="password"
        type="password"
        placeholder="Пароль"
        @keyup.enter="login"
      >
      <button @click="login">Войти</button>
      <p v-if="loginError" class="error">{{ loginError }}</p>
    </div>

    <!-- Панель -->
    <div v-else>
      <header class="admin-header">
        <h1>Админка каталога</h1>
        <button class="btn-logout" @click="logout">Выйти</button>
      </header>

      <!-- Загрузка Excel -->
      <section class="admin-section">
        <h2>Загрузка из 1С (Excel)</h2>
        <div class="upload-row">
          <input type="file" accept=".xlsx,.xls,.csv" @change="handleFile">
          <button :disabled="uploading" @click="uploadExcel">
            {{ uploading ? 'Загрузка...' : 'Загрузить' }}
          </button>
        </div>
        <div v-if="uploadResult" class="upload-result">
          <p>Обработано: {{ uploadResult.processed }}</p>
          <p>Создано: {{ uploadResult.created }}</p>
          <p>Обновлено: {{ uploadResult.updated }}</p>
          <p v-if="uploadResult.errors.length" class="error">
            Ошибки: {{ uploadResult.errors.join('; ') }}
          </p>
        </div>
      </section>

      <!-- Фильтр товаров -->
      <section class="admin-section">
        <h2>Товары</h2>
        <div class="filters">
          <input v-model="search" placeholder="Поиск..." @input="fetchProducts">
          <select v-model="filterCategory" @change="fetchProducts">
            <option value="">Все категории</option>
            <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
          </select>
        </div>

        <div class="product-grid">
          <div v-for="p in products" :key="p.id" class="product-card">
            <div class="product-img-wrap">
              <img v-if="mainPhoto(p)" :src="mainPhoto(p)" alt="">
              <div v-else class="no-photo">Нет фото</div>
              <label class="upload-photo-btn">
                <input type="file" accept="image/*" @change="e => uploadPhoto(e, p.id)">
                📷
              </label>
            </div>
            <input v-model="p.name" class="product-input">
            <input v-model.number="p.price" type="number" class="product-input">
            <select v-model="p.category_id" class="product-input">
              <option :value="null">Без категории</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <textarea v-model="p.description" rows="2" class="product-input" placeholder="Описание" />
            <div class="product-actions">
              <button @click="saveProduct(p)">Сохранить</button>
              <button class="btn-danger" @click="deleteProduct(p.id)">Удалить</button>
            </div>
          </div>
        </div>

        <div class="pagination">
          <button :disabled="page === 1" @click="page--; fetchProducts()">←</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button :disabled="page >= totalPages" @click="page++; fetchProducts()">→</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const password = ref('')
const isAuth = ref(false)
const loginError = ref('')
const uploading = ref(false)
const uploadResult = ref(null)
const file = ref(null)
const products = ref([])
const categories = ref([])
const search = ref('')
const filterCategory = ref('')
const page = ref(1)
const totalPages = ref(1)

onMounted(() => {
  const saved = localStorage.getItem('admin_pwd')
  if (saved) {
    password.value = saved
    isAuth.value = true
    init()
  }
})

function login() {
  if (!password.value) return
  localStorage.setItem('admin_pwd', password.value)
  isAuth.value = true
  init()
}

function logout() {
  localStorage.removeItem('admin_pwd')
  isAuth.value = false
  password.value = ''
}

async function init() {
  await fetchCategories()
  await fetchProducts()
}

async function fetchCategories() {
  const res = await fetch('/api/categories')
  categories.value = await res.json()
}

async function fetchProducts() {
  const q = new URLSearchParams()
  if (search.value) q.set('search', search.value)
  if (filterCategory.value) q.set('category', filterCategory.value)
  q.set('page', page.value)
  q.set('limit', '12')

  const res = await fetch(`/api/products?${q}`)
  const data = await res.json()
  products.value = data.products
  totalPages.value = data.totalPages
}

function handleFile(e) {
  file.value = e.target.files[0]
}

async function uploadExcel() {
  if (!file.value) return
  uploading.value = true
  uploadResult.value = null

  const form = new FormData()
  form.append('file', file.value)

  const res = await fetch('/api/catalog-upload', {
    method: 'POST',
    headers: { 'x-admin-password': password.value },
    body: form
  })

  const data = await res.json()
  uploadResult.value = data
  uploading.value = false

  if (res.ok) {
    file.value = null
    fetchProducts()
  }
}

async function saveProduct(p) {
  const res = await fetch('/api/products/' + p.id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({
      name: p.name,
      price: p.price,
      category_id: p.category_id,
      description: p.description
    })
  })
  if (res.ok) alert('Сохранено')
}

async function deleteProduct(id) {
  if (!confirm('Удалить товар?')) return
  const res = await fetch('/api/products/' + id, {
    method: 'DELETE',
    headers: { 'x-admin-password': password.value }
  })
  if (res.ok) fetchProducts()
}

function mainPhoto(p) {
  const photo = p.product_photos?.find(ph => ph.is_main) || p.product_photos?.[0]
  return photo?.url
}

async function uploadPhoto(e, productId) {
  const f = e.target.files[0]
  if (!f) return

  const form = new FormData()
  form.append('file', f)

  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'x-admin-password': password.value },
    body: form
  })

  if (!res.ok) {
    alert('Ошибка загрузки фото')
    return
  }

  const { url } = await res.json()

  // Сохранить фото к товару
  await fetch('/api/product-photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({ product_id: productId, url, is_main: true })
  })

  fetchProducts()
}
</script>

<style scoped>
.admin-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #F0EDE5;
}
.admin-login {
  max-width: 320px;
  margin: 80px auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.admin-login input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #555;
  background: #111;
  color: #F0EDE5;
}
.admin-login button {
  padding: 12px;
  border-radius: 8px;
  background: #013220;
  color: #F0EDE5;
  border: none;
  cursor: pointer;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.btn-logout {
  background: #444;
  color: #F0EDE5;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.admin-section {
  margin-bottom: 40px;
  background: #0a1f15;
  padding: 24px;
  border-radius: 12px;
}
.upload-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}
.upload-result {
  margin-top: 16px;
  padding: 12px;
  background: #013220;
  border-radius: 8px;
}
.filters {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}
.filters input, .filters select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #111;
  color: #F0EDE5;
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.product-card {
  background: #111;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.product-img-wrap {
  position: relative;
  height: 160px;
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-photo {
  color: #666;
}
.upload-photo-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.upload-photo-btn input {
  display: none;
}
.product-input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #333;
  background: #000;
  color: #F0EDE5;
}
.product-actions {
  display: flex;
  gap: 8px;
}
.product-actions button {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: #013220;
  color: #F0EDE5;
}
.btn-danger {
  background: #521414 !important;
}
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
}
.pagination button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: #013220;
  color: #F0EDE5;
  cursor: pointer;
}
.error {
  color: #ff6b6b;
}
</style>
