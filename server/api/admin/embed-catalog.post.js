import { supabase } from '~/server/utils/supabase'
import { requireAdmin } from '~/server/utils/admin-auth.js'

const EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent'
const EMBED_DIM = 768
const BATCH_SIZE = 30   // 30 параллельных запросов в Gemini за один батч
const MAX_BATCHES_PER_CALL = 4  // 30*4 = 120 товаров за один HTTP вызов (укладывается в 60с Vercel)

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'GOOGLE_AI_API_KEY не задан в env Vercel' })
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, article')
    .is('embedding', null)
    .limit(BATCH_SIZE * MAX_BATCHES_PER_CALL)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase: ' + error.message })
  }

  if (!products || products.length === 0) {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null)
    return { done: true, processed_total: count || 0, message: 'Все товары проиндексированы' }
  }

  let processed = 0
  const errors = []

  // Обрабатываем батчами параллельно
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE)

    const results = await Promise.all(batch.map(async (product) => {
      const text = [
        product.name,
        product.description || '',
        product.article ? `артикул ${product.article}` : ''
      ].filter(Boolean).join('. ').slice(0, 2000)

      try {
        const res = await fetch(`${EMBED_URL}?key=${apiKey}`, {
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
          return { id: product.id, error: `${res.status}: ${errText.slice(0, 100)}` }
        }
        const data = await res.json()
        const values = data?.embedding?.values
        if (!Array.isArray(values)) {
          return { id: product.id, error: 'Empty response' }
        }
        return { id: product.id, embedding: values }
      } catch (err) {
        return { id: product.id, error: err.message }
      }
    }))

    // Обновляем БД
    for (const r of results) {
      if (r.embedding) {
        const { error: upErr } = await supabase
          .from('products')
          .update({ embedding: r.embedding })
          .eq('id', r.id)
        if (upErr) {
          errors.push(`update ${r.id}: ${upErr.message}`)
        } else {
          processed++
        }
      } else {
        errors.push(`embed ${r.id}: ${r.error}`)
      }
    }
  }

  // Сколько ещё осталось
  const { count: remaining } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)

  return {
    done: !remaining || remaining === 0,
    processed,
    remaining: remaining || 0,
    errors: errors.slice(0, 5)
  }
})
