import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { validateBody } from '~/server/utils/validate.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

const schema = z.object({
  product_id: z.number().int().positive(),
  url: z.string().url().max(1000),
  is_main: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await validateBody(event, schema)

  const { error } = await supabase
    .from('product_photos')
    .insert({
      product_id: body.product_id,
      url: body.url,
      is_main: body.is_main || false
    })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
