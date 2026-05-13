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

  const body = await readBody(event)

  // Если ставим is_main: true — сначала снимаем флаг с остальных фото товара
  if (body.is_main === true) {
    const { data: photo } = await supabase
      .from('product_photos')
      .select('product_id')
      .eq('id', id)
      .single()
    if (photo) {
      await supabase
        .from('product_photos')
        .update({ is_main: false })
        .eq('product_id', photo.product_id)
        .neq('id', id)
    }
  }

  const updates = {}
  if (typeof body.is_main === 'boolean') updates.is_main = body.is_main
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) {
    return { ok: true, noop: true }
  }

  const { error } = await supabase
    .from('product_photos')
    .update(updates)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
