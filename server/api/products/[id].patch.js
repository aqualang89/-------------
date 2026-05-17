import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

const schema = z.object({
  name: z.string().min(1).max(300),
  price: z.number().nonnegative().max(10_000_000),
  category_id: z.number().int().positive().nullable().optional(),
  description: z.string().max(10_000).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'product-patch')
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  const body = await validateBody(event, schema)

  const { error } = await supabase
    .from('products')
    .update({
      name: body.name,
      price: body.price,
      category_id: body.category_id ?? null,
      description: body.description ?? null
    })
    .eq('id', id)

  if (error) {
    log.error('Update failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось обновить товар (ref: ${log.requestId})` })
  }

  return { ok: true }
})
