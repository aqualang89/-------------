import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'
import { uniqueSlug } from '~/server/utils/slug.js'

const schema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).optional().default(''),
  content: z.string().max(60000).optional().default(''),
  cover_url: z.string().url().nullable().optional(),
  is_published: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'articles-post')
  await requireAdmin(event)
  const body = await validateBody(event, schema)
  const slug = await uniqueSlug('articles', body.title)

  const { data, error } = await supabase.from('articles').insert({
    slug,
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    cover_url: body.cover_url ?? null,
    is_published: body.is_published,
    published_at: body.is_published ? new Date().toISOString() : null
  }).select().single()

  if (error) {
    log.error('Create failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось создать статью (ref: ${log.requestId})` })
  }
  return data
})
