import { supabase } from '~/server/utils/supabase'

function getDescendantIds(cats, parentId) {
  const ids = [parentId]
  const children = cats.filter(c => c.parent_id === parentId)
  for (const child of children) {
    ids.push(...getDescendantIds(cats, child.id))
  }
  return ids
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = query.category
  const search = query.search
  const minPrice = query.minPrice ? parseFloat(query.minPrice) : null
  const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : null
  const page = parseInt(query.page) || 1
  const limit = parseInt(query.limit) || 24

  const showUnavailable = query.showUnavailable === 'true'

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return { products: [], total: 0, page, totalPages: 0, maxPrice: 200000 }
  }

  let maxDbPrice = 200000
  try {
    const { data: priceAgg } = await supabase
      .from('products')
      .select('price')
      .order('price', { ascending: false })
      .limit(1)
    if (priceAgg?.[0]?.price) maxDbPrice = priceAgg[0].price
  } catch (e) {
    // fallback
  }

  let dbQuery = supabase
    .from('products')
    .select('*, categories(name, slug, parent_id), product_photos(url, is_main)', { count: 'exact' })
  if (!showUnavailable) {
    dbQuery = dbQuery.eq('is_available', true)
  }

  const { data: allCats } = await supabase.from('categories').select('id, parent_id, name, slug')

  // Скрываем категорию "Морская аквариумистика"
  const hiddenRoots = (allCats || []).filter(c =>
    c.slug === 'morskaya-akvariumistika' || /^морск/i.test(c.name)
  )
  const hiddenIds = new Set()
  function addWithChildren(parentId) {
    hiddenIds.add(parentId)
    const children = (allCats || []).filter(c => c.parent_id === parentId)
    for (const child of children) addWithChildren(child.id)
  }
  for (const r of hiddenRoots) addWithChildren(r.id)
  if (hiddenIds.size) {
    dbQuery = dbQuery.not('category_id', 'in', `(${Array.from(hiddenIds).join(',')})`)
  }

  let categoryIds = null
  if (categorySlug) {
    const target = (allCats || []).find(c => c.slug === categorySlug)
    if (target) {
      categoryIds = getDescendantIds(allCats || [], target.id)
      dbQuery = dbQuery.in('category_id', categoryIds)
    }
  }

  if (search) {
    const safe = search.replace(/[%_,*]/g, '')
    if (safe) {
      dbQuery = dbQuery.or(`name.ilike.%${safe}%,article.ilike.%${safe}%`)
    }
  }

  if (minPrice !== null) {
    dbQuery = dbQuery.gte('price', minPrice)
  }

  if (maxPrice !== null) {
    dbQuery = dbQuery.lte('price', maxPrice)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await dbQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return {
    products: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
    maxPrice: maxDbPrice
  }
})
