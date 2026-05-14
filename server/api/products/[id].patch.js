import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'product-patch')
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
    log.error('Update failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось обновить товар (ref: ${log.requestId})` })
  }

  return { ok: true }
})
