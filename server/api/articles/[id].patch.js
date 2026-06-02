import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'
import { BLOG_CATEGORY_SLUGS } from '~/utils/blogCategories.js'

// slug при правке НЕ меняем — стабильные ссылки.
const schema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().default(''),
  content: z.string().max(60000).optional().default(''),
  cover_url: z.string().url().nullable().optional(),
  category: z.enum(BLOG_CATEGORY_SLUGS).nullable().optional(),
  is_published: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'articles-patch')
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await validateBody(event, schema)

  // published_at ставим в момент ПЕРВОЙ публикации, дальше не трогаем
  const fields = {
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    cover_url: body.cover_url ?? null,
    category: body.category ?? null,
    is_published: body.is_published
  }
  if (body.is_published) {
    const { data: cur } = await supabase.from('articles').select('published_at').eq('id', id).maybeSingle()
    if (cur && !cur.published_at) fields.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('articles').update(fields).eq('id', id)
  if (error) {
    log.error('Update failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось обновить статью (ref: ${log.requestId})` })
  }
  return { ok: true }
})
