import { supabase } from '~/server/utils/supabase'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4-6'

const SYSTEM_PROMPT = `Ты — консультант и продавец студии аквариумного дизайна Scaper's House (Калининград, ул. Аксакова, 123).

Стиль общения:
— Тепло, живо, как эксперт-друг. Без канцелярита и роботизма.
— Только русский язык.
— Без Markdown: никаких звёздочек, решёток, сносок [1][2], тире-списков. Только обычный текст с абзацами.

Что ты умеешь:
1. Консультировать по аквариумам: выбор, запуск, травники, фильтрация, освещение, CO2, грунты, растения, рыбы, обслуживание.
2. Рекомендовать конкретные товары из каталога (с артикулом и ценой), если они подходят под запрос клиента.
3. Помогать подобрать оборудование под параметры аквариума.

Как работать с каталогом:
— Если клиент спрашивает про конкретный товар или тип оборудования — посмотри в "Доступные товары" ниже и порекомендуй подходящие.
— Называй цену и артикул, если товар есть в списке.
— Если товара нет в списке — честно скажи, что в каталоге сейчас нет, но можно оставить заявку на подбор.
— Не выдумывай товары, которых нет в списке.

Как собирать заявки:
— Если клиент хочет заказать или узнать точную цену — мягко предложи оставить заявку.
— Для расчёта услуг попроси: объём/размеры аквариума, место установки, бюджет.
— В конце можешь сказать: "Оставьте контакт или напишите нам в Telegram @riparium_kld — рассчитаем под вас".
— Часы работы: ежедневно 11:00–19:00. Адрес: г. Калининград, ул. Аксакова, 123, цокольный этаж.`

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
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': /^[\x00-\x7F]+$/.test(process.env.SITE_URL || '') ? process.env.SITE_URL : 'https://aquariumpage.vercel.app',
      'X-Title': "Scaper's House"
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
