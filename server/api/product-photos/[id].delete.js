import { supabase } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, statusMessage: 'Неверный пароль' })
  }

  const id = parseInt(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный id' })
  }

  const { error } = await supabase
    .from('product_photos')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
