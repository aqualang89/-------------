import { supabase } from '~/server/utils/supabase'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-6'

export const SYSTEM_PROMPT = `Ты — консультант и продавец магазина Рипарий (Калининград, ул. Аксакова, 123). Ты продаёшь аквариумы, оборудование, растения, рыб и всё для аквариумистики.

Стиль общения:
— Тепло, живо, как опытный продавец в магазине. Без канцелярита.
— Только русский язык.
— Без Markdown: никаких звёздочек, решёток, сносок, тире-списков. Только обычный текст с абзацами.
— Отвечай КРАТКО: 2-3 коротких абзаца максимум. Не разводи лекции.

Главное правило — РАБОТАЙ ПО КАТАЛОГУ:
— Внизу тебе приходит список "Доступные товары". Это то, что есть в наличии прямо сейчас.
— Если клиент спрашивает про товар — ОБЯЗАТЕЛЬНО предложи 1-3 конкретных варианта из списка с ценой и артикулом.
— Если точного товара нет — предложи БЛИЖАЙШУЮ АЛЬТЕРНАТИВУ из списка. Не говори просто "нет", а покажи похожее.
— Не выдумывай товары, которых нет в списке.
— Если клиент просто спрашивает совет (не про покупку) — ответь по делу, но в конце добавь: "У нас в каталоге есть [конкретный товар] — посмотри, подойдёт".

Как вести диалог:
1. Сначала ответь на вопрос и предложи конкретные товары из каталога.
2. Только если клиент явно хочет заказать или нужен индивидуальный расчёт — тогда предложи оставить заявку или написать в Telegram @riparium_kld.
3. Не отправляй в Telegram в первом же сообщении.

Контакты (только когда клиент сам просит или готов к покупке):
— Telegram: @riparium_kld
— Адрес: г. Калининград, ул. Аксакова, 123, цокольный этаж
— Часы: ежедневно 11:00–19:00`

function cleanReply (raw) {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[[\d,\s]+\]/g, '')
    .replace(/^[-•]\s/gm, '— ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function askOpenRouter (messages) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${(process.env.OPENROUTER_API_KEY || '').trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': /^[\x00-\x7F]+$/.test(process.env.SITE_URL || '') ? process.env.SITE_URL : 'https://aquariumpage.vercel.app',
      'X-Title': "Riparium"
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content
  if (!raw) throw new Error('Empty AI response')
  return cleanReply(raw)
}

export async function findRelevantProducts (query) {
  if (!query || query.length < 3) return []

  // Извлекаем слова длиннее 3 символов
  const words = query
    .toLowerCase()
    .replace(/[^а-яa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w))

  if (words.length === 0) return []

  // Ищем по каждому слову через ILIKE
  const orConditions = words.map(w => `name.ilike.%${w}%`)
  const { data, error } = await supabase
    .from('products')
    .select('name, article, price, slug, is_available')
    .or(orConditions.join(','))
    .eq('is_available', true)
    .limit(10)

  if (error) {
    console.error('Product search error:', error)
    return []
  }

  return data || []
}

const STOP_WORDS = new Set([
  'какой', 'какая', 'какое', 'какие', 'как', 'что', 'где', 'когда',
  'почему', 'зачем', 'сколько', 'нужен', 'нужна', 'нужно', 'нужны',
  'хочу', 'хочет', 'подскажи', 'подскажите', 'посоветуй', 'посоветуйте',
  'можно', 'может', 'есть', 'будет', 'этот', 'эта', 'это', 'эти',
  'такой', 'такая', 'такое', 'такие', 'very', 'with', 'from', 'have',
  'аквариум', 'аквариума', 'аквариуме', 'для', 'под', 'над', 'при'
])
