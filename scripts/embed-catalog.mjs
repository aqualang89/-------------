// Скрипт первичной индексации каталога — генерит embedding для каждого товара через Gemini API
// Запуск: node scripts/embed-catalog.mjs
// Требует в .env: SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_AI_API_KEY
// Опционально: BATCH_SIZE (по умолчанию 20), DELAY_MS (по умолчанию 50)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Нет SUPABASE_URL или SUPABASE_SERVICE_KEY в env')
  process.exit(1)
}
if (!GOOGLE_AI_API_KEY) {
  console.error('Нет GOOGLE_AI_API_KEY в env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_AI_API_KEY}`
const EMBED_DIM = 768
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 20)
const DELAY_MS = Number(process.env.DELAY_MS || 50)

async function embedText(text) {
  const res = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
      outputDimensionality: EMBED_DIM
    })
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Embedding ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const values = data?.embedding?.values
  if (!Array.isArray(values)) throw new Error('Empty embedding response')
  return values
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Загружаем товары без embedding...')

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, article')
    .is('embedding', null)

  if (error) {
    console.error('Ошибка загрузки товаров:', error.message)
    process.exit(1)
  }

  console.log(`Найдено ${products.length} товаров без embedding`)
  if (products.length === 0) {
    console.log('Нечего индексировать. Если хотите переиндексировать всё — сначала UPDATE products SET embedding=NULL')
    return
  }

  let done = 0
  let failed = 0
  const startTime = Date.now()

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)
    const updates = []

    for (const product of batch) {
      const textToEmbed = [
        product.name,
        product.description || '',
        product.article ? `артикул ${product.article}` : ''
      ].filter(Boolean).join('. ').slice(0, 2000)

      try {
        const embedding = await embedText(textToEmbed)
        updates.push({ id: product.id, embedding })
        done++
      } catch (err) {
        console.error(`  Ошибка на товаре ${product.id} (${product.name}):`, err.message)
        failed++
      }
      if (DELAY_MS > 0) await sleep(DELAY_MS)
    }

    // Обновляем БД пачкой
    for (const u of updates) {
      const { error: upErr } = await supabase
        .from('products')
        .update({ embedding: u.embedding })
        .eq('id', u.id)
      if (upErr) {
        console.error(`  Ошибка апдейта товара ${u.id}:`, upErr.message)
        failed++
        done--
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const progress = ((i + batch.length) / products.length * 100).toFixed(1)
    console.log(`[${progress}%] Обработано ${done}/${products.length} (${elapsed}с, ошибок: ${failed})`)
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\nГотово. Проиндексировано ${done} товаров за ${totalElapsed}с. Ошибок: ${failed}`)
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
