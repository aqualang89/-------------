import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

  const body = await readBody(event)
  const items = body.items || []

  if (!items.length) {
    return { updated: 0, created: 0, errors: [] }
  }

  // Загружаем все товары из Supabase в память (один запрос)
  const { data: allProducts } = await supabase.from('products').select('id, name, article')
  const productByName = {}
  for (const p of allProducts || []) {
    productByName[p.name] = p
  }

  // Категория "НОВИНКИ"
  const novinkiSlug = 'novinki'
  let novinkiId = null
  const { data: novCat } = await supabase.from('categories').select('id').eq('slug', novinkiSlug).maybeSingle()
  if (novCat) {
    novinkiId = novCat.id
  } else {
    const { data: nc } = await supabase.from('categories').insert({ name: 'НОВИНКИ', slug: novinkiSlug, level: 1 }).select('id').single()
    novinkiId = nc.id
  }

  const updates = []
  const inserts = []
  const errors = []

  for (const item of items) {
    const existing = productByName[item.name]
    if (existing) {
      updates.push({
        id: existing.id,
        price: item.price,
        is_available: item.qty > 0
      })
    } else {
      inserts.push({
        article: item.article || `NEW-${Date.now()}`,
        name: item.name,
        slug: item.slug || `p-${Date.now()}`,
        category_id: novinkiId,
        price: item.price,
        is_available: item.qty > 0,
        is_new: true
      })
    }
  }

  // Batch update через Promise.all (30 штук параллельно)
  let updated = 0
  const UBATCH = 30
  for (let i = 0; i < updates.length; i += UBATCH) {
    const batch = updates.slice(i, i + UBATCH)
    const results = await Promise.all(
      batch.map(u => supabase.from('products').update({ price: u.price, is_available: u.is_available }).eq('id', u.id))
    )
    for (const r of results) {
      if (!r.error) updated++
    }
  }

  // Batch insert
  let created = 0
  const IBATCH = 30
  for (let i = 0; i < inserts.length; i += IBATCH) {
    const batch = inserts.slice(i, i + IBATCH)
    const { error } = await supabase.from('products').insert(batch)
    if (!error) created += batch.length
  }

  return { updated, created, errors: errors.length ? errors : [] }
})
