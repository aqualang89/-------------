import { supabase } from '~/server/utils/supabase'
import { requireAdmin } from '~/server/utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const status = query.status || null
  const page = parseInt(query.page) || 1
  const limit = parseInt(query.limit) || 20
  const offset = (page - 1) * limit

  let dbQuery = supabase
    .from('orders')
    .select('*, order_items(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    dbQuery = dbQuery.eq('status', status)
  }

  const { data, error, count } = await dbQuery

  if (error) {
    console.error('Orders fetch error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch orders' })
  }

  return {
    orders: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  }
})
