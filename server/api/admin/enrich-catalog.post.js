import { supabase } from '~/server/utils/supabase'
import { requireAdmin } from '~/server/utils/admin-auth.js'
import { enrichProductDescription } from '~/server/utils/ai.js'

// За один HTTP-вызов обрабатываем небольшую пачку (Grok с веб-поиском медленный, ~15-30с/товар).
// 4 параллельно — запас по 60с-таймауту Vercel (один медленный товар тянет весь запрос).
// UI дёргает эндпоинт повторно пока remaining>0 — так Макс жмёт кнопку один раз.
const BATCH = 4

// Разворачиваем категорию в список id со всеми потомками (товары висят на листьях)
function descendants (cats, rootId) {
  const ids = [rootId]
  for (const c of cats.filter(c => c.parent_id === rootId)) {
    ids.push(...descendants(cats, c.id))
  }
  return ids
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!process.env.OPENROUTER_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OPENROUTER_API_KEY не задан в env' })
  }

  const body = await readBody(event) || {}
  const mode = body.mode || 'all'          // 'all' | 'new' | 'category' | 'one'
  const categorySlug = body.category || null
  const article = body.article || null

  // ── Конкретный товар: обогащаем даже если описание уже есть (ручной перезапуск) ──
  if (mode === 'one') {
    if (!article) throw createError({ statusCode: 400, statusMessage: 'Для режима one нужен article' })
    const { data: prod, error } = await supabase
      .from('products').select('id, name, article').eq('article', article).maybeSingle()
    if (error) throw createError({ statusCode: 500, statusMessage: 'Supabase: ' + error.message })
    if (!prod) throw createError({ statusCode: 404, statusMessage: 'Товар не найден' })

    const { description, found } = await enrichProductDescription(prod, { signal: event.node.req.signal })
    await supabase.from('products').update({ description }).eq('id', prod.id)
    return { processed: 1, enriched: found ? 1 : 0, empty: found ? 0 : 1, remaining: 0, errors: [], samples: found ? [{ name: prod.name, description }] : [] }
  }

  // ── Пачка товаров без описания ──
  let query = supabase
    .from('products')
    .select('id, name, article')
    .is('description', null)
    .limit(BATCH)

  if (mode === 'new') {
    query = query.eq('is_new', true)
  }

  if (categorySlug) {
    const { data: cats } = await supabase.from('categories').select('id, parent_id, slug')
    const target = (cats || []).find(c => c.slug === categorySlug)
    if (target) query = query.in('category_id', descendants(cats, target.id))
  }

  const { data: products, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: 'Supabase: ' + error.message })

  if (!products || products.length === 0) {
    return { processed: 0, enriched: 0, empty: 0, remaining: 0, errors: [], samples: [], done: true }
  }

  let enriched = 0
  let empty = 0
  const errors = []
  const samples = []

  // Параллельно по пачке
  const results = await Promise.all(products.map(async (p) => {
    try {
      const { description, found } = await enrichProductDescription(p, { signal: event.node.req.signal })
      return { id: p.id, name: p.name, description, found }
    } catch (err) {
      return { id: p.id, name: p.name, error: err.message }
    }
  }))

  for (const r of results) {
    if (r.error) {
      errors.push(`${r.name}: ${r.error}`)
      continue
    }
    // NO_DATA → пишем '' (помечает «обработан, данных нет»), чтобы не гонять повторно
    const { error: upErr } = await supabase
      .from('products').update({ description: r.description }).eq('id', r.id)
    if (upErr) {
      errors.push(`update ${r.name}: ${upErr.message}`)
      continue
    }
    if (r.found) {
      enriched++
      if (samples.length < 3) samples.push({ name: r.name, description: r.description })
    } else {
      empty++
    }
  }

  // Сколько ещё осталось без описания (с учётом фильтров)
  let countQuery = supabase
    .from('products').select('id', { count: 'exact', head: true })
    .is('description', null)
  if (mode === 'new') countQuery = countQuery.eq('is_new', true)
  if (categorySlug) {
    const { data: cats } = await supabase.from('categories').select('id, parent_id, slug')
    const target = (cats || []).find(c => c.slug === categorySlug)
    if (target) countQuery = countQuery.in('category_id', descendants(cats, target.id))
  }
  const { count: remaining } = await countQuery

  return {
    processed: products.length,
    enriched,
    empty,
    remaining: remaining || 0,
    errors: errors.slice(0, 5),
    samples,
    done: !remaining || remaining === 0
  }
})
