import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

  const body = await readBody(event)

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
