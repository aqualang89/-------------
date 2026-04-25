import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = query.category
  const search = query.search
  const minPrice = query.minPrice ? parseFloat(query.minPrice) : null
  const maxPrice = query.maxPrice ? parseFloat(query.maxPrice) : null
  const page = parseInt(query.page) || 1
  const limit = parseInt(query.limit) || 24

  let dbQuery = supabase
    .from('products')
    .select('*, categories(name, slug), product_photos(url, is_main)', { count: 'exact' })
    .eq('is_available', true)

  if (categorySlug) {
    dbQuery = dbQuery.eq('categories.slug', categorySlug)
  }

  if (search) {
    dbQuery = dbQuery.or(`name.ilike.%${search}%,article.ilike.%${search}%`)
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
    totalPages: Math.ceil((count || 0) / limit)
  }
})
