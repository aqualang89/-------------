import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'

// Список работ. Публично — только опубликованные. С админ-паролем — все (для админки).
export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'works-get')
  const pwd = getHeader(event, 'x-admin-password')
  const isAdmin = pwd && pwd === process.env.ADMIN_PASSWORD

  let q = supabase.from('works')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (!isAdmin) q = q.eq('is_published', true)

  const { data, error } = await q
  if (error) {
    log.error('List failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось загрузить работы (ref: ${log.requestId})` })
  }
  return { works: data || [] }
})
