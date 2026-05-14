import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'product-delete')
  const password = getHeader(event, 'x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({ statusCode: 403, message: 'Неверный пароль' })
  }

  const id = getRouterParam(event, 'id')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    log.error('Delete failed:', error)
    throw createError({ statusCode: 500, message: `Не удалось удалить товар (ref: ${log.requestId})` })
  }

  return { ok: true }
})
