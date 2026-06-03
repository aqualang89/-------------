// Chat-виджет v2 (2026-05-12): текст + фото + add-to-cart через [CART_ADD:артикул]
// 2026-05-18: клиентский ресайз фото перед отправкой (1920px JPEG 0.85)
// чтобы укладываться в Vercel-лимит body 4.5 MB.
console.log('[chat] init v2 cart+photo+resize')

const CART_STORAGE_KEY = 'sh_cart'
// 20 MB — лимит на выбор файла (защита от случайных видео/гифок).
// Реально на сервер уходит сжатая версия 500-800 KB после canvas-ресайза.
const MAX_IMAGE_MB = 20
const RESIZE_MAX_SIDE = 1920
const RESIZE_JPEG_QUALITY = 0.85

const chatState = {
  open: false,
  engaged: false,             // юзер отправил хоть одно сообщение — только тогда есть смысл ждать ручной ответ
  pendingImage: null,         // dataURL прикреплённого фото
  pendingImageName: null,
  seenProducts: new Map()     // article → product (накапливаем все товары из ответов сессии)
}

let pollTimer = null

const sessionId =
  sessionStorage.getItem('riparium_chat_session') ||
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
sessionStorage.setItem('riparium_chat_session', sessionId)

function createChatElements () {
  const btn = document.createElement('button')
  btn.id = 'ai-chat-toggle'
  btn.innerHTML = `
    <svg class="ai-chat-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <span>Задать вопрос</span>
  `
  document.body.appendChild(btn)

  const box = document.createElement('div')
  box.id = 'ai-chat-box'
  box.innerHTML = `
    <div class="ai-chat-header">
      <span>Консультант по аквариумам</span>
      <button class="ai-chat-close" type="button">×</button>
    </div>
    <div class="ai-chat-messages"></div>
    <div class="ai-chat-preview" hidden>
      <img class="ai-chat-preview-img" alt="превью" />
      <span class="ai-chat-preview-name"></span>
      <button class="ai-chat-preview-remove" type="button" title="убрать">×</button>
    </div>
    <form class="ai-chat-form">
      <button type="button" class="ai-chat-attach" title="прикрепить фото">📷</button>
      <input type="file" accept="image/*" class="ai-chat-file" hidden />
      <input type="text" name="text" placeholder="Опишите задачу..." autocomplete="off" />
      <button type="submit" class="ai-chat-send">▶</button>
    </form>
  `
  document.body.appendChild(box)

  btn.addEventListener('click', () => toggleChat(true))
  box.querySelector('.ai-chat-close').addEventListener('click', () => toggleChat(false))
  box.querySelector('.ai-chat-form').addEventListener('submit', onChatSubmit)

  const fileInput = box.querySelector('.ai-chat-file')
  box.querySelector('.ai-chat-attach').addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', onFilePicked)
  box.querySelector('.ai-chat-preview-remove').addEventListener('click', clearPendingImage)
}

function toggleChat (open) {
  chatState.open = open
  document.getElementById('ai-chat-box').classList.toggle('open', open)
  if (open) startPolling()
  else stopPolling()
}

// Поллим ручные ответы менеджера только в активном открытом диалоге и при видимой вкладке.
function startPolling () {
  if (pollTimer || !chatState.open || !chatState.engaged || document.hidden) return
  pollManualReplies() // разовый catch-up — подтянуть ответ, пришедший пока было закрыто
  pollTimer = setInterval(pollManualReplies, 4000)
}

function stopPolling () {
  clearInterval(pollTimer)
  pollTimer = null
}

function addMessage (role, text, opts = {}) {
  const wrap = document.querySelector('.ai-chat-messages')
  const el = document.createElement('div')
  el.className = `ai-chat-msg ai-chat-${role}`
  if (opts.thumb) {
    const img = document.createElement('img')
    img.className = 'ai-chat-msg-thumb'
    img.src = opts.thumb
    img.alt = 'прикреплённое фото'
    el.appendChild(img)
  }
  if (text) {
    const p = document.createElement('div')
    p.className = 'ai-chat-msg-text'
    p.textContent = text
    el.appendChild(p)
  }
  wrap.appendChild(el)
  wrap.scrollTop = wrap.scrollHeight
  return el
}

function addCartBadge (target, count) {
  if (!target) return
  const badge = document.createElement('div')
  badge.className = 'ai-chat-cart-badge'
  badge.textContent = count === 1 ? '🛒 добавлено в корзину' : `🛒 добавлено в корзину (${count})`
  target.appendChild(badge)
}

async function onFilePicked (e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''  // позволит выбрать тот же файл повторно
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('Можно прикреплять только изображения.')
    return
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    alert(`Фото слишком большое (${(file.size / 1024 / 1024).toFixed(1)}MB). Максимум ${MAX_IMAGE_MB}MB.`)
    return
  }
  try {
    const dataUrl = await fileToCompressedDataUrl(file)
    chatState.pendingImage = dataUrl
    chatState.pendingImageName = file.name
    showPreview(dataUrl, file.name)
  } catch (err) {
    console.error(err)
    alert('Не удалось прочитать файл')
  }
}

function fileToDataUrl (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Ресайз через canvas: уменьшает длинную сторону до RESIZE_MAX_SIDE,
// перекодирует в JPEG. iPhone-фото 5-8 MB становится ~500-800 KB —
// проходит через Vercel-лимит 4.5 MB на body запроса.
// Если что-то сломалось (нестандартный формат, OOM на canvas) —
// fallback на исходный dataURL: сервер всё равно отрежет по 3 MB с понятной ошибкой.
async function fileToCompressedDataUrl (file) {
  const originalDataUrl = await fileToDataUrl(file)
  try {
    const img = await loadImage(originalDataUrl)
    const { width, height } = fitSize(img.naturalWidth, img.naturalHeight, RESIZE_MAX_SIDE)
    // Если изображение и так маленькое — не пересжимаем, отдаём как есть.
    // Пересжатие JPEG → JPEG портит качество без причины.
    if (width === img.naturalWidth && height === img.naturalHeight && file.size < 1_000_000) {
      return originalDataUrl
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', RESIZE_JPEG_QUALITY)
  } catch (e) {
    console.warn('[chat] resize failed, using original:', e?.message)
    return originalDataUrl
  }
}

function loadImage (src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function fitSize (w, h, maxSide) {
  if (w <= maxSide && h <= maxSide) return { width: w, height: h }
  const ratio = w > h ? maxSide / w : maxSide / h
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) }
}

function showPreview (dataUrl, name) {
  const wrap = document.querySelector('.ai-chat-preview')
  wrap.hidden = false
  wrap.querySelector('.ai-chat-preview-img').src = dataUrl
  wrap.querySelector('.ai-chat-preview-name').textContent = name
}

function clearPendingImage () {
  chatState.pendingImage = null
  chatState.pendingImageName = null
  const wrap = document.querySelector('.ai-chat-preview')
  wrap.hidden = true
  wrap.querySelector('.ai-chat-preview-img').src = ''
  wrap.querySelector('.ai-chat-preview-name').textContent = ''
}

// Добавление товара в localStorage в формате useCart
function addProductToLocalCart (product) {
  if (!product || !product.id) return false
  let items = []
  try {
    items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || []
  } catch {}
  const existing = items.find(i => i.productId === product.id)
  if (existing) {
    existing.qty += 1
  } else {
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      article: product.article,
      price: product.price,
      photo: product.photo || '/img/no-photo.png',
      qty: 1
    })
  }
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  // Триггерим оба события — storage (для других табов) и кастомное (для текущего таба, Vue useCart)
  try {
    window.dispatchEvent(new CustomEvent('sh-cart-changed'))
  } catch {}
  return true
}

// Парсим маркеры [CART_ADD:артикул] из ответа, добавляем товары в корзину, удаляем маркеры из текста
function processCartActions (reply, products) {
  console.log('[chat] processCartActions: reply length', reply.length, 'products', (products || []).length)

  // Запоминаем все товары из текущего ответа в накопитель
  for (const p of (products || [])) {
    if (p && p.article) chatState.seenProducts.set(String(p.article).trim(), p)
  }

  const matches = reply.match(/\[CART_ADD:([^\]\s]+)\]/g) || []
  console.log('[chat] CART_ADD matches:', matches)

  let addedCount = 0
  const missing = []
  for (const m of matches) {
    const article = m.replace(/\[CART_ADD:|\]/g, '').trim()
    // Ищем сначала в текущих products, потом в накопителе сессии
    const product =
      (products || []).find(p => String(p.article).trim() === article) ||
      chatState.seenProducts.get(article)
    if (product && product.id) {
      const ok = addProductToLocalCart(product)
      console.log('[chat] add to cart:', article, '->', ok ? 'OK' : 'FAIL', product.name)
      if (ok) addedCount++
    } else {
      missing.push(article)
      console.warn('[chat] товар не найден в products/seenProducts:', article, 'seen:', [...chatState.seenProducts.keys()])
    }
  }
  const cleanText = reply.replace(/\[CART_ADD:[^\]\s]+\]\s*\n?/g, '').trim()
  return { cleanText, addedCount, missing }
}

async function onChatSubmit (e) {
  e.preventDefault()
  const input = e.target.elements.text
  const text = input.value.trim()
  const image = chatState.pendingImage
  const imageThumb = chatState.pendingImage

  if (!text && !image) return

  chatState.engaged = true
  startPolling()

  addMessage('user', text, { thumb: imageThumb || null })
  input.value = ''
  clearPendingImage()

  const placeholder = addMessage('assistant', 'Думаю над ответом...')

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, text, image })
    })

    if (!res.ok) {
      const errText = await res.text()
      placeholder.querySelector('.ai-chat-msg-text').textContent =
        `Ошибка: ${res.status}. ${errText.slice(0, 120)}`
      return
    }

    const data = await res.json()
    const reply = data.reply || 'Что-то пошло не так.'
    const products = data.products || []

    const { cleanText, addedCount } = processCartActions(reply, products)

    // Заменяем placeholder содержимым ответа
    placeholder.innerHTML = ''
    const p = document.createElement('div')
    p.className = 'ai-chat-msg-text'
    p.textContent = cleanText || '...'
    placeholder.appendChild(p)

    if (addedCount > 0) {
      addCartBadge(placeholder, addedCount)
    }

    const wrap = document.querySelector('.ai-chat-messages')
    wrap.scrollTop = wrap.scrollHeight
  } catch (err) {
    console.error(err)
    placeholder.querySelector('.ai-chat-msg-text').textContent = 'Ошибка соединения.'
  }
}

async function pollManualReplies () {
  try {
    const res = await fetch('/api/chat-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
    const data = await res.json()
    ;(data.pending || []).forEach(msg => addMessage('assistant', msg.content))
  } catch (err) {
    console.error(err)
  }
}

document.addEventListener('DOMContentLoaded', createChatElements)

// Вкладка в фоне — глушим поллинг, вернулись — поднимаем (если диалог ещё открыт).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPolling()
  else startPolling()
})
