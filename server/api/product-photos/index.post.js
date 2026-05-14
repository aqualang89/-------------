import { z } from 'zod'
import { supabase } from '~/server/utils/supabase'
import { validateBody } from '~/server/utils/validate.js'

const schema = z.object({
  product_id: z.number().int().positive(),
  url: z.string().url().max(1000),
  is_main: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

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
