const STORAGE_KEY = 'sh_cart'

function load () {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function save (items) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useCart () {
  const items = ref(load())

  function sync () {
    save(items.value)
  }

  function add (product, qty = 1) {
    const existing = items.value.find(i => i.productId === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      items.value.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        article: product.article,
        price: product.price,
        photo: product.product_photos?.[0]?.url || '/img/no-photo.png',
        qty
      })
    }
    sync()
  }

  function remove (productId) {
    items.value = items.value.filter(i => i.productId !== productId)
    sync()
  }

  function updateQty (productId, qty) {
    const item = items.value.find(i => i.productId === productId)
    if (!item) return
    if (qty < 1) {
      remove(productId)
      return
    }
    item.qty = qty
    sync()
  }

  function clear () {
    items.value = []
    sync()
  }

  const totalCount = computed(() =>
    items.value.reduce((s, i) => s + i.qty, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((s, i) => s + i.price * i.qty, 0)
  )

  function find (productId) {
    return items.value.find(i => i.productId === productId)
  }

  // sync between tabs + sync with vanilla chat.js (внутри одной вкладки)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY) {
        items.value = load()
      }
    })
    window.addEventListener('sh-cart-changed', () => {
      items.value = load()
    })
  }

  return { items, add, remove, updateQty, clear, totalCount, totalPrice, find }
}
