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

  const { data: allProducts } = await supabase.from('products').select('id, name, article')
  const productByName = {}
  for (const p of allProducts || []) {
    productByName[p.name] = p
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

  let created = 0
  const IBATCH = 30
  for (let i = 0; i < inserts.length; i += IBATCH) {
    const batch = inserts.slice(i, i + IBATCH)
    const { error } = await supabase.from('products').insert(batch)
    if (!error) created += batch.length
  }

  return { updated, created, errors: errors.length ? errors : [] }
})
