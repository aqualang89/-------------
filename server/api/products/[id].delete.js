import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'product-delete')
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    log.error('Delete failed:', error)
    // 23503 = foreign_key_violation — товар связан с order_items / другими таблицами.
    // Возвращаем понятную причину, чтобы UI показал её юзеру.
    if (error.code === '23503') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Товар нельзя удалить — он есть в существующих заказах. Запустите миграцию order_items ON DELETE SET NULL в Supabase.'
      })
    }
    throw createError({ statusCode: 500, statusMessage: `Не удалось удалить товар (ref: ${log.requestId})` })
  }

  return { ok: true }
})
