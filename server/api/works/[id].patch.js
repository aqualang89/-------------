import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

// slug при правке НЕ меняем — чтобы не ломать существующие ссылки.
const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(20000).optional().default(''),
  cover_url: z.string().url().nullable().optional(),
  photos: z.array(z.string().url()).max(30).optional().default([]),
  is_published: z.boolean().optional().default(false),
  sort_order: z.number().int().optional().default(0)
})

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'works-patch')
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await validateBody(event, schema)

  const { error } = await supabase.from('works').update({
    title: body.title,
    description: body.description,
    cover_url: body.cover_url ?? null,
    photos: body.photos,
    is_published: body.is_published,
    sort_order: body.sort_order
  }).eq('id', id)

  if (error) {
    log.error('Update failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось обновить работу (ref: ${log.requestId})` })
  }
  return { ok: true }
})
