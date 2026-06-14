import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

const itemSchema = z.object({
  name: z.string().min(1).max(300),
  article: z.string().max(100).optional(),
  slug: z.string().max(200).optional(),
  price: z.number().nonnegative().max(10_000_000),
  qty: z.number().nonnegative().max(1_000_000)
})

const schema = z.object({
  items: z.array(itemSchema).max(5000).default([])
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const { items } = await validateBody(event, schema)

  if (!items.length) {
    return { updated: 0, created: 0, errors: [] }
  }

  const { data: allProducts } = await supabase.from('products').select('id, name, article, slug')
  const productByName = {}
  const artSet = new Set()
  const slugSet = new Set()
  for (const p of allProducts || []) {
    productByName[p.name] = p
    if (p.article) artSet.add(p.article)
    if (p.slug) slugSet.add(p.slug)
  }

  // 1С переназначает артикулы - у нового товара article/slug может совпасть с существующим (UNIQUE).
  // Подбираем свободное значение, иначе insert молча падал и товар терялся.
  const uniq = (desired, set, base) => {
    let v = desired
    let i = 2
    while (!v || set.has(v)) { v = `${base}-${i}`; i++ }
    set.add(v)
    return v
  }

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
        article: uniq(item.article, artSet, item.article || `NEW-${Date.now()}`),
        name: item.name,
        slug: uniq(item.slug, slugSet, item.slug || `p-${Date.now()}`),
        category_id: novinkiId,
        price: item.price,
        is_available: item.qty > 0,
        is_new: true
      })
    }
  }

  let updated = 0
  const UBATCH = 30
  for (let i = 0; i < updates.length; i += UBATCH) {
    const batch = updates.slice(i, i + UBATCH)
    const results = await Promise.all(
      batch.map(u => supabase.from('products').update({ price: u.price, is_available: u.is_available }).eq('id', u.id))
    )
    for (const r of results) {
      if (r.error) errors.push(`Ошибка обновления: ${r.error.message}`)
      else updated++
    }
  }

  // По одному, чтобы одна коллизия не валила всю пачку и чтобы видеть конкретную ошибку.
  let created = 0
  for (const row of inserts) {
    const { error } = await supabase.from('products').insert(row)
    if (error) errors.push(`Не добавлен "${row.name}": ${error.message}`)
    else created++
  }

  return { updated, created, errors: errors.length ? errors : [] }
})
