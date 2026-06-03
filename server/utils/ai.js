import { supabase } from '~/server/utils/supabase'
import { ENRICH_PROMPT } from '~/server/prompts/enrich-catalog.js'
export { SYSTEM_PROMPT } from '~/server/prompts/chat-system.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-6'

// Embeddings через Google AI (gemini-embedding-001, free tier 1500/день)
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY
const EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent'
const EMBED_DIM = 768

function cleanReply (raw) {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/^\s*[-•]\s+/gm, '— ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

// Anthropic prompt caching через OpenRouter: оборачиваем длинный system в content-массив
// с cache_control. Кэшируем большой SYSTEM_PROMPT (его не меняем между запросами),
// catalog-блок НЕ кешируем (он меняется каждый раз — товары разные).
const CACHE_MIN_CHARS = 3000
function applyCacheControl (messages) {
  let cached = false
  return messages.map(msg => {
    if (cached) return msg
    if (msg.role !== 'system') return msg
    if (typeof msg.content !== 'string') return msg
    if (msg.content.length < CACHE_MIN_CHARS) return msg
    cached = true
    return {
      role: 'system',
      content: [
        { type: 'text', text: msg.content, cache_control: { type: 'ephemeral' } }
      ]
    }
  })
}

// Базовый вызов OpenRouter. messages может содержать multimodal content (массивы с image_url для vision)
// signal — AbortSignal, обычно `event.node.req.signal` чтобы прерывать когда клиент уходит
// Опции: model (по умолчанию Sonnet), temperature, maxTokens — для дешёвых задач вроде дайджеста
export async function askOpenRouter (messages, { signal, model = MODEL, temperature = 0.5, maxTokens = 1500, plugins } = {}) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    signal,
    headers: {
      'Authorization': `Bearer ${(process.env.OPENROUTER_API_KEY || '').trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': /^[\x00-\x7F]+$/.test(process.env.SITE_URL || '') ? process.env.SITE_URL : 'https://aquariumpage.vercel.app',
      'X-Title': "Riparium"
    },
    body: JSON.stringify({
      model,
      messages: applyCacheControl(messages),
      temperature,
      max_tokens: maxTokens,
      ...(plugins ? { plugins } : {})
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content
  if (!raw) throw new Error('Empty AI response')
  const usage = data?.usage
  if (usage?.cache_read_input_tokens || usage?.cache_creation_input_tokens) {
    console.log(`[AI Cache] read=${usage.cache_read_input_tokens || 0} write=${usage.cache_creation_input_tokens || 0} input=${usage.prompt_tokens || 0} output=${usage.completion_tokens || 0}`)
  }
  return cleanReply(raw)
}

// Хелпер: собрать user-message с возможным изображением (base64 data URL)
// imageDataUrl ожидается в формате 'data:image/jpeg;base64,/9j/...' или undefined
export function buildUserMessage (text, imageDataUrl) {
  if (!imageDataUrl) {
    return { role: 'user', content: text }
  }
  return {
    role: 'user',
    content: [
      { type: 'text', text: text || 'Клиент прислал фото. Посмотри что на нём и дай экспертный совет.' },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ]
  }
}

// ── Обогащение каталога: Grok с веб-поиском ищет реальные характеристики товара ──
const GROK_MODEL = 'x-ai/grok-4.3'

// Возвращает { description, found }. found=false → данных в вебе не нашлось (description='').
export async function enrichProductDescription ({ name, article }, { signal } = {}) {
  const messages = [
    { role: 'system', content: ENRICH_PROMPT },
    { role: 'user', content: `Товар: ${name}\nАртикул: ${article || '—'}` }
  ]
  const reply = await askOpenRouter(messages, {
    signal,
    model: GROK_MODEL,
    plugins: [{ id: 'web', max_results: 5 }],
    temperature: 0.2,
    maxTokens: 600
  })
  if (/^\s*NO_DATA\s*$/i.test(reply)) return { description: '', found: false }
  // подчищаем: убираем ссылки если просочились, длинное/среднее тире → обычный дефис, схлопываем пробелы
  const clean = reply
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[—–]/g, '-')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return { description: clean, found: clean.length > 0 }
}

export async function embedText (text) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY не задан в env')
  }
  const res = await fetch(`${EMBED_URL}?key=${GOOGLE_AI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: EMBED_DIM
    })
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Embedding error ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const values = data?.embedding?.values
  if (!Array.isArray(values)) throw new Error('Empty embedding response')
  return values
}

async function vectorSearchProducts (query) {
  try {
    const queryEmbedding = await embedText(query)
    const { data, error } = await supabase.rpc('match_products', {
      query_embedding: queryEmbedding,
      match_count: 10
    })
    if (error) {
      console.error('Vector search RPC error:', error)
      return null
    }
    return data || []
  } catch (err) {
    console.error('Vector search failed:', err.message)
    return null
  }
}

const STOP_WORDS = new Set([
  'какой', 'какая', 'какое', 'какие', 'как', 'что', 'где', 'когда',
  'почему', 'зачем', 'сколько',
  'нужен', 'нужна', 'нужно', 'нужны', 'хочу', 'хочет', 'можно', 'может',
  'есть', 'будет', 'нет',
  'этот', 'эта', 'это', 'эти', 'такой', 'такая', 'такое', 'такие',
  'самый', 'сама', 'само', 'сами',
  'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они',
  'мне', 'тебе', 'ему', 'ей', 'нам', 'вам', 'им',
  'меня', 'тебя', 'его', 'ее', 'нас', 'вас', 'их',
  'мой', 'твой', 'наш', 'ваш', 'свой',
  'для', 'под', 'над', 'при', 'про', 'без', 'вне', 'до', 'из', 'за',
  'от', 'по', 'со', 'через', 'между', 'около', 'возле', 'вдоль',
  'в', 'на', 'с', 'к', 'о', 'об', 'у',
  'и', 'а', 'но', 'или', 'да', 'же', 'бы', 'ли', 'не', 'ни', 'ну',
  'тоже', 'также', 'уже', 'ещё', 'еще', 'очень', 'просто', 'только',
  'вот', 'тут', 'там', 'где', 'куда', 'откуда',
  'подскажи', 'подскажите', 'посоветуй', 'посоветуйте', 'покажи', 'покажите',
  'дайте', 'дай', 'расскажи', 'расскажите', 'скажи', 'скажите',
  'very', 'with', 'from', 'have', 'this', 'that',
  'аквариум', 'аквариума', 'аквариуме', 'аквариумы', 'аквариумов'
])

async function keywordSearchProducts (query) {
  const rawWords = query
    .toLowerCase()
    .replace(/[^а-яa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w))

  if (rawWords.length === 0) return []

  const words = [...new Set(rawWords)]
  const conditions = []
  for (const w of words) {
    conditions.push(`name.ilike.%${w}%`)
    conditions.push(`description.ilike.%${w}%`)
    if (w.length > 5) conditions.push(`name.ilike.%${w.slice(0, -2)}%`)
    if (w.length > 4) conditions.push(`name.ilike.%${w.slice(0, -1)}%`)
  }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, article, price, slug, is_available, product_photos(url, is_main, sort_order)')
    .or(conditions.join(','))
    .eq('is_available', true)
    .limit(10)

  if (error) {
    console.error('Keyword search error:', error)
    return []
  }

  // Нормализуем формат под match_products: вытаскиваем photo
  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    article: p.article,
    price: p.price,
    slug: p.slug,
    is_available: p.is_available,
    photo: (p.product_photos || [])
      .sort((a, b) => (b.is_main - a.is_main) || (a.sort_order - b.sort_order))[0]?.url || null
  }))
}

export async function findRelevantProducts (query) {
  if (!query || query.length < 2) return []

  if (GOOGLE_AI_API_KEY) {
    const vectorResults = await vectorSearchProducts(query)
    if (vectorResults && vectorResults.length > 0) {
      return vectorResults
    }
  }

  return await keywordSearchProducts(query)
}
