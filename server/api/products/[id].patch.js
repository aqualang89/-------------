import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { error } = await supabase
    .from('products')
    .update({
      name: body.name,
      price: body.price,
      category_id: body.category_id,
      description: body.description
    })
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ok: true }
})
