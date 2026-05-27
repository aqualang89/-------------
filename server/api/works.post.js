import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'
import { uniqueSlug } from '~/server/utils/slug.js'

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20000).optional().default(''),
  cover_url: z.string().url().nullable().optional(),
  photos: z.array(z.string().url()).max(30).optional().default([]),
  is_published: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0)
})

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'works-post')
  await requireAdmin(event)
  const body = await validateBody(event, schema)
  const slug = await uniqueSlug('works', body.title)

  const { data, error } = await supabase.from('works').insert({
    slug,
    title: body.title,
    description: body.description,
    cover_url: body.cover_url ?? null,
    photos: body.photos,
    is_published: body.is_published,
    sort_order: body.sort_order
  }).select().single()

  if (error) {
    log.error('Create failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось создать работу (ref: ${log.requestId})` })
  }
  return data
})
