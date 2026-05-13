<template>
  <div class="admin-wrap">
    <!-- Авторизация -->
    <div v-if="!isAuth" class="admin-login" data-reveal>
      <h2>Вход в админку</h2>
      <input v-model="password" type="password" placeholder="Пароль" @keyup.enter="login">
      <button @click="login">Войти</button>
      <p v-if="loginError" class="error">{{ loginError }}</p>
    </div>

    <!-- Панель -->
    <div v-else>
      <header class="admin-header">
        <h1>Админка</h1>
        <button class="btn-logout" @click="logout">Выйти</button>
      </header>

      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Каталог -->
      <template v-if="activeTab === 'catalog'">
      <!-- Загрузка Excel -->
      <section class="admin-section" data-reveal>
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
        <input
          v-model="search"
          placeholder="Поиск по названию или артикулу..."
          class="search-input"
          @input="fetchProducts"
        >
        <div class="admin-cats-wrap">
          <div class="admin-cats-header">
            <h3>Категории</h3>
            <button class="sidebar-toggle" @click="adminCatsOpen = !adminCatsOpen">
              {{ adminCatsOpen ? 'Скрыть' : 'Показать' }}
            </button>
          </div>
          <div v-show="adminCatsOpen" class="admin-cat-tree">
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
                <input type="file" accept="image/*" multiple @change="e => uploadPhotos(e, p.id)">
                📷+
              </label>
            </div>

            <!-- Мини-галерея всех фото товара с управлением -->
            <div v-if="(p.product_photos || []).length > 0" class="product-photos">
              <div
                v-for="ph in p.product_photos"
                :key="ph.id"
                class="product-photo-item"
                :class="{ 'is-main': ph.is_main }"
                :title="ph.is_main ? 'Главное фото' : 'Сделать главным'"
              >
                <img :src="ph.url" :alt="''" @click="setMainPhoto(p, ph.id)">
                <button
                  type="button"
                  class="product-photo-delete"
                  @click="deletePhoto(p, ph.id)"
                  title="Удалить"
                >×</button>
                <span v-if="ph.is_main" class="product-photo-star">★</span>
              </div>
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
      </template>

      <!-- Заказы -->
      <template v-else>
        <section class="admin-section">
          <h2>Заказы</h2>

          <div class="filters">
            <select v-model="orderStatus" @change="fetchOrders">
              <option value="">Все статусы</option>
              <option value="new">Новый</option>
              <option value="confirmed">Подтверждён</option>
              <option value="shipped">Отправлен</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>

          <div v-if="ordersLoading" class="product-loading">Загрузка...</div>

          <div v-else-if="orders.length === 0" class="product-loading">Нет заказов</div>

          <div v-else class="orders-table-wrap">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Дата</th>
                  <th>Клиент</th>
                  <th>Телефон</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="o in orders" :key="o.id">
                  <tr class="order-row" @click="toggleOrder(o.id)">
                    <td>{{ o.id.slice(0, 8) }}</td>
                    <td>{{ formatDate(o.created_at) }}</td>
                    <td>{{ o.customer_name }}</td>
                    <td>{{ o.customer_phone }}</td>
                    <td>{{ o.total_amount.toLocaleString() }} ₽</td>
                    <td>
                      <span class="order-status" :class="'status-' + o.status">{{ statusLabel(o.status) }}</span>
                    </td>
                    <td>
                      <span class="order-toggle">{{ expandedOrders.has(o.id) ? '▾' : '▸' }}</span>
                    </td>
                  </tr>
                  <tr v-if="expandedOrders.has(o.id)" class="order-detail-row">
                    <td colspan="7">
                      <div class="order-detail">
                        <div class="order-detail-grid">
                          <div>
                            <h4>Контакты</h4>
                            <p><strong>Имя:</strong> {{ o.customer_name }}</p>
                            <p><strong>Телефон:</strong> {{ o.customer_phone }}</p>
                            <p v-if="o.customer_email"><strong>Email:</strong> {{ o.customer_email }}</p>
                            <p v-if="o.customer_telegram"><strong>Telegram:</strong> @{{ o.customer_telegram }}</p>
                          </div>
                          <div>
                            <h4>Доставка</h4>
                            <p><strong>Способ:</strong> {{ deliveryLabel(o.delivery_type) }}</p>
                            <p v-if="o.delivery_city"><strong>Город:</strong> {{ o.delivery_city }}</p>
                            <p v-if="o.delivery_address"><strong>Адрес:</strong> {{ o.delivery_address }}</p>
                          </div>
                        </div>

                        <h4>Состав заказа</h4>
                        <div class="order-items">
                          <div v-for="item in o.order_items" :key="item.id" class="order-item">
                            <img v-if="item.product_photo" :src="item.product_photo" alt="">
                            <div v-else class="order-item-noimg">—</div>
                            <div class="order-item-info">
                              <p>{{ item.product_name }}</p>
                              <span v-if="item.product_article">{{ item.product_article }}</span>
                            </div>
                            <div class="order-item-qty">{{ item.qty }} шт</div>
                            <div class="order-item-price">{{ (item.price * item.qty).toLocaleString() }} ₽</div>
                          </div>
                        </div>

                        <div v-if="o.comment" class="order-comment">
                          <strong>Комментарий:</strong> {{ o.comment }}
                        </div>

                        <div class="order-actions">
                          <select v-model="o._newStatus" class="product-input">
                            <option value="new">Новый</option>
                            <option value="confirmed">Подтверждён</option>
                            <option value="shipped">Отправлен</option>
                            <option value="delivered">Доставлен</option>
                            <option value="cancelled">Отменён</option>
                          </select>
                          <button @click="updateOrderStatus(o)">Обновить статус</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <div v-if="orderTotalPages > 1" class="pagination">
            <button :disabled="orderPage === 1" @click="orderPage--; fetchOrders()">←</button>
            <span>{{ orderPage }} / {{ orderTotalPages }}</span>
            <button :disabled="orderPage >= orderTotalPages" @click="orderPage++; fetchOrders()">→</button>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
useScrollReveal()
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
const adminCatsOpen = ref(true)

// Tabs
const tabs = [
  { key: 'catalog', label: 'Каталог' },
  { key: 'orders', label: 'Заказы' }
]
const activeTab = ref('catalog')

// Orders
const orders = ref([])
const ordersLoading = ref(false)
const orderPage = ref(1)
const orderTotalPages = ref(1)
const orderStatus = ref('')
const expandedOrders = ref(new Set())

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

async function readErrorText(res) {
  try {
    const j = await res.clone().json()
    return j?.statusMessage || j?.message || JSON.stringify(j).slice(0, 200)
  } catch {
    try {
      const t = await res.clone().text()
      return t?.slice(0, 200) || ''
    } catch {
      return ''
    }
  }
}

async function uploadPhotos(e, productId) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (files.length === 0) return

  for (const f of files) {
    await uploadSinglePhoto(f, productId, files.length === 1)
  }
  await fetchProducts()
}

async function deletePhoto(product, photoId) {
  if (!photoId) {
    alert('id фото не определён. Возможно нужно обновить страницу.')
    return
  }
  if (!confirm('Удалить это фото?')) return
  const res = await fetch(`/api/product-photos/${photoId}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': password.value }
  })
  if (!res.ok) {
    const errText = await readErrorText(res)
    alert(`Ошибка удаления фото (HTTP ${res.status})\n${errText}`)
    return
  }
  await fetchProducts()
}

async function setMainPhoto(product, photoId) {
  if (!photoId) {
    alert('id фото не определён. Обновите страницу.')
    return
  }
  const res = await fetch(`/api/product-photos/${photoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({ is_main: true })
  })
  if (!res.ok) {
    const errText = await readErrorText(res)
    alert(`Не удалось сделать главным (HTTP ${res.status})\n${errText}`)
    return
  }
  await fetchProducts()
}

async function uploadSinglePhoto(f, productId, isFirst) {
  const sizeMB = f.size / 1024 / 1024
  if (sizeMB > 4) {
    alert(`Файл "${f.name}" слишком большой: ${sizeMB.toFixed(1)}MB. Vercel лимит ~4MB.`)
    return
  }

  const form = new FormData()
  form.append('file', f)

  let res
  try {
    res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'x-admin-password': password.value },
      body: form
    })
  } catch (netErr) {
    alert('Сетевая ошибка: ' + netErr.message)
    return
  }

  if (!res.ok) {
    const errText = await readErrorText(res)
    alert(`Ошибка загрузки фото "${f.name}" (HTTP ${res.status})\n${errText}`)
    return
  }

  let url
  try {
    const json = await res.json()
    url = json.url
    if (!url) {
      alert('Сервер не вернул URL фото')
      return
    }
  } catch (parseErr) {
    alert('Не удалось распарсить ответ сервера: ' + parseErr.message)
    return
  }

  // is_main только если это первое и единственное загружаемое фото
  // (если несколько — все is_main=false, юзер потом руками выберет главное)
  await fetch('/api/product-photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({ product_id: productId, url, is_main: isFirst })
  })
}

// Старая uploadPhoto оставлена как обёртка для совместимости (на случай если её ещё где-то вызывают)
async function uploadPhoto(e, productId) {
  const f = e.target.files[0]
  if (!f) return

  // Pre-check размера (Vercel serverless лимит 4.5MB)
  const sizeMB = f.size / 1024 / 1024
  if (sizeMB > 4) {
    alert(`Файл слишком большой: ${sizeMB.toFixed(1)}MB. Vercel лимит ~4MB. Сожмите фото.`)
    e.target.value = ''
    return
  }

  const form = new FormData()
  form.append('file', f)

  let res
  try {
    res = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'x-admin-password': password.value },
      body: form
    })
  } catch (netErr) {
    alert('Сетевая ошибка: ' + netErr.message)
    return
  }

  if (!res.ok) {
    const errText = await readErrorText(res)
    alert(`Ошибка загрузки фото (HTTP ${res.status})\n${errText}`)
    return
  }

  let url
  try {
    const json = await res.json()
    url = json.url
    if (!url) {
      alert('Сервер не вернул URL фото. Ответ: ' + JSON.stringify(json).slice(0, 200))
      return
    }
  } catch (parseErr) {
    alert('Не удалось распарсить ответ сервера: ' + parseErr.message)
    return
  }

  const saveRes = await fetch('/api/product-photos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({ product_id: productId, url, is_main: true })
  })

  if (!saveRes.ok) {
    const errText = await readErrorText(saveRes)
    alert(`Не удалось сохранить фото в БД (HTTP ${saveRes.status})\n${errText}`)
    return
  }

  fetchProducts()
}

/* ─── Orders ─── */
async function fetchOrders () {
  ordersLoading.value = true
  const q = new URLSearchParams()
  if (orderStatus.value) q.set('status', orderStatus.value)
  q.set('page', orderPage.value)
  q.set('limit', '20')

  const res = await fetch(`/api/orders?${q}`, {
    headers: { 'x-admin-password': password.value }
  })
  const data = await res.json()
  orders.value = (data.orders || []).map(o => ({ ...o, _newStatus: o.status }))
  orderTotalPages.value = data.totalPages || 1
  ordersLoading.value = false
}

function toggleOrder (id) {
  const next = new Set(expandedOrders.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedOrders.value = next
}

function formatDate (iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel (s) {
  const map = { new: 'Новый', confirmed: 'Подтверждён', shipped: 'Отправлен', delivered: 'Доставлен', cancelled: 'Отменён' }
  return map[s] || s
}

function deliveryLabel (d) {
  const map = { pickup: 'Самовывоз', courier: 'Курьер', transport: 'ТК по РФ' }
  return map[d] || d
}

async function updateOrderStatus (o) {
  const res = await fetch('/api/orders/' + o.id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': password.value
    },
    body: JSON.stringify({ status: o._newStatus })
  })
  if (res.ok) {
    o.status = o._newStatus
    alert('Статус обновлён')
  }
}

watch(activeTab, (tab) => {
  if (tab === 'orders') fetchOrders()
})
</script>

<style scoped>
.admin-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  color: var(--cream);
}
.admin-wrap h1,
.admin-wrap h2 {
  font-family: var(--font-serif);
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
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
}
.admin-login button {
  padding: 12px;
  border-radius: 8px;
  background: var(--gold);
  color: var(--ink-deep);
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.btn-logout {
  background: var(--ink-soft);
  color: var(--cream);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}
.admin-section {
  margin-bottom: 40px;
  background: var(--ink-mid);
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
  background: rgba(217, 180, 106, 0.1);
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
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
}
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.product-card {
  background: var(--ink-mid);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.product-img-wrap {
  position: relative;
  height: 160px;
  background: var(--ink-soft);
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
  color: var(--cream-dim);
}
.upload-photo-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(14,26,36,0.8);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.upload-photo-btn input {
  display: none;
}

/* Мини-галерея фото товара в админ-карточке */
.product-photos {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 0;
}
.product-photo-item {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
  background: var(--ink-mid, #152535);
}
.product-photo-item.is-main {
  border-color: #d9b46a;
}
.product-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}
.product-photo-item img:hover {
  transform: scale(1.06);
}
.product-photo-delete {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 80, 80, 0.9);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.product-photo-delete:hover {
  background: #ff5050;
}
.product-photo-star {
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 11px;
  color: #d9b46a;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}
.product-input {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
}
.category-cascade {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.category-cascade select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
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
  background: var(--gold);
  color: var(--ink-deep);
  font-weight: 600;
}
.btn-danger {
  background: #6b1e1e !important;
  color: var(--cream) !important;
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
  background: var(--gold);
  color: var(--ink-deep);
  cursor: pointer;
}
.error {
  color: #ff8a8a;
}
.progress-wrap {
  margin-top: 16px;
}
.progress-bar {
  height: 8px;
  background: linear-gradient(90deg, var(--ink-mid) 0%, var(--gold) 100%);
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
  color: var(--cream-dim);
}
.admin-cat-tree {
  background: var(--ink-mid);
  border: 1px solid var(--rule);
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

/* Tabs */
.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}
.admin-tabs button {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream-dim);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}
.admin-tabs button.active {
  background: var(--gold);
  color: var(--ink-deep);
  border-color: var(--gold);
  font-weight: 600;
}
.admin-tabs button:not(.active):hover {
  border-color: var(--gold);
  color: var(--cream);
}

/* Orders table */
.orders-table-wrap {
  overflow-x: auto;
}
.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.orders-table th {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--rule);
  color: var(--cream-dim);
  font-weight: 500;
}
.orders-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(241, 230, 200, 0.06);
}
.order-row {
  cursor: pointer;
  transition: background 0.15s;
}
.order-row:hover {
  background: rgba(255, 255, 255, 0.03);
}
.order-status {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
}
.status-new { background: rgba(217, 180, 106, 0.15); color: #d9b46a; }
.status-confirmed { background: rgba(74, 222, 128, 0.12); color: #4ade80; }
.status-shipped { background: rgba(96, 165, 250, 0.12); color: #60a5fa; }
.status-delivered { background: rgba(167, 139, 250, 0.12); color: #a78bfa; }
.status-cancelled { background: rgba(255, 100, 100, 0.12); color: #ff8a8a; }
.order-toggle {
  color: var(--cream-dim);
  font-size: 0.85rem;
}

/* Order detail */
.order-detail-row td {
  padding: 0;
  border-bottom: 1px solid var(--rule);
}
.order-detail {
  padding: 20px;
  background: rgba(14, 26, 36, 0.5);
}
.order-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
}
@media (max-width: 768px) {
  .order-detail-grid {
    grid-template-columns: 1fr;
  }
}
.order-detail h4 {
  font-family: var(--font-serif);
  margin-bottom: 10px;
  color: var(--gold);
}
.order-detail p {
  margin: 4px 0;
  color: var(--cream-dim);
}
.order-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}
.order-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--ink-mid);
  padding: 10px;
  border-radius: 8px;
}
.order-item img,
.order-item-noimg {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  background: var(--ink-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--cream-dim);
  font-size: 0.8rem;
}
.order-item-info {
  flex: 1;
}
.order-item-info p {
  margin: 0;
  color: var(--cream);
}
.order-item-info span {
  font-size: 0.85rem;
  color: var(--cream-dim);
}
.order-item-qty {
  color: var(--cream-dim);
  font-size: 0.9rem;
}
.order-item-price {
  font-weight: 600;
  color: var(--gold);
  white-space: nowrap;
}
.order-comment {
  padding: 12px;
  background: rgba(217, 180, 106, 0.06);
  border-radius: 8px;
  margin-bottom: 16px;
  color: var(--cream-dim);
}
.order-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.order-actions select {
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--rule);
  background: var(--ink-mid);
  color: var(--cream);
}
.order-actions button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: var(--gold);
  color: var(--ink-deep);
  font-weight: 600;
  cursor: pointer;
}
</style>
