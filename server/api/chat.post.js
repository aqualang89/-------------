import {
  addHistory,
  getHistory,
  getMode,
  getDailyAiCost,
  addAiCost
} from '~/server/utils/store.js'
import { sendOwnerCard } from '~/server/utils/telegram.js'
import { askOpenRouter, findRelevantProducts, buildUserMessage, SYSTEM_PROMPT } from '~/server/utils/ai.js'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'

// Дневной лимит расхода на AI-чат в USD. Защита от DOS на деньги OpenRouter.
// Claude Sonnet 4.6: ~$3/M input + $15/M output. 1500 max_tokens out × $15/M ≈ $0.022 за ответ + input.
// $5/день ≈ ~150 ответов в день = норм для одного магазина.
const AI_DAILY_USD_CAP = parseFloat(process.env.AI_DAILY_USD_CAP || '5')
// Консервативная оценка стоимости одного вызова (input + output). На самом деле OpenRouter
// возвращает точную usage — но мы не хотим парсить response до проверки cap. Зарезервируем худший случай.
const EST_COST_PER_CALL = 0.025

// Парсим маркеры [CART_ADD:артикул] из ответа Claude и подтягиваем товары по article из БД
// чтобы клиент гарантированно мог добавить в корзину (даже если их нет в текущем products)
async function ensureCartProducts (reply, products) {
  const matches = reply.match(/\[CART_ADD:([^\]\s]+)\]/g) || []
  if (matches.length === 0) return products

  const articlesInProducts = new Set(products.map(p => String(p.article).trim()))
  const missing = []
  for (const m of matches) {
    const article = m.replace(/\[CART_ADD:|\]/g, '').trim()
    if (article && !articlesInProducts.has(article)) {
      missing.push(article)
    }
  }
  if (missing.length === 0) return products

  const { data, error } = await supabase
    .from('products')
    .select('id, name, article, price, slug, is_available, product_photos(url, is_main, sort_order)')
    .in('article', missing)
  if (error || !data) return products

  const extra = data.map(p => ({
    id: p.id,
    name: p.name,
    article: p.article,
    price: p.price,
    slug: p.slug,
    is_available: p.is_available,
    photo: (p.product_photos || [])
      .sort((a, b) => (b.is_main - a.is_main) || (a.sort_order - b.sort_order))[0]?.url || null
  }))
  return [...products, ...extra]
}

const HISTORY_LIMIT = 20
const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5MB лимит Claude

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'chat')
  const body = await readBody(event)
  const { sessionId, text, image } = body || {}

  if (!sessionId || (!text?.trim() && !image)) {
    throw createError({ statusCode: 400, statusMessage: 'sessionId и text (или image) обязательны' })
  }

  // Cost cap — не даём атакующему сжечь баланс OpenRouter.
  try {
    const spentToday = await getDailyAiCost()
    if (spentToday + EST_COST_PER_CALL > AI_DAILY_USD_CAP) {
      log.warn(`Cost cap reached: $${spentToday.toFixed(3)} of $${AI_DAILY_USD_CAP}`)
      throw createError({
        statusCode: 429,
        statusMessage: 'Чат сейчас перегружен. Напишите нам в Telegram @riparium_kld — ответим там.'
      })
    }
  } catch (e) {
    if (e.statusCode === 429) throw e
    log.error('Cost cap check failed (continuing):', e.message)
  }

  const cleanText = (text || '').trim()
  const hasImage = typeof image === 'string' && image.startsWith('data:image/')

  if (hasImage) {
    // примерный расчёт размера base64 (length * 0.75)
    const approxBytes = image.length * 0.75
    if (approxBytes > MAX_IMAGE_BYTES) {
      throw createError({ statusCode: 413, statusMessage: 'Фото слишком большое (макс 5MB)' })
    }
  }

  const previousHistory = await getHistory(sessionId)
  // В историю кладём только текст (фото в Redis не храним)
  const historyText = hasImage
    ? (cleanText ? `${cleanText} [приложено фото]` : '[прислано фото]')
    : cleanText
  await addHistory(sessionId, 'user', historyText)

  const mode = await getMode(sessionId)

  if (mode === 'manual') {
    await sendOwnerCard({ sessionId, userText: historyText, aiReply: null, mode: 'manual' })
    return {
      reply: 'Сообщение передано владельцу. Он ответит здесь.',
      mode: 'manual',
      products: []
    }
  }

  let reply
  let responseMode = 'ai'
  let products = []

  try {
    // Поиск товаров делаем только по тексту (фото мы текстом не описываем)
    const searchQuery = cleanText || ''
    products = searchQuery ? await findRelevantProducts(searchQuery) : []

    const catalogBlock = products.length
      ? 'Доступные товары из каталога (используй их в ответе с артикулами и ценами; ссылки в текст НЕ вставляй — клиент добавит в корзину через [CART_ADD:артикул]):\n' +
        products.map(p =>
          `— ${p.name} (арт. ${p.article || 'нет'}) — ${Math.round(p.price).toLocaleString()} ₽`
        ).join('\n')
      : 'Каталог по этому запросу ничего не вернул — отвечай экспертно по сути, конкретные товары можешь не предлагать (или предложи общие критерии выбора).'

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...previousHistory.slice(-HISTORY_LIMIT).map(h => ({ role: h.role, content: h.content })),
      { role: 'system', content: catalogBlock },
      buildUserMessage(cleanText, hasImage ? image : null)
    ]

    // signal — если клиент закрыл вкладку, прерываем upstream и не платим за стрим
    reply = await askOpenRouter(messages, { signal: event.node.req.signal })

    // Записываем оценочный cost (точный приходит в usage, но это упростит логику)
    addAiCost(EST_COST_PER_CALL).catch(e => log.error('addAiCost failed (non-fatal):', e.message))

    // Гарантируем что все товары упомянутые в [CART_ADD:артикул] есть в products
    products = await ensureCartProducts(reply, products)
  } catch (aiErr) {
    log.error('AI fallback:', aiErr.message || aiErr)
    responseMode = 'manual'
    reply = 'Консультант сейчас недоступен. Ваш вопрос передан специалисту — он ответит в ближайшее время. Также можете написать нам в Telegram @riparium_kld.'
  }

  await addHistory(sessionId, 'assistant', reply)
  await sendOwnerCard({ sessionId, userText: historyText, aiReply: responseMode === 'ai' ? reply : null, mode: responseMode })

  return { reply, mode: responseMode, products }
})
