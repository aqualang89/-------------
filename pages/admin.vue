<template>
  <div class="admin-wrap">
    <!-- Авторизация -->
    <div v-if="!isAuth" class="admin-login">
      <h2>Вход в админку</h2>
      <input v-model="password" type="password" placeholder="Пароль" @keyup.enter="login">
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
        <div v-if="uploading" class="progress-wrap">
          <div class="progress-bar" :style="{ width: uploadProgress + '%' }">
            <div class="progress-shine"></div>
          </div>
          <p class="progress-text">{{ uploadMessage }}</p>
        </div>
        <div v-if="uploadResult" class="upload-result">
          <p>Обработано: {{ uploadResult.processed }}</p>
          <p>Создано: {{ uploadResult.created }}</p>
          <p>Обновлено: {{ uploadResult.updated }}</p>
          <p v-if="uploadResult.skipped">Пропущено (группы/мусор): {{ uploadResult.skipped }}</p>
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
          <div class="admin-cat-tree">
            <div
              class="cat-item"
              :class="{ active: filterCategory === '' }"
              @click="filterCategory = ''; fetchProducts()"
            >
              <span class="cat-spacer"></span>
              <span class="cat-name">Все категории</span>
            </div>
            <template v-for="c in adminVisibleCats" :key="c.id">
              <div
                class="cat-item"
                :class="{ active: filterCategory === c.slug }"
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
                <span class="cat-name" @click="filterCategory = c.slug; fetchProducts()">
                  {{ c.name }}
                </span>
              </div>
            </template>
          </div>
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

            <!-- Каскадные категории -->
            <div class="category-cascade">
              <select v-model="p._group" class="product-input" @change="p._subgroup = null; p._leaf = null">
                <option :value="null">Группа</option>
                <option v-for="g in tree" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
              <select v-model="p._subgroup" class="product-input" @change="p._leaf = null">
                <option :value="null">Подгруппа</option>
                <option v-for="sg in subgroupsOf(p._group)" :key="sg.id" :value="sg.id">{{ sg.name }}</option>
              </select>
              <select v-model="p._leaf" class="product-input">
                <option :value="null">Категория</option>
                <option v-for="leaf in leavesOf(p._subgroup || p._group)" :key="leaf.id" :value="leaf.id">{{ leaf.name }}</option>
              </select>
            </div>

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
const uploadProgress = ref(0)
const uploadMessage = ref('')
const uploadResult = ref(null)
const file = ref(null)
const products = ref([])
const tree = ref([])
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
  tree.value = await res.json()
}

function findPathById(nodes, id, path = []) {
  for (const node of nodes) {
    if (node.id === id) return [...path, node]
    if (node.children?.length) {
      const res = findPathById(node.children, id, [...path, node])
      if (res) return res
    }
  }
  return null
}

function initProductSelectors(p) {
  if (!p.category_id) {
    p._group = null
    p._subgroup = null
    p._leaf = null
    return
  }
  const path = findPathById(tree.value, p.category_id)
  if (path) {
    p._group = path[0]?.id || null
    p._subgroup = path[1]?.id || null
    p._leaf = path[path.length - 1]?.id || null
  } else {
    p._group = null
    p._subgroup = null
    p._leaf = null
  }
}

function subgroupsOf(groupId) {
  const g = tree.value.find(c => c.id === groupId)
  return g?.children || []
}

function leavesOf(nodeId) {
  if (!nodeId) return []
  const result = []
  function findNode(nodes, id) {
    for (const n of nodes) {
      if (n.id === id) return n
      if (n.children?.length) {
        const found = findNode(n.children, id)
        if (found) return found
      }
    }
    return null
  }
  const node = findNode(tree.value, nodeId)
  if (!node) return []
  function collect(n) {
    result.push(n)
    if (n.children?.length) n.children.forEach(collect)
  }
  collect(node)
  return result
}

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
  walk(tree.value)
  return result
})

const adminVisibleCats = computed(() => {
  return flatCategories.value.filter(c => {
    if (c.level === 1) return true
    const parent = flatCategories.value.find(p => p.id === c.parentId)
    return parent && expanded.value.has(parent.id)
  })
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

async function fetchProducts() {
  const q = new URLSearchParams()
  if (search.value) q.set('search', search.value)
  if (filterCategory.value) q.set('category', filterCategory.value)
  q.set('page', page.value)
  q.set('limit', '12')
  q.set('showUnavailable', 'true')

  const res = await fetch(`/api/products?${q}`)
  const data = await res.json()
  products.value = (data.products || []).map(p => {
    initProductSelectors(p)
    return p
  })
  totalPages.value = data.totalPages
}

function handleFile(e) {
  file.value = e.target.files[0]
}

async function uploadExcel() {
  if (!file.value) return
  uploading.value = true
  uploadResult.value = null
  uploadProgress.value = 0
  uploadMessage.value = 'Читаем файл...'

  try {
    const arrayBuffer = await file.value.arrayBuffer()
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Определяем формат
    const is1C = rows.some(r =>
      r.some(c => String(c || '').toLowerCase().includes('входит в группу'))
    )

    if (is1C) {
      await upload1C(rows)
    } else {
      await uploadReference(arrayBuffer)
    }
  } catch (e) {
    uploadMessage.value = 'Ошибка загрузки'
    uploadResult.value = { errors: ['Ошибка: ' + e.message] }
    uploading.value = false
  }
}

async function uploadReference(arrayBuffer) {
  // 555.xlsx — отправляем на сервер как раньше
  uploadMessage.value = 'Загружаем справочник...'
  const form = new FormData()
  form.append('file', new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))

  const res = await fetch('/api/catalog-upload', {
    method: 'POST',
    headers: { 'x-admin-password': password.value },
    body: form
  })

  const data = await res.json()
  uploadResult.value = data
  uploadProgress.value = 100
  uploadMessage.value = 'Готово!'

  if (res.ok) {
    file.value = null
    await fetchProducts()
  }
  uploading.value = false
}

async function upload1C(rows) {
  // Парсим 333.xlsx
  uploadMessage.value = 'Парсим файл...'

  let headerIdx = rows.findIndex(r =>
    r.some(c => String(c || '').toLowerCase().includes('артикул')) &&
    r.some(c => String(c || '').toLowerCase().includes('входит в группу'))
  )
  if (headerIdx === -1) {
    throw new Error('Не найдены заголовки 1С')
  }

  const dataRows = rows.slice(headerIdx + 1)
  const parentSet = new Set()
  for (const row of dataRows) {
    const parent = row[6]
    if (parent) parentSet.add(String(parent).trim())
  }

  const items = []
  for (const row of dataRows) {
    const article = row[0] ? String(row[0]).trim() : null
    const name = row[2] ? String(row[2]).trim() : null
    const price = parseFloat(String(row[7] || '0').replace(/\s/g, '').replace(',', '.')) || 0
    const qty = parseFloat(String(row[8] || '0').replace(/\s/g, '').replace(',', '.')) || 0

    if (!name) continue
    if (parentSet.has(name) || name === 'Аквариумистика / Террариумистика') continue
    if (/^(Валентина|Дубовик|ИП Гончаров)/.test(name)) continue
    if (name === 'Растение в ассортитменте') continue

    items.push({ article, name, price, qty, slug: slugify(name) || `p-${Date.now()}` })
  }

  // Отправляем batch'ами по 30
  const CHUNK = 30
  let updated = 0
  let created = 0
  let errors = []

  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK)
    uploadProgress.value = Math.round((i / items.length) * 100)
    uploadMessage.value = `Обработано ${Math.min(i + CHUNK, items.length)} / ${items.length} товаров`

    const res = await fetch('/api/catalog-update-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password.value
      },
      body: JSON.stringify({ items: chunk })
    })

    const data = await res.json()
    if (data.updated) updated += data.updated
    if (data.created) created += data.created
    if (data.errors && data.errors.length) errors.push(...data.errors)
  }

  uploadProgress.value = 100
  uploadMessage.value = 'Готово!'
  uploadResult.value = { processed: items.length, updated, created, errors, skipped: dataRows.length - items.length }

  file.value = null
  await fetchProducts()
  uploading.value = false
}

function slugify(str) {
  if (!str) return ''
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
    й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
    у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
    э: 'e', ю: 'yu', я: 'ya'
  }
  return str
    .toLowerCase()
    .split('')
    .map(c => map[c] || c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function saveProduct(p) {
  const categoryId = p._leaf || p._subgroup || p._group || p.category_id
  const res = await fetch('/api/products/' + p.id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({
      name: p.name,
      price: p.price,
      category_id: categoryId,
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
  flex-wrap: wrap;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
.category-cascade {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.category-cascade select {
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
.progress-wrap {
  margin-top: 16px;
}
.progress-bar {
  height: 8px;
  background: linear-gradient(90deg, #013220 0%, #0f5c3e 100%);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  transition: width 0.3s ease;
}
.progress-shine {
  position: absolute;
  top: 0;
  left: -40px;
  width: 40px;
  height: 100%;
  background: rgba(255,255,255,0.3);
  animation: progress-shine 1.2s infinite ease-in-out;
}
@keyframes progress-shine {
  0% { left: -40px; }
  100% { left: 100%; }
}
.progress-text {
  margin-top: 8px;
  font-size: 13px;
  color: #aaa;
}
.admin-cat-tree {
  background: #0a1f15;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 8px 0;
  max-height: 400px;
  overflow-y: auto;
  min-width: 260px;
  margin-top: 8px;
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
  background: #013220;
  color: #6fcf97;
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
</style>
