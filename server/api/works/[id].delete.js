import { supabase } from '~/server/utils/supabase'
import { createLogger } from '~/server/utils/logger.js'
import { requireAdmin } from '~/server/utils/admin-auth.js'

export default defineEventHandler(async (event) => {
  const log = createLogger(event, 'works-delete')
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')

  const { error } = await supabase.from('works').delete().eq('id', id)
  if (error) {
    log.error('Delete failed:', error)
    throw createError({ statusCode: 500, statusMessage: `Не удалось удалить работу (ref: ${log.requestId})` })
  }
  return { ok: true }
})
