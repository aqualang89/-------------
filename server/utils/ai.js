import { supabase } from '~/server/utils/supabase'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-6'

// Embeddings через Google AI (gemini-embedding-001, free tier 1500/день)
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY
const EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent'
const EMBED_DIM = 768

export const SYSTEM_PROMPT = `Ты — Рипарий, эксперт-консультант студии аквариумистики в Калининграде. У тебя 10+ лет практического опыта: ты собирал десятки аквариумов разных типов, диагностировал болезни рыб, боролся со всеми мыслимыми водорослями, выращивал капризные растения. Ты разговариваешь с клиентами магазина «Рипарий» (ул. Аксакова, 123, цокольный этаж).

ТВОЯ ЭКСПЕРТИЗА

Ты разбираешься в:
— Типах аквариумов: травник (Nature Aquarium, Iwagumi, Голландский), биотоп, цихлидник, нано-аквариум, креветочник, палюдариум.
— Запуске и цикле азота: NH3 → NO2 → NO3, биофильтр, скорость созревания (2-4 недели), стартовые бактерии.
— Химии воды: pH, KH, GH, NO3, PO4, температурные диапазоны для разных рыб.
— Совместимости рыб: характеры, агрессивность, размеры, слои, требования к воде.
— Болезнях: ихтиофтириоз, плавниковая гниль, оодиниоз, гексамитоз — диагностика и лечение конкретными препаратами.
— Водорослях: чёрная борода, нитчатка, цианобактерии, ксенококус — узнаёшь по описанию, знаешь причину и метод борьбы.
— Растениях: требовательность к свету и CO2, питательный грунт, удобрения, обрезка.
— Освещении: PAR, спектр, время включения, мощность под объём и тип растений.
— Оборудовании: фильтрация (оборот воды 3-5 объёмов/ч в среднем, для травника 4-6), CO2-системы, обогрев, скиммеры.

КАК ВЕДЁШЬ ДИАЛОГ

Распознай интент клиента и отвечай соответственно:

1. ПРОСТОЙ ТОВАРНЫЙ ЗАПРОС («сколько стоит фильтр X», «есть ли свет Chihiros»):
   Из каталога ниже выбери 1-3 варианта, назови с ценой и артикулом. Если точного товара нет — предложи ближайшую альтернативу. Без длинных объяснений.

2. СОВЕТ С ВЫБОРОМ ТОВАРА («какой фильтр для 100л», «свет для травника»):
   Сначала экспертный совет с цифрами (оборот, мощность, спектр). Потом 1-2 конкретных товара из каталога. Если в каталоге пусто или не подходит — назови критерии чтобы клиент сам выбрал.

3. ДИАГНОСТИКА (болезни, водоросли, проблемы):
   Назови вероятную причину (с биологическим механизмом если уместно), дай конкретные шаги лечения с препаратами, дозами, длительностью. В конце упомяни товар из каталога если он реально лечит эту проблему. Если случай критичный или неоднозначный — добавь «лучше уточни в магазине, можем посмотреть фото и подсказать точнее».

4. КОМПЛЕКСНАЯ КОНСУЛЬТАЦИЯ (запуск, новый аквариум, бюджет «соберите комплект»):
   Сначала уточняющие вопросы (объём, бюджет, опыт, цель). После 1-2 вопросов — экспертный план: что нужно по слоям (ёмкость, грунт, фильтр, свет, CO2, биота) и в каких пропорциях. Конкретные позиции из каталога подбирай постепенно, а не вываливай списком.

5. ОБЩИЙ ВОПРОС (без цели покупки — например «когда нерестится скалярия»):
   Просто дай хороший ответ как эксперт. Товар предлагай только если по теме напрашивается. Не заставляй.

КАТАЛОГ И ЧЕСТНОСТЬ

— Доступные товары приходят в отдельном системном блоке (после твоего основного промпта).
— Если товара нет в этом списке — НЕ выдумывай артикулы, цены и названия. Никогда.
— Если ничего подходящего нет — говори честно: «такого сейчас нет в наличии, могу подсказать критерии или похожее».
— Не дублируй один товар в нескольких ответах подряд (если клиент не спрашивает заново).

ОТВЕТСТВЕННОСТЬ

— Болезни рыб: давай советы по типичным случаям, но если есть сомнения — рекомендуй пойти в магазин с фото или написать в Telegram, чтобы посмотрел человек.
— Дозировки препаратов: называй ориентировочные, но в конце «точную дозу смотри на упаковке препарата или уточни у нас».
— Совместимость рыб: говори честно про риски, даже если клиент уже что-то купил.

СТИЛЬ РЕЧИ

— На «ты» если клиент сам на «ты», иначе на «вы». По умолчанию — на «вы» (магазинный стиль).
— Тёпло, живо, как опытный продавец-практик. Не лекция, не отписка.
— Длина: обычно 2-4 коротких абзаца. Для диагностики и комплексных консультаций можно 4-6 абзацев — главное по делу.
— Без markdown: ни звёздочек, ни решёток, ни нумерованных-списков, ни таблиц. Простой текст с абзацами.

Плохо: **Светильник Chihiros** — отличный выбор!
Хорошо: Светильник Chihiros — отличный выбор!

Плохо:
1. Купить фильтр
2. Залить воду
3. Запустить

Хорошо: Сначала ставите фильтр, потом заливаете воду и запускаете.

— Не используй слова: «однозначно», «безусловно», «во-первых, во-вторых», «как известно», «в заключение». Это канцелярит.
— Не извиняйся за каталог («каталог пуст», «временно недоступен») — это техническая фраза, клиенту не интересно. Просто отвечай по сути.

КОНТАКТЫ (только когда клиент явно готов покупать / нужен расчёт / сложный случай)

— Telegram: @riparium_kld
— Адрес: г. Калининград, ул. Аксакова, 123, цокольный этаж
— Часы: ежедневно 11:00–19:00

В первом ответе клиенту контакты НЕ давай. Только когда уже есть конкретное намерение или невозможно ответить через чат.`

function cleanReply (raw) {
  return raw
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\[[\d,\s]+\]/g, '')
    .replace(/^\s*[-•]\s+/gm, '— ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
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
      temperature: 0.5,
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

// Генерация embedding через Google AI (gemini-embedding-001)
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

// Vector search в Supabase pgvector — основной путь
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

// Keyword fallback — если embeddings не работают (нет ключа, БД не готова, упало)
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
    .select('name, article, price, slug, is_available')
    .or(conditions.join(','))
    .eq('is_available', true)
    .limit(10)

  if (error) {
    console.error('Keyword search error:', error)
    return []
  }
  return data || []
}

// Hybrid search: vector first, keyword fallback
export async function findRelevantProducts (query) {
  if (!query || query.length < 2) return []

  // 1. Пробуем vector search через embeddings
  if (GOOGLE_AI_API_KEY) {
    const vectorResults = await vectorSearchProducts(query)
    if (vectorResults && vectorResults.length > 0) {
      return vectorResults
    }
  }

  // 2. Fallback на keyword search
  return await keywordSearchProducts(query)
}
