import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'

// Список статей. Публично — только опубликованные. С админ-паролем — все (для админки).
export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'articles-get')
  const pwd = getHeader(event, 'x-admin-password')
  const isAdmin = pwd && pwd === process.env.ADMIN_PASSWORD

  // Карточкам список не нужен content (тяжёлый) — берём поля для превью
  const cols = isAdmin ? '*' : 'id, slug, title, excerpt, cover_url, published_at, created_at'
  let q = supabase.from('articles')
    .select(cols)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (!isAdmin) q = q.eq('is_published', true)

  const { data, error } = await q
  if (error) {
    log.error('List failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось загрузить статьи (ref: ${log.requestId})` })
  }
  return { articles: data || [] }
})
