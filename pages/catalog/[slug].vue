<template>
  <div class="product-wrap">
    <div v-if="pending" class="product-loading">Загрузка...</div>

    <div v-else-if="product" class="product-inner">
      <nav class="breadcrumbs">
        <NuxtLink to="/catalog">Каталог</NuxtLink>
        <template v-for="(cat, i) in categoryPath" :key="cat.id">
          <span> / </span>
          <NuxtLink v-if="i < categoryPath.length - 1" :to="`/catalog?category=${cat.slug}`">{{ cat.name }}</NuxtLink>
          <span v-else>{{ cat.name }}</span>
        </template>
        <span> / {{ product.name }}</span>
      </nav>

      <div class="product-main">
        <div class="product-gallery">
          <div class="main-photo" @mousemove="onZoom" @mouseleave="offZoom" @click="openLightbox">
            <img
              ref="mainImg"
              :src="currentPhoto || '/img/no-photo.png'"
              :alt="product.name"
              :style="zoomStyle"
            >
            <button v-if="currentPhoto" type="button" class="zoom-hint" aria-label="Увеличить">🔍</button>
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
          <div class="product-cart">
            <div v-if="cartItem" class="product-cart-in">
              <span>В корзине: <strong>{{ cartItem.qty }}</strong></span>
              <NuxtLink to="/cart" class="product-cart-link">Перейти →</NuxtLink>
            </div>
            <template v-else>
              <div class="product-qty">
                <button @click="qty = Math.max(1, qty - 1)">−</button>
                <span>{{ qty }}</span>
                <button @click="qty++">+</button>
              </div>
              <button class="product-cta" @click="addToCart">
                Добавить в корзину
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="product-not-found">
      <h2>Товар не найден</h2>
      <NuxtLink to="/catalog">← В каталог</NuxtLink>
    </div>

    <!-- Lightbox для просмотра фото — тап вне фото или × закрывает, на мобиле pinch-zoom работает нативно -->
    <div v-if="lightboxOpen" class="lightbox" @click.self="closeLightbox">
      <button type="button" class="lightbox-close" @click="closeLightbox" aria-label="Закрыть">×</button>
      <img :src="currentPhoto" :alt="product?.name" class="lightbox-img" />
      <div v-if="photos.length > 1" class="lightbox-thumbs" @click.stop>
        <img
          v-for="(ph, i) in photos"
          :key="ph.id"
          :src="ph.url"
          :class="{ active: currentIndex === i }"
          @click="currentIndex = i"
        >
      </div>
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
const categoryTree = ref([])
const qty = ref(1)
const lightboxOpen = ref(false)

function openLightbox () {
  if (!currentPhoto.value) return
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}
function closeLightbox () {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

onUnmounted(() => { document.body.style.overflow = '' })

const { add, find } = useCart()
const cartItem = computed(() => product.value ? find(product.value.id) : null)

function addToCart () {
  if (!product.value) return
  add({
    id: product.value.id,
    slug: product.value.slug,
    name: product.value.name,
    article: product.value.article,
    price: product.value.price,
    product_photos: product.value.product_photos
  }, qty.value)
}

useHead(() => ({
  title: product.value ? `${product.value.name} — Каталог` : 'Товар'
}))

onMounted(async () => {
  const [prodRes, treeRes] = await Promise.all([
    fetch(`/api/products/${slug}`),
    fetch('/api/categories')
  ])
  if (prodRes.ok) product.value = await prodRes.json()
  if (treeRes.ok) categoryTree.value = await treeRes.json()
  pending.value = false
})

const photos = computed(() => product.value?.product_photos || [])
const currentPhoto = computed(() => photos.value[currentIndex.value]?.url)

const categoryPath = computed(() => {
  if (!product.value?.categories) return []
  function findPath(nodes, targetSlug, path = []) {
    for (const node of nodes) {
      if (node.slug === targetSlug) return [...path, node]
      if (node.children?.length) {
        const res = findPath(node.children, targetSlug, [...path, node])
        if (res) return res
      }
    }
    return null
  }
  return findPath(categoryTree.value, product.value.categories.slug) || []
})

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


</script>

<style scoped>
.product-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px 40px;
  color: var(--cream);
}
.breadcrumbs {
  margin-bottom: 24px;
  color: var(--cream-dim);
  font-size: 0.95rem;
}
.breadcrumbs a {
  color: var(--gold);
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
  background: var(--ink-mid);
  border-radius: 12px;
  overflow: hidden;
  cursor: zoom-in;
}
.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.1s;
}
/* Подсказка-кнопка в углу — особенно полезна на мобиле где hover нет */
.zoom-hint {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(14, 26, 36, 0.7);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(241, 230, 200, 0.2);
  border-radius: 50%;
  color: var(--cream);
  font-size: 16px;
  cursor: pointer;
  pointer-events: none;
  z-index: 2;
  transition: background 0.2s, transform 0.2s;
}
.main-photo:hover .zoom-hint {
  background: rgba(217, 180, 106, 0.85);
  color: var(--ink-deep);
  transform: scale(1.05);
}

/* Lightbox — модалка с фото на весь экран, нативный pinch-zoom работает */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: lightboxIn 0.2s ease;
}
@keyframes lightboxIn {
  from { opacity: 0 }
  to   { opacity: 1 }
}
.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  font-size: 26px;
  cursor: pointer;
  line-height: 1;
  z-index: 10000;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
.lightbox-thumbs {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  max-width: 90vw;
  overflow-x: auto;
}
.lightbox-thumbs img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.6;
  border: 2px solid transparent;
  transition: 0.2s;
  flex-shrink: 0;
}
.lightbox-thumbs img.active, .lightbox-thumbs img:hover {
  opacity: 1;
  border-color: var(--gold);
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
  border-color: var(--gold);
}
.product-info h1 {
  font-family: var(--font-serif);
  font-size: 2rem;
  margin-bottom: 8px;
}
.product-article {
  color: var(--cream-dim);
  margin-bottom: 20px;
}
.product-price-wrap {
  margin-bottom: 24px;
}
.product-price {
  font-size: 1.8rem;
  color: var(--gold);
  font-weight: 600;
}
.product-old-price {
  font-size: 1.2rem;
  color: var(--cream-dim);
  text-decoration: line-through;
  margin-left: 12px;
}
.product-desc h3 {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--cream);
}
.product-desc p {
  line-height: 1.6;
  color: var(--cream-dim);
}
.product-cart {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.product-cart-in {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: rgba(217, 180, 106, 0.12);
  border-radius: 10px;
  color: var(--gold);
}
.product-cart-link {
  color: var(--gold);
  text-decoration: underline;
  font-weight: 600;
}
.product-qty {
  display: flex;
  align-items: center;
  gap: 12px;
}
.product-qty button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--rule);
  background: var(--ink-soft);
  color: var(--cream);
  cursor: pointer;
  font-size: 1.2rem;
}
.product-qty button:hover {
  border-color: var(--gold);
}
.product-qty span {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
}
.product-cta {
  padding: 16px 32px;
  border-radius: 10px;
  border: none;
  background: var(--gold);
  color: var(--ink-deep);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.product-cta:hover {
  background: var(--gold-soft);
  transform: translateY(-2px);
}
.product-loading, .product-not-found {
  text-align: center;
  padding: 80px 20px;
}
.product-not-found a {
  color: var(--gold);
  text-decoration: none;
}
</style>
